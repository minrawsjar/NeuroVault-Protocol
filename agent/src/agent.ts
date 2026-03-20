import { GeminiAgent, ReasoningResult } from "./gemini.js";
import { VaultContract, TreasuryState, Goal, ProposalSummary } from "./contract.js";
import { commitReasoningBlob } from "./ipfs.js";
import { LitEncryption, EncryptedSecret } from "./lit.js";
import { ethers } from "ethers";
import cron from "node-cron";

export interface AgentConfig {
  geminiApiKey: string;
  rpcUrl: string;
  contractAddress: string;
  agentPrivateKey?: string;
  cycleInterval?: string; // cron expression, default: "*/30 * * * *"
  minConfidence?: number; // 0..1 (default 0.70)
  cooldownMs?: number;
  bifrostApyUrl?: string;
  acalaApyUrl?: string;
  spendingLimitUsd?: number;
  approvedTargets?: string[];
  web3StorageToken?: string;
  enableLit?: boolean;
}

export type TriggerType =
  | "cron"
  | "startup"
  | "manual"
  | "goal_updated"
  | "large_deposit"
  | "proposal_resolved"
  | "external_agent";

export interface CycleResult {
  cycleNumber: number;
  timestamp: string;
  triggerType: TriggerType;
  action: string;
  proposalId?: number;
  ipfsHash?: string;
  confidence: number; // 0..1
  reasoning: string;
  dropped?: "in_progress" | "cooldown";
  validationErrors?: string[];
  error?: string;
}

export class NeuroVaultAgent {
  private llm: GeminiAgent;
  private contract: VaultContract;
  private cycleCount = 0;
  private isServiceRunning = false;
  private cycleInProgress = false;
  private lastCycleCompletedAt = 0;
  private lastCycleResult?: CycleResult;
  private config: AgentConfig;
  private litEncryption?: LitEncryption;
  private encryptedApiKey?: EncryptedSecret;

  constructor(config: AgentConfig) {
    this.config = config;
    this.llm = new GeminiAgent(config.geminiApiKey);
    this.contract = new VaultContract(
      config.rpcUrl,
      config.contractAddress,
      config.agentPrivateKey,
      process.env.ENS_ADDRESS
    );
  }

  async start(): Promise<void> {
    if (this.isServiceRunning) {
      console.log("Agent already running");
      return;
    }

    this.isServiceRunning = true;
    console.log("🤖 NeuroVault Agent starting...");
    console.log(`📍 Contract: ${this.config.contractAddress}`);
    console.log(`⏱️  Cycle: ${this.config.cycleInterval || "*/30 * * * *"}`);

    // Initialize Lit Protocol for key encryption
    if (this.config.enableLit && this.config.agentPrivateKey) {
      try {
        console.log("🔐 Initializing Lit Protocol...");
        const provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
        const signer = new ethers.Wallet(this.config.agentPrivateKey, provider);
        this.litEncryption = new LitEncryption(signer, "ethereum");
        await this.litEncryption.connect();

        // Encrypt the Gemini API key — only the agent wallet can decrypt
        const agentAddress = await signer.getAddress();
        this.encryptedApiKey = await this.litEncryption.encryptSecret(
          this.config.geminiApiKey,
          [agentAddress]
        );
        console.log("🔐 Lit Protocol: API key encrypted and secured");
        console.log(`   Access restricted to: ${agentAddress}`);
      } catch (err) {
        console.warn("⚠️  Lit Protocol init failed (non-fatal):", err);
        // Continue without Lit — agent still works with plaintext key
      }
    } else {
      console.log("🔐 Lit Protocol: disabled (set ENABLE_LIT=true to enable)");
    }

    // Run immediate first cycle
    await this.requestCycle("startup");

    // Schedule regular cycles
    cron.schedule(this.config.cycleInterval || "*/30 * * * *", async () => {
      if (!this.isServiceRunning) return;
      await this.requestCycle("cron");
    });

    console.log("✅ Agent running");
  }

  stop(): void {
    this.isServiceRunning = false;
    if (this.litEncryption) {
      this.litEncryption.disconnect();
      console.log("🔐 Lit Protocol disconnected");
    }
    console.log("🛑 Agent stopped");
  }

  async requestCycle(triggerType: TriggerType): Promise<CycleResult> {
    const now = Date.now();
    const cooldownMs = this.config.cooldownMs ?? 60_000;

    // Stage 1 — Wake and deduplicate
    if (this.cycleInProgress) {
      return {
        cycleNumber: this.cycleCount,
        timestamp: new Date().toISOString(),
        triggerType,
        action: "dropped",
        confidence: 0,
        reasoning: "Trigger dropped: cycle already in progress",
        dropped: "in_progress",
      };
    }

    if (this.lastCycleCompletedAt > 0 && now - this.lastCycleCompletedAt < cooldownMs) {
      return {
        cycleNumber: this.cycleCount,
        timestamp: new Date().toISOString(),
        triggerType,
        action: "dropped",
        confidence: 0,
        reasoning: "Trigger dropped: cooldown active",
        dropped: "cooldown",
      };
    }

    this.cycleInProgress = true;
    const result = await this.runCycle(triggerType);
    this.lastCycleCompletedAt = Date.now();
    this.cycleInProgress = false;
    this.lastCycleResult = result;
    return result;
  }

  private async runCycle(triggerType: TriggerType): Promise<CycleResult> {
    this.cycleCount++;
    const cycleNumber = this.cycleCount;
    const timestamp = new Date().toISOString();

    console.log(`\n🔄 Cycle #${cycleNumber} [${triggerType}] starting at ${timestamp}`);

    try {
      // Stage 2 — Context assembly
      const treasuryState = await this.contract.getTreasuryState();
      const goals = await this.contract.getActiveGoals();
      const recentProposals = await this.contract.getRecentProposals(10);
      const constraints = await this.contract.getGovernanceConstraints({
        fallbackSpendingLimitUsd: this.config.spendingLimitUsd,
        fallbackApprovedTargets: this.config.approvedTargets,
      });
      const yieldData = await this.fetchYieldContext();

      console.log(`💰 Treasury: $${treasuryState.totalValue} | PAS: ${treasuryState.dotBalance} | USDC: ${treasuryState.usdcBalance}`);
      console.log(`🎯 Goals: ${goals.filter(g => g.status === 1).length} active`);

      // Stage 3 — LLM reasoning call
      const reasoning = await this.llm.reason(
        treasuryState,
        goals,
        recentProposals,
        {
          triggerType,
          spendingLimitUsd: constraints.spendingLimitUsd,
          approvedTargets: constraints.approvedTargets,
          yields: yieldData,
        }
      );

      console.log(`🧠 Gemini confidence: ${(reasoning.confidence * 100).toFixed(1)}%`);
      console.log(`📋 Proposed action: ${reasoning.action} - ${reasoning.description}`);

      // Stage 4 — Output validation
      const validation = this.validateReasoning(reasoning, constraints);
      if (!validation.ok) {
        console.log(`⏭️  Validation failed: ${validation.errors.join(" | ")}`);
        return {
          cycleNumber,
          timestamp,
          triggerType,
          action: "validation_failed",
          confidence: reasoning.confidence,
          reasoning: reasoning.reasoning,
          validationErrors: validation.errors,
        };
      }

      if (reasoning.action === "none") {
        console.log("⏭️  No action proposed");
        return {
          cycleNumber,
          timestamp,
          triggerType,
          action: "none",
          confidence: reasoning.confidence,
          reasoning: reasoning.reasoning,
        };
      }

      // Stage 5 — IPFS commitment
      const reasoningBlob = {
        cycleNumber,
        timestamp,
        triggerType,
        context: {
          treasuryState,
          goals,
          recentProposals,
          constraints,
          yieldData,
        },
        modelVersion: reasoning.modelVersion,
        modelResponse: reasoning.rawResponse,
        parsedOutput: {
          action: reasoning.action,
          description: reasoning.description,
          amount: reasoning.amount,
          token: reasoning.token,
          targetToken: reasoning.targetToken,
          confidence: reasoning.confidence,
          reasoning: reasoning.reasoning,
        },
        validationResult: validation,
      };

      const ipfsHash = await commitReasoningBlob(reasoningBlob, {
        web3StorageToken: this.config.web3StorageToken,
      });

      console.log(`📌 IPFS CID: ${ipfsHash}`);

      // Stage 6 — On-chain proposal submission
      let proposalId: number | undefined;
      if (this.config.agentPrivateKey) {
        const actionTypes: Record<string, number> = {
          swap: 0, stake: 1, transfer: 2, rebalance: 3, none: 4,
        };

        const tokens = await this.contract.getVaultTokens();
        const normalizedToken = (reasoning.token || "PAS").toUpperCase();
        const tokenAddress = normalizedToken === "USDC" ? tokens.usdcToken : tokens.dotToken;
        const normalizedTarget = String(reasoning.targetToken || "").trim();
        const targetTokenAddress =
          normalizedTarget.toUpperCase() === "USDC"
            ? tokens.usdcToken
            : ["DOT", "PAS"].includes(normalizedTarget.toUpperCase())
              ? tokens.dotToken
              : /^0x[a-fA-F0-9]{40}$/.test(normalizedTarget)
                ? normalizedTarget
                : "0x0000000000000000000000000000000000000000";
        const amountMultiplier = normalizedToken === "USDC" ? 1e6 : 1e18;
        const amountParsed = Number(reasoning.amount);

        const txHash = await this.contract.submitProposal({
          ipfsHash,
          actionType: actionTypes[reasoning.action] ?? 4,
          description: reasoning.description,
          amount: BigInt(Math.max(0, Math.floor((Number.isFinite(amountParsed) ? amountParsed : 0) * amountMultiplier))),
          token: tokenAddress,
          targetToken: targetTokenAddress,
          confidence: Math.round(reasoning.confidence * 100),
        });

        console.log(`⛓️  Transaction: ${txHash}`);
        proposalId = cycleNumber;
      } else {
        console.log(`⚠️  No private key - proposal not submitted on-chain`);
      }

      // Stage 7 — Cycle completion
      return {
        cycleNumber,
        timestamp,
        triggerType,
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
        triggerType,
        action: "error",
        confidence: 0,
        reasoning: "",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async fetchYieldContext(): Promise<{ bifrostApyPct: number | null; acalaApyPct: number | null }> {
    const getNum = async (url?: string): Promise<number | null> => {
      if (!url) return null;
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        const value = Number(data?.apy ?? data?.apyPct ?? data?.dotApy);
        return Number.isFinite(value) ? value : null;
      } catch {
        return null;
      }
    };

    const [bifrostApyPct, acalaApyPct] = await Promise.all([
      getNum(this.config.bifrostApyUrl),
      getNum(this.config.acalaApyUrl),
    ]);

    return { bifrostApyPct, acalaApyPct };
  }

  private validateReasoning(
    reasoning: ReasoningResult,
    constraints: { spendingLimitUsd: number; approvedTargets: string[] }
  ): { ok: boolean; errors: string[] } {
    const errors: string[] = [];
    const allowedActions = new Set(["swap", "stake", "transfer", "rebalance", "none"]);

    if (!allowedActions.has(reasoning.action)) {
      errors.push(`invalid_action:${reasoning.action}`);
    }

    const amount = Number(reasoning.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      errors.push("invalid_amount");
    }

    if (Number.isFinite(amount) && constraints.spendingLimitUsd > 0 && amount > constraints.spendingLimitUsd) {
      errors.push("amount_exceeds_spending_limit");
    }

    const confidenceThreshold = this.config.minConfidence ?? 0.7;
    if (reasoning.confidence < confidenceThreshold) {
      errors.push("confidence_below_threshold");
    }

    if ((reasoning.reasoning || "").trim().length < 80) {
      errors.push("reasoning_too_short");
    }

    if (reasoning.action !== "none" && reasoning.targetToken && constraints.approvedTargets.length > 0) {
      const allowed = constraints.approvedTargets.map((t) => t.toLowerCase());
      const target = reasoning.targetToken.toLowerCase();
      // Allow symbolic names (DOT, USDC, PAS, vDOT) in addition to addresses
      const knownAliases: Record<string, boolean> = { dot: true, pas: true, usdc: true, vdot: true };
      if (!allowed.includes(target) && !knownAliases[target]) {
        errors.push("target_not_approved");
      }
    }

    return {
      ok: errors.length === 0,
      errors,
    };
  }

  getStatus(): {
    isRunning: boolean;
    cycleInProgress: boolean;
    cycleCount: number;
    lastCycleCompletedAt: number;
    lastCycleResult?: CycleResult;
  } {
    return {
      isRunning: this.isServiceRunning,
      cycleInProgress: this.cycleInProgress,
      cycleCount: this.cycleCount,
      lastCycleCompletedAt: this.lastCycleCompletedAt,
      lastCycleResult: this.lastCycleResult,
    };
  }
}
