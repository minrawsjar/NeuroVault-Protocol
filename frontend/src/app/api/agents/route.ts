import { NextResponse } from "next/server";
import { getExternalAgents, getExternalAgentSummary } from "@/lib/agents";

export async function GET() {
  const agents = getExternalAgents();
  const summary = getExternalAgentSummary();

  return NextResponse.json({
    agents,
    summary,
    source: "mock",
    updatedAt: new Date().toISOString(),
  });
}
