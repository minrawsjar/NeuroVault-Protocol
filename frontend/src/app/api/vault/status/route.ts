import { NextResponse } from "next/server";
import { getVaultSnapshot } from "@/lib/vault";

export async function GET() {
  const snapshot = await getVaultSnapshot();
  return NextResponse.json(snapshot);
}
