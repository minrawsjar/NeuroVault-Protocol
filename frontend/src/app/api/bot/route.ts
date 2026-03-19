import { NextRequest, NextResponse } from "next/server";
import { encryptWithLit } from "@/lib/lit-protocol";
import { getVaultSnapshot, type VaultSnapshot } from "@/lib/vault";
import { getExternalAgentSummary } from "@/lib/agents";
import { getCrossChainSummary } from "@/lib/crosschain";
import { registerEnsName } from "@/lib/ens";

const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || "").trim();
const LIT_AUTHORIZED_ADDRESSES = (process.env.LIT_AUTHORIZED_ADDRESSES || "")
  .split(",")
  .map((a) => a.trim())
  .filter(Boolean);
const PREFERRED_GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro",
  "gemini-2.0-flash",
];

let cachedModelName: string | null = null;

async function resolveGeminiModel(apiKey: string): Promise<string | null> {
  if (cachedModelName) return cachedModelName;

  const listResponse = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models",
    {
      headers: {
        "x-goog-api-key": apiKey,
      },
    }
  );

  if (!listResponse.ok) {
    return null;
  }

  const listData = await listResponse.json();
  const models: Array<{ name?: string; supportedGenerationMethods?: string[] }> = listData?.models ?? [];

  const generateContentModels = models
    .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
    .map((m) => String(m.name || "").replace("models/", ""))
    .filter(Boolean);

  const preferred = PREFERRED_GEMINI_MODELS.find((m) => generateContentModels.includes(m));
  cachedModelName = preferred ?? generateContentModels[0] ?? null;
  return cachedModelName;
}

function fallbackReply(command: string, snapshot: VaultSnapshot) {
  const lower = command.toLowerCase();
  const agentSummary = getExternalAgentSummary();
  const crosschainSummary = getCrossChainSummary();

  const ensMatch = command.trim().match(/^register\s+ens\s+([a-z0-9-]+\.eth)$/i);
  if (ensMatch) {
    return `ENS registration queued: ${ensMatch[1].toLowerCase()}`;
  }

  if (lower.includes("treasury") && lower.includes("status")) {
    return `Treasury: $${snapshot.totalValueUsd.toLocaleString()} | DOT ${snapshot.dotAllocationPct}% | USDC ${snapshot.usdcAllocationPct}% | APY ${snapshot.apyPct}% | ${snapshot.stakers} stakers`;
  }

  if (lower.startsWith("stake ")) {
    return `Queued simulated stake command: ${command.replace(/^stake\s+/i, "")}`;
  }

  if (lower.includes("governance") || lower.includes("queue")) {
    return "Governance queue: #19 (voting), #18 (ready to execute), #17 (completed)";
  }

  if ((lower.includes("agent") || lower.includes("ens")) && lower.includes("status")) {
    return `External agents: ${agentSummary.active}/${agentSummary.total} active | access: wallet+role | ENS optional: ${agentSummary.primaryEns ?? "not linked"}`;
  }

  if (lower.includes("crosschain") || lower.includes("bridge") || lower.includes("xcm")) {
    return `Cross-chain queue: ${crosschainSummary.queued} queued, ${crosschainSummary.bridging} bridging, ${crosschainSummary.settled} settled via ${crosschainSummary.bridge}`;
  }

  if (
    lower.includes("rebalance") ||
    lower.includes("suggest") ||
    lower.includes("strategy") ||
    lower.includes("plan")
  ) {
    return "Rebalance suggestion: shift 5% from DOT to USDC over 2 tranches; reason: reduce volatility exposure while preserving yield target (confidence 72%).";
  }

  return "Unknown command. Try: treasury status, stake <amount> <token>, governance queue, agent status, crosschain queue, register ens <name>.eth";
}

function isAdvisoryCommand(command: string): boolean {
  const lower = command.toLowerCase();
  return (
    lower.includes("rebalance") ||
    lower.includes("suggest") ||
    lower.includes("strategy") ||
    lower.includes("plan")
  );
}

function deterministicReply(command: string, snapshot: VaultSnapshot): string | null {
  const input = command.trim();
  const lower = input.toLowerCase();
  const agentSummary = getExternalAgentSummary();
  const crosschainSummary = getCrossChainSummary();

  if (lower === "treasury status") {
    return `Treasury: $${snapshot.totalValueUsd.toLocaleString()} | DOT ${snapshot.dotAllocationPct}% | USDC ${snapshot.usdcAllocationPct}% | APY ${snapshot.apyPct}% | ${snapshot.stakers} stakers`;
  }

  if (lower === "governance queue") {
    return "Governance queue: #19 (voting), #18 (ready to execute), #17 (completed)";
  }

  if (lower === "agent status" || lower === "ens status" || lower === "agents status") {
    return `External agents: ${agentSummary.active}/${agentSummary.total} active | ${agentSummary.degraded} degraded | access: wallet+role | ENS optional: ${agentSummary.primaryEns ?? "not linked"}`;
  }

  if (lower === "crosschain queue" || lower === "bridge queue" || lower === "xcm queue") {
    return `Cross-chain queue: ${crosschainSummary.queued} queued, ${crosschainSummary.bridging} bridging, ${crosschainSummary.settled} settled via ${crosschainSummary.bridge}`;
  }

  const ensMatch = input.match(/^register\s+ens\s+([a-z0-9-]+\.eth)$/i);
  if (ensMatch) {
    const target = ensMatch[1].toLowerCase();
    return `ENS registration queued: ${target}`;
  }

  const stakeMatch = input.match(/^stake\s+(\d+(?:\.\d+)?)\s+(DOT|USDC)$/i);
  if (stakeMatch) {
    const amount = stakeMatch[1];
    const token = stakeMatch[2].toUpperCase();
    return `Queued simulated stake command: ${amount} ${token}`;
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const command = String(body?.command ?? "").trim();
    const requesterAddress = String(body?.requesterAddress ?? "").trim().toLowerCase();
    
    console.log(`[BOT] Command received: ${command}`);
    
    let snapshot: VaultSnapshot;
    try {
      snapshot = await getVaultSnapshot();
      console.log(`[BOT] Vault snapshot loaded: $${snapshot.totalValueUsd}`);
    } catch (err) {
      console.error("[BOT] Failed to get vault snapshot:", err);
      return NextResponse.json(
        { error: "Failed to load vault data", details: String(err) },
        { status: 500 }
      );
    }

    if (!command) {
      return NextResponse.json({ error: "Missing command" }, { status: 400 });
    }

    const ensMatch = command.match(/^register\s+ens\s+([a-z0-9-]+\.eth)$/i);
    if (ensMatch) {
      const result = registerEnsName({
        name: ensMatch[1],
        owner: requesterAddress || "bot-console",
      });

      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      const reply = result.alreadyExists
        ? `ENS already registered: ${result.record.name}`
        : `ENS registered: ${result.record.name} (tx ${result.record.txHash.slice(0, 12)}...)`;

      let lit = null;
      try {
        lit = await encryptWithLit({
          plaintext: reply,
          authorizedAddresses: [...LIT_AUTHORIZED_ADDRESSES, requesterAddress],
        });
      } catch (err) {
        console.warn("[BOT] Lit encryption failed, continuing without encryption:", err);
      }

      return NextResponse.json({
        reply,
        provider: "deterministic",
        action: "ens_register",
        record: result.record,
        lit,
      });
    }

    const deterministic = deterministicReply(command, snapshot);
    if (deterministic) {
      console.log(`[BOT] Using deterministic reply`);
      let lit = null;
      try {
        lit = await encryptWithLit({
          plaintext: deterministic,
          authorizedAddresses: [...LIT_AUTHORIZED_ADDRESSES, requesterAddress],
        });
      } catch (err) {
        console.warn("[BOT] Lit encryption failed, continuing without encryption:", err);
      }
      return NextResponse.json({ reply: deterministic, provider: "deterministic", lit });
    }

    if (!GEMINI_API_KEY) {
      console.log(`[BOT] No Gemini API key, using fallback`);
      const fallback = fallbackReply(command, snapshot);
      let lit = null;
      try {
        lit = await encryptWithLit({
          plaintext: fallback,
          authorizedAddresses: [...LIT_AUTHORIZED_ADDRESSES, requesterAddress],
        });
      } catch (err) {
        console.warn("[BOT] Lit encryption failed, continuing without encryption:", err);
      }
      return NextResponse.json({
        reply: fallback,
        provider: "fallback",
        reason: "missing_api_key",
        lit,
      });
    }

    const advisory = isAdvisoryCommand(command);

    const prompt = advisory
      ? `You are NeuroVault treasury strategy bot. Use this snapshot:\n- Treasury Value: $${snapshot.totalValueUsd.toLocaleString()}\n- Allocation: DOT ${snapshot.dotAllocationPct}%, USDC ${snapshot.usdcAllocationPct}%\n- APY: ${snapshot.apyPct}%\n- Active Proposals: ${snapshot.activeProposals}\n- Stakers: ${snapshot.stakers}\n\nUser command: ${command}\n\nRespond in ONE short line only in this exact style:\nRebalance suggestion: <action>; reason: <why> (confidence <0-100>%).`
      : `You are NeuroVault treasury bot. Respond in ONE short line only.\n\nUser command: ${command}\n\nSupported operations:\n- treasury status\n- stake <amount> <DOT|USDC>\n- governance queue\n- agent status\n- crosschain queue\n- register ens <name>.eth\n\nIf command is unsupported, reply with: Unknown command. Try: treasury status, stake <amount> <token>, governance queue, agent status, crosschain queue, register ens <name>.eth`;

    console.log(`[BOT] Resolving Gemini model...`);
    const model = await resolveGeminiModel(GEMINI_API_KEY);
    if (!model) {
      console.log(`[BOT] No compatible Gemini model found, using fallback`);
      const fallback = fallbackReply(command, snapshot);
      let lit = null;
      try {
        lit = await encryptWithLit({
          plaintext: fallback,
          authorizedAddresses: [...LIT_AUTHORIZED_ADDRESSES, requesterAddress],
        });
      } catch (err) {
        console.warn("[BOT] Lit encryption failed, continuing without encryption:", err);
      }
      return NextResponse.json({
        reply: fallback,
        provider: "fallback",
        reason: "no_compatible_gemini_model",
        lit,
      });
    }

    console.log(`[BOT] Using model: ${model}`);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: advisory ? 220 : 120,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error(`[BOT] Gemini request failed with status ${response.status}`);
      const errorText = await response.text().catch(() => "");
      console.error(`[BOT] Gemini error: ${errorText}`);
      const fallback = fallbackReply(command, snapshot);
      let lit = null;
      try {
        lit = await encryptWithLit({
          plaintext: fallback,
          authorizedAddresses: [...LIT_AUTHORIZED_ADDRESSES, requesterAddress],
        });
      } catch (err) {
        console.warn("[BOT] Lit encryption failed, continuing without encryption:", err);
      }
      return NextResponse.json({
        reply: fallback,
        provider: "fallback",
        reason: "gemini_request_failed",
        geminiStatus: response.status,
        geminiError: errorText,
        model,
        lit,
      });
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;

    if (advisory && (!reply || reply.length < 40 || !reply.toLowerCase().includes("reason:"))) {
      console.log(`[BOT] Gemini advisory response incomplete, using fallback`);
      const fallback = "Rebalance suggestion: shift 5% from DOT to USDC over 2 tranches; reason: reduce volatility while preserving yield target (confidence 72%).";
      let lit = null;
      try {
        lit = await encryptWithLit({
          plaintext: fallback,
          authorizedAddresses: [...LIT_AUTHORIZED_ADDRESSES, requesterAddress],
        });
      } catch (err) {
        console.warn("[BOT] Lit encryption failed, continuing without encryption:", err);
      }
      return NextResponse.json({
        reply: fallback,
        provider: "fallback",
        reason: "gemini_incomplete_response",
        model,
        lit,
      });
    }

    if (!reply) {
      console.log(`[BOT] Gemini returned empty response, using fallback`);
      const fallback = fallbackReply(command, snapshot);
      let lit = null;
      try {
        lit = await encryptWithLit({
          plaintext: fallback,
          authorizedAddresses: [...LIT_AUTHORIZED_ADDRESSES, requesterAddress],
        });
      } catch (err) {
        console.warn("[BOT] Lit encryption failed, continuing without encryption:", err);
      }
      return NextResponse.json({
        reply: fallback,
        provider: "fallback",
        reason: "gemini_empty_response",
        model,
        lit,
      });
    }

    console.log(`[BOT] Using Gemini response`);
    let lit = null;
    try {
      lit = await encryptWithLit({
        plaintext: reply,
        authorizedAddresses: [...LIT_AUTHORIZED_ADDRESSES, requesterAddress],
      });
    } catch (err) {
      console.warn("[BOT] Lit encryption failed, continuing without encryption:", err);
    }

    return NextResponse.json({ reply, provider: "gemini", model, lit });
  } catch (err) {
    console.error("[BOT] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
