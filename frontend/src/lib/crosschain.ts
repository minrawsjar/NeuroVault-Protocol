export type TransferStatus = "queued" | "bridging" | "settled" | "failed";

export interface CrossChainTransfer {
  id: string;
  token: "DOT" | "USDC";
  amount: string;
  from: string;
  to: string;
  bridge: "Hyperbridge";
  status: TransferStatus;
  eta: string;
}

const MOCK_TRANSFERS: CrossChainTransfer[] = [
  {
    id: "xcm-9021",
    token: "USDC",
    amount: "12,500",
    from: "Polkadot Hub",
    to: "Moonbeam",
    bridge: "Hyperbridge",
    status: "bridging",
    eta: "~2m",
  },
  {
    id: "xcm-9018",
    token: "DOT",
    amount: "320",
    from: "Polkadot Hub",
    to: "Hydration",
    bridge: "Hyperbridge",
    status: "queued",
    eta: "~5m",
  },
  {
    id: "xcm-9014",
    token: "USDC",
    amount: "8,000",
    from: "Polkadot Hub",
    to: "Astar",
    bridge: "Hyperbridge",
    status: "settled",
    eta: "done",
  },
];

export function getCrossChainQueue(): CrossChainTransfer[] {
  return MOCK_TRANSFERS;
}

export function getCrossChainSummary() {
  const queued = MOCK_TRANSFERS.filter((t) => t.status === "queued").length;
  const bridging = MOCK_TRANSFERS.filter((t) => t.status === "bridging").length;
  const settled = MOCK_TRANSFERS.filter((t) => t.status === "settled").length;

  return {
    total: MOCK_TRANSFERS.length,
    queued,
    bridging,
    settled,
    bridge: "Hyperbridge",
  };
}
