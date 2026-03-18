import { ClaudeAgent, ReasoningResult } from "./claude.js";
import { IPFSStorage, ProposalBlob } from "./ipfs.js";
import { VaultContract, TreasuryState, Goal, ProposalSummary } from "./contract.js";
import cron from "node-cron";

export interface AgentConfig {
  claudeApiKey: string;
  web3StorageToken: string;
  rpcUrl: string;
  contractAddress: string;
  agentPrivateKey?: string;
  cycleInterval?: string; // cron expression, default: "*/30 * * * *"
  minConfidence?: number;
}

export interface CycleResult {
  cycleNumber: number;
  timestamp: string;
  action: string;
  proposalId?: number;
  ipfsHash?: string;
  confidence: number;
  reasoning: string;
  error?: string;
}

export class NeuroVaultAgent {
  private claude: ClaudeAgent;
  private ipfs: IPFSStorage;
  private contract: VaultContract;
  private cycleCount = 0;
  private isRunning = false;
  private lastProposalTime = 0;
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
    this.claude = new ClaudeAgent(config.claudeApiKey);
    this.ipfs = new IPFSStorage(config.web3StorageToken);
    this.contract = new VaultContract(
      config.rpcUrl,
      config.contractAddress,
      config.agentPrivateKey
    );
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("Agent already running");
      return;
    }

    this.isRunning = true;
    console.log("🤖 NeuroVault Agent starting...");
    console.log(`📍 Contract: ${this.config.contractAddress}`);
    console.log(`⏱️  Cycle: ${this.config.cycleInterval || "*/30 * * * *"}`);

    // Run immediate first cycle
    await this.runCycle();

    // Schedule regular cycles
    cron.schedule(this.config.cycleInterval || "*/30 * * * *", async () => {
      if (!this.isRunning) return;
      await this.runCycle();
    });

    console.log("✅ Agent running");
  }

  stop(): void {
    this.isRunning = false;
    console.log("🛑 Agent stopped");
  }

  private async runCycle(): Promise<CycleResult> {
    this.cycleCount++;
    const cycleNumber = this.cycleCount;
    const timestamp = new Date().toISOString();

    console.log(`\n🔄 Cycle #${cycleNumber} starting at ${timestamp}`);

    try {
      // 1. Read on-chain state
      const treasuryState = await this.contract.getTreasuryState();
      const goals = await this.contract.getActiveGoals();
      const recentProposals = await this.contract.getRecentProposals(5);

      console.log(`💰 Treasury: $${treasuryState.totalValue} | DOT: ${treasuryState.dotBalance} | USDC: ${treasuryState.usdcBalance}`);
      console.log(`🎯 Goals: ${goals.filter(g => g.status === 1).length} active`);

      // 2. Ask Claude to reason
      const reasoning = await this.claude.reason(treasuryState, goals, recentProposals);
      console.log(`🧠 Claude confidence: ${reasoning.confidence}%`);
      console.log(`📋 Proposed action: ${reasoning.action} - ${reasoning.description}`);

      // 3. Check if we should propose
      if (reasoning.action === "none" || reasoning.confidence < (this.config.minConfidence || 70)) {
        console.log(`⏭️  No proposal - confidence too low or no action needed`);
        return {
          cycleNumber,
          timestamp,
          action: "none",
          confidence: reasoning.confidence,
          reasoning: reasoning.reasoning,
        };
      }

      // 4. Prevent duplicate proposals too quickly
      const now = Date.now();
      if (now - this.lastProposalTime < 5 * 60 * 1000) { // 5 min cooldown
        console.log(`⏭️  Cooldown active - skipping proposal`);
        return {
          cycleNumber,
          timestamp,
          action: "cooldown",
          confidence: reasoning.confidence,
          reasoning: reasoning.reasoning,
        };
      }

      // 5. Pin to IPFS
      const blob: ProposalBlob = {
        proposalId: cycleNumber,
        timestamp,
        model: "claude-sonnet-4-20250514",
        confidence: reasoning.confidence,
        reasoning: reasoning.reasoning,
        context: {
          treasuryState: {
            totalValue: treasuryState.totalValue,
            dotBalance: treasuryState.dotBalance,
            usdcBalance: treasuryState.usdcBalance,
            apy: treasuryState.apy,
          },
          goals: goals.filter(g => g.status === 1).map(g => ({ id: g.id, text: g.text })),
        },
        proposedAction: {
          type: reasoning.action,
          description: reasoning.description,
          amount: reasoning.amount,
          token: reasoning.token,
          targetToken: reasoning.targetToken,
        },
      };

      const ipfsHash = await this.ipfs.pinProposal(blob);
      console.log(`📌 IPFS: ${ipfsHash}`);

      // 6. Submit to contract (if we have private key)
      let proposalId: number | undefined;
      if (this.config.agentPrivateKey) {
        const actionTypes: Record<string, number> = {
          swap: 0, stake: 1, transfer: 2, rebalance: 3, none: 4,
        };

        const txHash = await this.contract.submitProposal({
          ipfsHash,
          actionType: actionTypes[reasoning.action] ?? 4,
          description: reasoning.description,
          amount: BigInt(parseFloat(reasoning.amount) * 10 ** 18),
          token: reasoning.token === "DOT" ? "0x..." : "0x...", // Token addresses
          targetToken: reasoning.targetToken || "0x0000000000000000000000000000000000000000",
          confidence: reasoning.confidence,
        });

        console.log(`⛓️  Transaction: ${txHash}`);
        proposalId = cycleNumber;
        this.lastProposalTime = now;
      } else {
        console.log(`⚠️  No private key - proposal not submitted on-chain`);
      }

      return {
        cycleNumber,
        timestamp,
        action: reasoning.action,
        proposalId,
        ipfsHash,
        confidence: reasoning.confidence,
        reasoning: reasoning.reasoning,
      };

    } catch (error) {
      console.error(`❌ Cycle #${cycleNumber} failed:`, error);
      return {
        cycleNumber,
        timestamp,
        action: "error",
        confidence: 0,
        reasoning: "",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  getStatus(): { isRunning: boolean; cycleCount: number; lastProposalTime: number } {
    return {
      isRunning: this.isRunning,
      cycleCount: this.cycleCount,
      lastProposalTime: this.lastProposalTime,
    };
  }
}
