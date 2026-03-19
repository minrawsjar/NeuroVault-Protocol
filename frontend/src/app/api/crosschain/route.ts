import { NextRequest, NextResponse } from "next/server";
import { getCrossChainQueue, getCrossChainSummary } from "@/lib/crosschain";

export async function GET() {
  const queue = getCrossChainQueue();
  const summary = getCrossChainSummary();

  return NextResponse.json({
    queue,
    summary,
    source: "mock",
    updatedAt: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
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
    simulated: true,
  });
}
