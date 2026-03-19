import { NextRequest, NextResponse } from "next/server";
import {
  getEnsRecords,
  getPrimaryEns,
  registerEnsName,
  resolveEnsNameOnchain,
  type EnsChain,
} from "@/lib/ens";

export async function GET(req: NextRequest) {
  const allowLocalFallback = (process.env.ALLOW_LOCAL_FALLBACK || "false").toLowerCase() === "true";
  const { searchParams } = new URL(req.url);
  const name = String(searchParams.get("name") ?? "").trim();
  const chainParam = String(searchParams.get("chain") ?? "mainnet").toLowerCase();
  const chain: EnsChain = chainParam === "sepolia" ? "sepolia" : "mainnet";

  if (name) {
    try {
      const resolution = await resolveEnsNameOnchain({ name, chain });
      return NextResponse.json({
        resolution,
        source: "onchain",
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      return NextResponse.json(
        { error: "Failed to resolve ENS on-chain", details: String(err) },
        { status: 400 }
      );
    }
  }

  const records = getEnsRecords();
  const primary = getPrimaryEns();

  if (!allowLocalFallback) {
    return NextResponse.json({
      primary,
      records: [],
      source: "integration",
      note: "Local ENS registry fallback disabled",
      updatedAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    primary,
    records,
    source: "fallback",
    updatedAt: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const allowLocalFallback = (process.env.ALLOW_LOCAL_FALLBACK || "false").toLowerCase() === "true";

  if (!allowLocalFallback) {
    return NextResponse.json(
      {
        error: "On-chain ENS registration not wired in this endpoint",
        details: "Use registrar contract integration or enable ALLOW_LOCAL_FALLBACK=true for local registry writes",
      },
      { status: 501 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  const owner = String(body?.owner ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Missing ENS name" }, { status: 400 });
  }

  const result = registerEnsName({ name, owner });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    status: result.alreadyExists ? "exists" : "registered",
    record: result.record,
    source: "fallback",
  });
}
