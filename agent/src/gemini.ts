export interface ReasoningResult {
  action: "swap" | "stake" | "transfer" | "rebalance" | "none";
  description: string;
  amount: string;
  token: string;
  targetToken?: string;
  confidence: number; // 0..1
  reasoning: string;
  modelVersion: string;
  rawResponse: string;
  context: {
    treasuryState: TreasuryState;
    goals: Goal[];
    recentProposals: ProposalSummary[];
    triggerType?: string;
    spendingLimitUsd?: number;
    approvedTargets?: string[];
    yields?: {
      bifrostApyPct: number | null;
      acalaApyPct: number | null;
    };
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

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const SYSTEM_PROMPT = `You are NeuroVault, an AI treasury management agent. Your job is to manage a shared multi-sig treasury.

CRITICAL RULES:
1. NEVER propose actions that exceed the treasury balance or spending limit.
2. ALWAYS explain your reasoning in plain English.
3. Provide a confidence score in range 0-1.
4. Consider staker-approved goals when making decisions.
5. If no action is needed, return action "none".
6. Output ONLY valid JSON (no markdown, no code fence).

Required JSON fields:
action, description, amount, token, targetToken?, confidence, reasoning`;

export class GeminiAgent {
  private apiKey: string;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY not set");
    }
    this.apiKey = key;
  }

  async reason(
    treasuryState: TreasuryState,
    goals: Goal[],
    recentProposals: ProposalSummary[],
    opts?: {
      triggerType?: string;
      spendingLimitUsd?: number;
      approvedTargets?: string[];
      yields?: {
        bifrostApyPct: number | null;
        acalaApyPct: number | null;
      };
    }
  ): Promise<ReasoningResult> {
    const prompt = this.buildPrompt(treasuryState, goals, recentProposals, opts);
    const raw = await this.generate(prompt);
    const parsed = this.extractAndParseJson(raw);

    return {
      action: parsed.action || "none",
      description: parsed.description || "No action proposed",
      amount: parsed.amount || "0",
      token: parsed.token || "DOT",
      targetToken: parsed.targetToken,
      confidence: this.normalizeConfidence(parsed.confidence),
      reasoning: parsed.reasoning || "No reasoning provided",
      modelVersion: MODEL,
      rawResponse: raw,
      context: {
        treasuryState,
        goals,
        recentProposals,
        triggerType: opts?.triggerType,
        spendingLimitUsd: opts?.spendingLimitUsd,
        approvedTargets: opts?.approvedTargets,
        yields: opts?.yields,
      },
    };
  }

  private async generate(userPrompt: string): Promise<string> {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${SYSTEM_PROMPT}\n\n${userPrompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1200,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Gemini request failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text || typeof text !== "string") {
      throw new Error("Unexpected response type from Gemini");
    }

    return text;
  }

  private extractAndParseJson(raw: string): any {
    try {
      return JSON.parse(raw);
    } catch {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Could not extract JSON from Gemini response");
      }
      return JSON.parse(jsonMatch[0]);
    }
  }

  private buildPrompt(
    treasuryState: TreasuryState,
    goals: Goal[],
    recentProposals: ProposalSummary[],
    opts?: {
      triggerType?: string;
      spendingLimitUsd?: number;
      approvedTargets?: string[];
      yields?: {
        bifrostApyPct: number | null;
        acalaApyPct: number | null;
      };
    }
  ): string {
    return `Analyze the treasury state and propose one action.

TREASURY STATE:
- Total Value: $${treasuryState.totalValue}
- DOT Balance: ${treasuryState.dotBalance} DOT
- USDC Balance: $${treasuryState.usdcBalance}
- Current APY: ${treasuryState.apy}%
- Active Proposals: ${treasuryState.activeProposals}

TRIGGER TYPE:
- ${opts?.triggerType || "cron"}

CONSTRAINTS:
- Spending Limit (USD): ${opts?.spendingLimitUsd ?? 0}
- Approved Targets: ${(opts?.approvedTargets ?? []).join(", ") || "none configured"}

EXTERNAL YIELDS:
- Bifrost APY: ${opts?.yields?.bifrostApyPct ?? "n/a"}%
- Acala APY: ${opts?.yields?.acalaApyPct ?? "n/a"}%

ACTIVE GOALS:
${goals
  .filter((g) => g.status === 1)
  .map((g) => `- Goal #${g.id}: ${g.text}`)
  .join("\n") || "- none"}

RECENT PROPOSAL OUTCOMES:
${recentProposals
  .slice(-10)
  .map((p) => `- Proposal #${p.id}: ${p.status}${p.outcome ? ` (${p.outcome})` : ""}`)
  .join("\n") || "- none"}

Respond with only valid JSON.`;
  }

  private normalizeConfidence(value: unknown): number {
    const num = Number(value);
    if (!Number.isFinite(num)) return 0.5;
    const normalized = num > 1 ? num / 100 : num;
    return Math.min(1, Math.max(0, normalized));
  }
}
