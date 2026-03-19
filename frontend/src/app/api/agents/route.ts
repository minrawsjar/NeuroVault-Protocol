import { NextResponse } from "next/server";
import { getExternalAgents, getExternalAgentSummary } from "@/lib/agents";

export async function GET() {
  const allowLocalFallback = (process.env.ALLOW_LOCAL_FALLBACK || "false").toLowerCase() === "true";
  const agentApiUrl = (process.env.AGENT_API_URL || "").trim();

  if (agentApiUrl) {
    try {
      const res = await fetch(`${agentApiUrl.replace(/\/$/, "")}/status`, {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Agent status request failed (${res.status})`);
      }

      const status = await res.json();
      const cycleInProgress = Boolean(status?.cycleInProgress);
      const isRunning = Boolean(status?.isRunning);

      return NextResponse.json({
        agents: [
          {
            id: "ag-live-001",
            name: "NeuroVault Runtime Agent",
            ensIdentity: "neurovault.eth",
            strategy: "yield",
            network: "Polkadot Hub",
            status: isRunning ? (cycleInProgress ? "degraded" : "active") : "offline",
            lastHeartbeat: status?.lastCycleResult?.timestamp || "unknown",
          },
        ],
        summary: {
          total: 1,
          active: isRunning && !cycleInProgress ? 1 : 0,
          degraded: isRunning && cycleInProgress ? 1 : 0,
          offline: isRunning ? 0 : 1,
          ensReady: true,
          primaryEns: "neurovault.eth",
          accessMode: "wallet+role",
          accessIndependentOfEns: true,
        },
        source: "integration",
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
  }

  if (!allowLocalFallback) {
    return NextResponse.json(
      { error: "Agent integration not configured", details: "Set AGENT_API_URL or enable ALLOW_LOCAL_FALLBACK=true" },
      { status: 503 }
    );
  }

  const agents = getExternalAgents();
  const summary = getExternalAgentSummary();

  return NextResponse.json({
    agents,
    summary,
    source: "fallback",
    updatedAt: new Date().toISOString(),
  });
}
