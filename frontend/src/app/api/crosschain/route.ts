import { NextRequest, NextResponse } from "next/server";
import { deriveCrossChainQueue } from "@/lib/protocol-data";
import { getServerAgentApiUrl, getServerCrosschainApiUrl } from "@/lib/server-env";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const allowLocalFallback = (process.env.ALLOW_LOCAL_FALLBACK || "false").toLowerCase() === "true";
  const crosschainApiUrl = getServerCrosschainApiUrl();

  if (crosschainApiUrl) {
    try {
      const res = await fetch(crosschainApiUrl.replace(/\/$/, ""), {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Crosschain request failed (${res.status})`);
      }

      const data = await res.json();
      return NextResponse.json({
        ...data,
        source: "integration",
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      if (!allowLocalFallback) {
        return NextResponse.json(
          { error: "Crosschain integration unavailable", details: String(err) },
          { status: 503 }
        );
      }
    }
  }

  try {
    const queue = await deriveCrossChainQueue(12);
    const summary = {
      total: queue.length,
      queued: queue.filter((item) => item.status === "queued").length,
      bridging: queue.filter((item) => item.status === "bridging").length,
      settled: queue.filter((item) => item.status === "settled").length,
      bridge: "Hyperbridge",
    };

    return NextResponse.json({
      queue,
      summary,
      source: "onchain",
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    if (!allowLocalFallback) {
      return NextResponse.json(
        { error: "Crosschain integration not configured", details: String(err) },
        { status: 503 }
      );
    }
  }

  return NextResponse.json({
    queue: [],
    summary: {
      total: 0,
      queued: 0,
      bridging: 0,
      settled: 0,
      bridge: "Hyperbridge",
    },
    source: "fallback",
    updatedAt: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const allowLocalFallback = (process.env.ALLOW_LOCAL_FALLBACK || "false").toLowerCase() === "true";
  const crosschainApiUrl = getServerCrosschainApiUrl();
  const agentApiUrl = getServerAgentApiUrl();

  if (crosschainApiUrl) {
    const body = await req.json().catch(() => ({}));
    try {
      const res = await fetch(crosschainApiUrl.replace(/\/$/, ""), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return NextResponse.json(
          { error: "Crosschain integration failed", details: data },
          { status: 502 }
        );
      }

      return NextResponse.json({
        ...data,
        source: "integration",
      });
    } catch (err) {
      if (!allowLocalFallback) {
        return NextResponse.json(
          { error: "Crosschain integration unavailable", details: String(err) },
          { status: 503 }
        );
      }
    }
  }

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action ?? "").trim().toLowerCase();

  if (agentApiUrl && action === "finalize_ready") {
    try {
      const res = await fetch(`${agentApiUrl.replace(/\/$/, "")}/proposals/finalize-ready`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return NextResponse.json(
          { error: "Agent finalization request failed", details: data },
          { status: 502 }
        );
      }

      return NextResponse.json({
        ...data,
        source: "agent_runtime",
      });
    } catch (err) {
      if (!allowLocalFallback) {
        return NextResponse.json(
          { error: "Agent runtime unavailable", details: String(err) },
          { status: 503 }
        );
      }
    }
  }

  return NextResponse.json({
    error: "Crosschain dispatch is not wired for direct writes in this API",
    details: "Use CROSSCHAIN_API_URL for direct bridge writes or POST { action: \"finalize_ready\" } when AGENT_API_URL is configured.",
  }, { status: allowLocalFallback ? 501 : 503 });
}
