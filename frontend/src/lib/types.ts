export interface Proposal {
  id: number;
  title: string;
  reasoning: string;
  confidence: number;
  ipfsHash: string;
  status: "active" | "approved" | "rejected" | "executed";
  votesFor: number;
  votesAgainst: number;
  totalStaked: number;
  quorum: number;
  createdAt: string;
  executedAt?: string;
  proposedAction: ProposedAction;
  modelVersion: string;
}

export interface ProposedAction {
  type: "swap" | "stake" | "transfer" | "rebalance";
  description: string;
  amount: string;
  token: string;
  targetToken?: string;
}

export interface TreasuryState {
  totalValue: string;
  dotBalance: string;
  usdcBalance: string;
  totalStakers: number;
  activeProposals: number;
  executedProposals: number;
  apy: string;
  agentStatus: "online" | "thinking" | "sleeping" | "offline";
  lastCycleAt: string;
  nextCycleAt: string;
}

export interface ActivityLog {
  id: string;
  type: "proposal" | "vote" | "execution" | "deposit" | "withdrawal" | "agent_cycle";
  message: string;
  timestamp: string;
  txHash?: string;
}

export interface StakerInfo {
  address: string;
  staked: string;
  votingPower: string;
  proposals: number;
}
