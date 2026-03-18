import Anthropic from "@anthropic-ai/sdk";

export interface ReasoningResult {
  action: "swap" | "stake" | "transfer" | "rebalance" | "none";
  description: string;
  amount: string;
  token: string;
  targetToken?: string;
  confidence: number;
  reasoning: string;
  context: {
    treasuryState: TreasuryState;
    goals: Goal[];
    recentProposals: ProposalSummary[];
  };
}

interface TreasuryState {
  totalValue: string;
  dotBalance: string;
  usdcBalance: string;
  activeProposals: number;
  apy: string;
}

interface Goal {
  id: number;
  text: string;
  status: number;
}

interface ProposalSummary {
  id: number;
  status: number;
  outcome?: string;
}

const SYSTEM_PROMPT = `You are NeuroVault, an AI treasury management agent. Your job is to manage a shared multi-sig treasury on Polkadot Hub.

CRITICAL RULES:
1. NEVER propose actions that exceed the treasury balance
2. ALWAYS explain your reasoning in plain English
3. Provide a confidence score (0-100) based on market data and treasury state
4. Consider staker-approved goals when making decisions
5. If the treasury is balanced and no action is needed, return action "none"

When analyzing, consider:
- Current DOT/USDC ratio and market volatility
- Staker-approved goals (especially yield targets and risk tolerance)
- Recent proposal outcomes (learn from rejections)
- Cross-chain opportunities via Hyperbridge

Output format: JSON with fields: action, description, amount, token, targetToken?, confidence, reasoning

Remember: Every proposal you make is permanently recorded on-chain via IPFS hash. Stakers will review your full reasoning before voting.`;

export class ClaudeAgent {
  private client: Anthropic;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.CLAUDE_API_KEY;
    if (!key) {
      throw new Error("CLAUDE_API_KEY not set");
    }
    this.client = new Anthropic({ apiKey: key });
  }

  async reason(
    treasuryState: TreasuryState,
    goals: Goal[],
    recentProposals: ProposalSummary[]
  ): Promise<ReasoningResult> {
    const prompt = this.buildPrompt(treasuryState, goals, recentProposals);

    const response = await this.client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from Claude response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      action: parsed.action || "none",
      description: parsed.description || "No action proposed",
      amount: parsed.amount || "0",
      token: parsed.token || "DOT",
      targetToken: parsed.targetToken,
      confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
      reasoning: parsed.reasoning || "No reasoning provided",
      context: {
        treasuryState,
        goals,
        recentProposals,
      },
    };
  }

  private buildPrompt(
    treasuryState: TreasuryState,
    goals: Goal[],
    recentProposals: ProposalSummary[]
  ): string {
    return `Analyze the following treasury state and propose an action:

TREASURY STATE:
- Total Value: $${treasuryState.totalValue}
- DOT Balance: ${treasuryState.dotBalance} DOT
- USDC Balance: $${treasuryState.usdcBalance}
- Current APY: ${treasuryState.apy}%
- Active Proposals: ${treasuryState.activeProposals}

ACTIVE GOALS:
${goals
  .filter((g) => g.status === 1)
  .map((g) => `- Goal #${g.id}: ${g.text}`)
  .join("\n")}

RECENT PROPOSAL OUTCOMES:
${recentProposals
  .slice(-5)
  .map((p) => `- Proposal #${p.id}: ${p.status}${p.outcome ? ` (${p.outcome})` : ""}`)
  .join("\n")}

Provide your analysis and proposed action as JSON.`;
  }
}
