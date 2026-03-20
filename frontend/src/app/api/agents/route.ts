import { NextResponse } from "next/server";
import { CONTRACTS } from "@/lib/contracts";
import { getAgentRuntimeStatus, getEnsRecordsOnchain } from "@/lib/protocol-data";
import { getServerAgentApiUrl } from "@/lib/server-env";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const allowLocalFallback = (process.env.ALLOW_LOCAL_FALLBACK || "false").toLowerCase() === "true";
  const configuredAgentAddress = CONTRACTS.paseo.agentAddress.toLowerCase();
  const agentApiUrl = getServerAgentApiUrl();

  try {
    const [runtime, ensRecords] = await Promise.all([
      getAgentRuntimeStatus().catch(() => null),
      getEnsRecordsOnchain().catch(() => []),
    ]);

    const agentRecords = ensRecords.filter(
      (record) =>
        record.role.toLowerCase().includes("agent") ||
        record.endpoint.trim().length > 0 ||
        record.addr.toLowerCase() === configuredAgentAddress
    );

    const agents = (agentRecords.length > 0 ? agentRecords : [{
      addr: CONTRACTS.paseo.agentAddress,
      name: "neurovault.eth",
      role: "agent",
      description: "NeuroVault runtime agent",
      endpoint: agentApiUrl,
      registeredAt: 0,
      active: true,
    }]).map((record) => {
      const isPrimary = record.addr.toLowerCase() === configuredAgentAddress || record.name === "neurovault.eth";
      const status = isPrimary && runtime
        ? runtime.isRunning
          ? runtime.cycleInProgress ? "degraded" : "active"
          : "offline"
        : record.active
          ? "active"
          : "offline";

      return {
        id: `ag-${record.addr.toLowerCase()}`,
        name: record.description || record.name,
        ensIdentity: record.name,
        strategy: "yield" as const,
        network: "Polkadot Hub",
        status,
        lastHeartbeat: isPrimary && runtime?.lastCycleResult?.timestamp
          ? runtime.lastCycleResult.timestamp
          : record.registeredAt
            ? new Date(record.registeredAt * 1000).toISOString()
            : "unknown",
        endpoint: record.endpoint || null,
        address: record.addr,
        role: record.role,
      };
    });

    const summary = {
      total: agents.length,
      active: agents.filter((agent) => agent.status === "active").length,
      degraded: agents.filter((agent) => agent.status === "degraded").length,
      offline: agents.filter((agent) => agent.status === "offline").length,
      ensReady: agentRecords.length > 0,
      primaryEns: agentRecords.find((record) => record.addr.toLowerCase() === configuredAgentAddress)?.name
        ?? agentRecords[0]?.name
        ?? null,
      accessMode: "wallet+role",
      accessIndependentOfEns: true,
    };

    return NextResponse.json({
      agents,
      summary,
      runtime,
      source: runtime ? "integration" : "onchain",
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    if (!allowLocalFallback) {
      return NextResponse.json(
        { error: "Agent integration unavailable", details: String(err) },
        { status: 503 }
      );
    }
  }

  if (!allowLocalFallback) {
    return NextResponse.json(
      { error: "Agent integration not configured", details: "Set AGENT_API_URL or enable ALLOW_LOCAL_FALLBACK=true" },
      { status: 503 }
    );
  }

  return NextResponse.json({
    agents: [],
    summary: {
      total: 0,
      active: 0,
      degraded: 0,
      offline: 0,
      ensReady: false,
      primaryEns: null,
      accessMode: "wallet+role",
      accessIndependentOfEns: true,
    },
    source: "fallback",
    updatedAt: new Date().toISOString(),
  });
}
