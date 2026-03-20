import { NextRequest, NextResponse } from "next/server";
import { encryptWithLit } from "@/lib/lit-protocol";
import { getVaultSnapshot, type VaultSnapshot } from "@/lib/vault";
import { resolveEnsNameOnchain, type EnsChain } from "@/lib/ens";
import { deriveCrossChainQueue, getAgentRuntimeStatus, getEnsRecordsOnchain, registerEnsNameOnchain } from "@/lib/protocol-data";
import { getServerGeminiApiKey } from "@/lib/server-env";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LIT_AUTHORIZED_ADDRESSES = (process.env.LIT_AUTHORIZED_ADDRESSES || "")
  .split(",")
  .map((a) => a.trim())
  .filter(Boolean);
const PREFERRED_GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro",
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

async function buildRuntimeSummaries() {
  const [runtime, ensRecords, crosschainQueue] = await Promise.all([
    getAgentRuntimeStatus().catch(() => null),
    getEnsRecordsOnchain().catch(() => []),
    deriveCrossChainQueue().catch(() => []),
  ]);

  const agentSummary = {
    total: Math.max(ensRecords.length, runtime ? 1 : 0),
    active: runtime?.isRunning && !runtime.cycleInProgress ? 1 : 0,
    degraded: runtime?.isRunning && runtime.cycleInProgress ? 1 : 0,
    offline: runtime && !runtime.isRunning ? 1 : 0,
    primaryEns: ensRecords.find((record) => record.name === "neurovault.eth")?.name ?? ensRecords[0]?.name ?? null,
  };

  const crosschainSummary = {
    total: crosschainQueue.length,
    queued: crosschainQueue.filter((item) => item.status === "queued").length,
    bridging: crosschainQueue.filter((item) => item.status === "bridging").length,
    settled: crosschainQueue.filter((item) => item.status === "settled").length,
    bridge: "Hyperbridge",
  };

  return { runtime, agentSummary, crosschainSummary };
}

async function fallbackReply(command: string, snapshot: VaultSnapshot) {
  const lower = command.toLowerCase();
  const { agentSummary, crosschainSummary } = await buildRuntimeSummaries();

  const ensMatch = command.trim().match(/^register\s+ens\s+([a-z0-9-]+\.eth)$/i);
  if (ensMatch) {
    return `ENS registration queued: ${ensMatch[1].toLowerCase()}`;
  }

  const resolveMatch = command.trim().match(/^resolve\s+ens\s+([a-z0-9-]+\.eth)(?:\s+(mainnet|sepolia))?$/i);
  if (resolveMatch) {
    const chain = (resolveMatch[2] || "mainnet").toLowerCase();
    return `Resolving ENS on-chain: ${resolveMatch[1].toLowerCase()} (${chain})`;
  }

  if (lower.includes("treasury") && lower.includes("status")) {
    return `Treasury: $${snapshot.totalValueUsd.toLocaleString()} | PAS ${snapshot.dotAllocationPct}% | USDC ${snapshot.usdcAllocationPct}% | APY ${snapshot.apyPct}% | ${snapshot.stakers} stakers`;
  }

  if (lower.startsWith("stake ")) {
    return `Queued stake command: ${command.replace(/^stake\s+/i, "")}`;
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

  if (lower.includes("bifrost") || lower.includes("vdot") || lower.includes("slpx")) {
    return `Bifrost SLPx: protocol=active | vPAS/vDOT-style staking route active | delivery depends on governance + bridge confirmation`;
  }

  if (
    lower.includes("rebalance") ||
    lower.includes("suggest") ||
    lower.includes("strategy") ||
    lower.includes("plan")
  ) {
    return "Rebalance suggestion: shift 5% from PAS to USDC over 2 tranches; reason: reduce volatility exposure while preserving yield target (confidence 72%).";
  }

  return "Unknown command. Try: treasury status, stake <amount> <token>, governance queue, agent status, crosschain queue, bifrost status, register ens <name>.eth, resolve ens <name>.eth [mainnet|sepolia], suggest rebalance plan";
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

async function deterministicReply(command: string, snapshot: VaultSnapshot): Promise<string | null> {
  const input = command.trim();
  const lower = input.toLowerCase();
  const { agentSummary, crosschainSummary } = await buildRuntimeSummaries();

  if (lower === "treasury status") {
    return `Treasury: $${snapshot.totalValueUsd.toLocaleString()} | PAS ${snapshot.dotAllocationPct}% | USDC ${snapshot.usdcAllocationPct}% | APY ${snapshot.apyPct}% | ${snapshot.stakers} stakers`;
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

  const stakeMatch = input.match(/^stake\s+(\d+(?:\.\d+)?)\s+(DOT|USDC|PAS)$/i);
  if (stakeMatch) {
    const amount = stakeMatch[1];
    const token = stakeMatch[2].toUpperCase();
    return `Queued stake command: ${amount} ${token}`;
  }

  if (lower === "bifrost status" || lower === "bifrost" || lower === "vdot status") {
    return `Bifrost SLPx: governance proposals are live; execution path depends on approved bridge/runtime integration`;
  }

  if (lower.startsWith("bifrost stake ")) {
    const parts = lower.replace("bifrost stake ", "").trim();
    return `Bifrost stake queued: ${parts} PAS via the configured bridge/staking route | governance approval and bridge execution required`;
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const geminiApiKey = getServerGeminiApiKey();
    const body = await req.json();
    const allowLocalFallback = (process.env.ALLOW_LOCAL_FALLBACK || "false").toLowerCase() === "true";
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
      if (!requesterAddress || !/^0x[a-fA-F0-9]{40}$/.test(requesterAddress)) {
        return NextResponse.json({ error: "Valid requesterAddress required for ENS registration" }, { status: 400 });
      }

      let result;
      try {
        result = await registerEnsNameOnchain({
          name: ensMatch[1].toLowerCase(),
          owner: requesterAddress,
          role: "staker",
          description: "Registered from NeuroVault bot console",
        });
      } catch (err) {
        if (!allowLocalFallback) {
          return NextResponse.json(
            {
              error: "ENS registration endpoint is not wired for on-chain writes",
              details: String(err),
            },
            { status: 501 }
          );
        }

        return NextResponse.json(
          { error: "ENS registration failed", details: String(err) },
          { status: 501 }
        );
      }

      const reply = `ENS registered on-chain: ${ensMatch[1].toLowerCase()} (tx ${String(result.txHash).slice(0, 12)}...)`;

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
        record: result,
        lit,
      });
    }

    const resolveMatch = command.match(/^resolve\s+ens\s+([a-z0-9-]+\.eth)(?:\s+(mainnet|sepolia))?$/i);
    if (resolveMatch) {
      const name = resolveMatch[1].toLowerCase();
      const chain: EnsChain = resolveMatch[2]?.toLowerCase() === "sepolia" ? "sepolia" : "mainnet";

      const resolution = await resolveEnsNameOnchain({ name, chain });
      const reply = resolution.address
        ? `ENS resolved: ${resolution.name} -> ${resolution.address} (${resolution.chain})`
        : `ENS not found on-chain: ${resolution.name} (${resolution.chain})`;

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
        action: "ens_resolve",
        resolution,
        lit,
      });
    }

    const deterministic = await deterministicReply(command, snapshot);
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

    if (!geminiApiKey) {
      console.log(`[BOT] No Gemini API key, using fallback`);
      const fallback = await fallbackReply(command, snapshot);
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
        debug: "GEMINI_API_KEY missing on server runtime",
        lit,
      });
    }

    const advisory = isAdvisoryCommand(command);

    const prompt = advisory
      ? `Treasury: $${snapshot.totalValueUsd.toLocaleString()}, PAS ${snapshot.dotAllocationPct}%, USDC ${snapshot.usdcAllocationPct}%, APY ${snapshot.apyPct}%\n\n${command}\n\nComplete this: Rebalance suggestion: <action>; reason: <why> (confidence <0-100>%).`
      : `You are NeuroVault treasury bot. Respond in ONE short line only.\n\nUser command: ${command}\n\nSupported operations:\n- treasury status\n- stake <amount> <DOT|USDC|PAS>\n- governance queue\n- agent status\n- crosschain queue\n- bifrost status\n- register ens <name>.eth\n- resolve ens <name>.eth [mainnet|sepolia]\n- suggest rebalance plan\n- rebalance suggestion\n- strategy\n\nIf command is unsupported, reply with: Unknown command. Try: treasury status, stake <amount> <token>, governance queue, agent status, crosschain queue, bifrost status, register ens <name>.eth, resolve ens <name>.eth [mainnet|sepolia], suggest rebalance plan`;

    console.log(`[BOT] Resolving Gemini model...`);
    const model = await resolveGeminiModel(geminiApiKey);
    if (!model) {
      console.log(`[BOT] No compatible Gemini model found, using fallback`);
      const fallback = await fallbackReply(command, snapshot);
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
        debug: "Gemini models list request returned no compatible generateContent model",
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
          "x-goog-api-key": geminiApiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: advisory ? 1000 : 120,
            stopSequences: advisory ? [] : ["\n"],
          },
        }),
      }
    );

    if (!response.ok) {
      console.error(`[BOT] Gemini request failed with status ${response.status}`);
      const errorText = await response.text().catch(() => "");
      console.error(`[BOT] Gemini error: ${errorText}`);
      const fallback = await fallbackReply(command, snapshot);
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
        debug: `Gemini HTTP ${response.status}${errorText ? `: ${errorText}` : ""}`,
        model,
        lit,
      });
    }

    const data = await response.json();
    let reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
    
    // Clean up markdown formatting from Gemini
    if (reply) {
      reply = reply.replace(/\*\*/g, '').replace(/\n\n/g, ' ').replace(/\n/g, ' ');
      reply = reply.replace(/\s+/g, ' ').trim();
    }

    if (advisory && (!reply || reply.length < 20)) {
      console.log(`[BOT] Gemini advisory response too short, using fallback`);
      const fallback = "Rebalance suggestion: shift 5% from PAS to USDC over 2 tranches; reason: reduce volatility while preserving yield target (confidence 72%).";
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
        debug: "Gemini response was too short for advisory output",
        model,
        lit,
      });
    }

    if (!reply) {
      console.log(`[BOT] Gemini returned empty response, using fallback`);
      const fallback = await fallbackReply(command, snapshot);
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
        debug: "Gemini returned no text content",
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
