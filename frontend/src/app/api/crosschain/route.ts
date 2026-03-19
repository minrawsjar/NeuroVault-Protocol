import { NextRequest, NextResponse } from "next/server";
import { getCrossChainQueue, getCrossChainSummary } from "@/lib/crosschain";

export async function GET() {
  const allowLocalFallback = (process.env.ALLOW_LOCAL_FALLBACK || "false").toLowerCase() === "true";
  const crosschainApiUrl = (process.env.CROSSCHAIN_API_URL || "").trim();

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

  if (!allowLocalFallback) {
    return NextResponse.json(
      { error: "Crosschain integration not configured", details: "Set CROSSCHAIN_API_URL or enable ALLOW_LOCAL_FALLBACK=true" },
      { status: 503 }
    );
  }

  const queue = getCrossChainQueue();
  const summary = getCrossChainSummary();

  return NextResponse.json({
    queue,
    summary,
    source: "fallback",
    updatedAt: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const allowLocalFallback = (process.env.ALLOW_LOCAL_FALLBACK || "false").toLowerCase() === "true";
  const crosschainApiUrl = (process.env.CROSSCHAIN_API_URL || "").trim();

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

  if (!allowLocalFallback) {
    return NextResponse.json(
      { error: "Crosschain integration not configured", details: "Set CROSSCHAIN_API_URL or enable ALLOW_LOCAL_FALLBACK=true" },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const amount = String(body?.amount ?? "0");
  const token = String(body?.token ?? "USDC").toUpperCase();
  const to = String(body?.to ?? "Moonbeam");

  return NextResponse.json({
    status: "queued",
    transfer: {
      id: `xcm-sim-${Date.now()}`,
      token: token === "DOT" ? "DOT" : "USDC",
      amount,
      from: "Polkadot Hub",
      to,
      bridge: "Hyperbridge",
      eta: "~3m",
    },
    source: "fallback",
  });
}
