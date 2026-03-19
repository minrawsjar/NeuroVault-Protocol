import { getPrimaryEns } from "@/lib/ens";

export type ExternalAgentStatus = "active" | "degraded" | "offline";

export interface ExternalAgent {
  id: string;
  name: string;
  ensIdentity: string;
  strategy: "yield" | "risk" | "liquidity";
  network: string;
  status: ExternalAgentStatus;
  lastHeartbeat: string;
}

const MOCK_EXTERNAL_AGENTS: ExternalAgent[] = [
  {
    id: "ag-001",
    name: "Yield Sentinel",
    ensIdentity: "yield.neurovault.eth",
    strategy: "yield",
    network: "Polkadot Hub",
    status: "active",
    lastHeartbeat: "30s ago",
  },
  {
    id: "ag-002",
    name: "Risk Guard",
    ensIdentity: "risk.neurovault.eth",
    strategy: "risk",
    network: "Polkadot Hub",
    status: "active",
    lastHeartbeat: "42s ago",
  },
  {
    id: "ag-003",
    name: "Liquidity Router",
    ensIdentity: "router.neurovault.eth",
    strategy: "liquidity",
    network: "Hyperbridge",
    status: "degraded",
    lastHeartbeat: "4m ago",
  },
];

export function getExternalAgents(): ExternalAgent[] {
  return MOCK_EXTERNAL_AGENTS;
}

export function getExternalAgentSummary() {
  const total = MOCK_EXTERNAL_AGENTS.length;
  const active = MOCK_EXTERNAL_AGENTS.filter((a) => a.status === "active").length;
  const degraded = MOCK_EXTERNAL_AGENTS.filter((a) => a.status === "degraded").length;
  const offline = MOCK_EXTERNAL_AGENTS.filter((a) => a.status === "offline").length;
  const primaryEns = getPrimaryEns();

  return {
    total,
    active,
    degraded,
    offline,
    ensReady: Boolean(primaryEns),
    primaryEns: primaryEns?.name ?? null,
    accessMode: "wallet+role",
    accessIndependentOfEns: true,
  };
}
