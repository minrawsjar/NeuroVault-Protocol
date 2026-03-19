import { NextResponse } from "next/server";
import { getVaultSnapshot } from "@/lib/vault";

export async function GET() {
  try {
    const snapshot = await getVaultSnapshot();
    return NextResponse.json(snapshot);
  } catch (err) {
    return NextResponse.json(
      {
        error: "Vault connection failed",
        details: String(err),
      },
      { status: 503 }
    );
  }
}
