import { NextRequest, NextResponse } from "next/server";
import { getEnsRecords, getPrimaryEns, registerEnsName } from "@/lib/ens";

export async function GET() {
  const records = getEnsRecords();
  const primary = getPrimaryEns();

  return NextResponse.json({
    primary,
    records,
    source: "mock",
    updatedAt: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
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
    simulated: true,
  });
}
