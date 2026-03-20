import { NextRequest, NextResponse } from "next/server";
import {
  getEnsRecords,
  getPrimaryEns,
  resolveEnsNameOnchain,
  type EnsChain,
} from "@/lib/ens";
import { getEnsRecordsOnchain, registerEnsNameOnchain } from "@/lib/protocol-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  try {
    const records = await getEnsRecordsOnchain();
    const primary = records.find((record) => record.name === "neurovault.eth") ?? records[0] ?? null;

    return NextResponse.json({
      primary,
      records,
      source: "onchain",
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const records = getEnsRecords();
    const primary = getPrimaryEns();

    if (!allowLocalFallback) {
      return NextResponse.json({
        primary,
        records: [],
        source: "integration",
        note: `On-chain ENS registry unavailable: ${String(err)}`,
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
}

export async function POST(req: NextRequest) {
  const allowLocalFallback = (process.env.ALLOW_LOCAL_FALLBACK || "false").toLowerCase() === "true";

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  const owner = String(body?.owner ?? "").trim();
  const role = String(body?.role ?? "staker").trim();
  const description = String(body?.description ?? "Registered via NeuroVault frontend").trim();
  const endpoint = String(body?.endpoint ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Missing ENS name" }, { status: 400 });
  }

  if (!owner || !/^0x[a-fA-F0-9]{40}$/.test(owner)) {
    return NextResponse.json({ error: "Missing valid owner address" }, { status: 400 });
  }

  try {
    const result = await registerEnsNameOnchain({
      name,
      owner,
      role,
      description,
      endpoint,
    });

    return NextResponse.json({
      status: "registered",
      txHash: result.txHash,
      blockNumber: result.blockNumber.toString(),
      source: "onchain",
    });
  } catch (err) {
    if (!allowLocalFallback) {
      return NextResponse.json(
        {
          error: "On-chain ENS registration failed",
          details: String(err),
        },
        { status: 501 }
      );
    }

    return NextResponse.json(
      {
        error: "ENS fallback writes disabled in favor of on-chain-only flow",
        details: String(err),
      },
      { status: 501 }
    );
  }
}
