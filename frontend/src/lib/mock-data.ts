import { Proposal, TreasuryState, ActivityLog } from "./types";

export const mockTreasury: TreasuryState = {
  totalValue: "142,850.00",
  dotBalance: "12,450.00",
  usdcBalance: "48,200.00",
  totalStakers: 47,
  activeProposals: 1,
  executedProposals: 23,
  apy: "12.4",
  agentStatus: "online",
  lastCycleAt: "2 min ago",
  nextCycleAt: "28 min",
};

export const mockProposals: Proposal[] = [
  {
    id: 24,
    title: "Rebalance DOT/USDC allocation to 60/40",
    reasoning: `## Analysis

After reviewing the current treasury composition and market conditions, I recommend rebalancing the DOT/USDC allocation from the current 72/28 split to a more conservative 60/40.

**Key factors:**
- DOT volatility has increased 23% over the past 7 days
- The current goal mandate specifies "preserve capital while maintaining 10% APY target"
- A 60/40 split reduces downside risk by approximately 15% while only sacrificing 1.2% projected yield

**Risk assessment:**
- Probability of hitting APY target with new allocation: 87%
- Maximum projected drawdown: -8.2% (vs -14.1% with current allocation)
- Confidence in recommendation: HIGH

**Proposed execution:**
1. Swap 1,245 DOT → USDC via Hydration DEX
2. Estimated slippage: 0.12%
3. Gas cost: ~0.02 DOT

This action aligns with the staker-approved goal #7: "Maintain balanced risk exposure during high-volatility periods."`,
    confidence: 87,
    ipfsHash: "QmX7b3e...4fK2",
    status: "active",
    votesFor: 31,
    votesAgainst: 8,
    totalStaked: 47,
    quorum: 66,
    createdAt: "2 min ago",
    proposedAction: {
      type: "rebalance",
      description: "Swap DOT to USDC for 60/40 portfolio balance",
      amount: "1,245",
      token: "DOT",
      targetToken: "USDC",
    },
    modelVersion: "claude-sonnet-4-20250514",
  },
  {
    id: 23,
    title: "Stake 2,000 DOT in nomination pool",
    reasoning: `Staking analysis complete. The current nomination pool APY of 14.2% exceeds our target by 4.2 percentage points. With the 28-day unbonding period factored in, the risk-adjusted return remains favorable at 11.8%.`,
    confidence: 92,
    ipfsHash: "QmR9c1a...7jM5",
    status: "executed",
    votesFor: 39,
    votesAgainst: 3,
    totalStaked: 44,
    quorum: 66,
    createdAt: "6 hours ago",
    executedAt: "5 hours ago",
    proposedAction: {
      type: "stake",
      description: "Stake DOT in highest-yield nomination pool",
      amount: "2,000",
      token: "DOT",
    },
    modelVersion: "claude-sonnet-4-20250514",
  },
  {
    id: 22,
    title: "Reject: Transfer 5,000 USDC to external address",
    reasoning: `An external agent (ens: defi-optimizer.eth) requested a transfer of 5,000 USDC to an unverified address. After analysis, the request does not align with any approved goal and the destination address has no on-chain history. Recommendation: REJECT.`,
    confidence: 95,
    ipfsHash: "QmT4d8f...2nP8",
    status: "rejected",
    votesFor: 2,
    votesAgainst: 40,
    totalStaked: 44,
    quorum: 66,
    createdAt: "1 day ago",
    proposedAction: {
      type: "transfer",
      description: "Transfer USDC to external address (flagged suspicious)",
      amount: "5,000",
      token: "USDC",
    },
    modelVersion: "claude-sonnet-4-20250514",
  },
];

export const mockActivity: ActivityLog[] = [
  {
    id: "1",
    type: "proposal",
    message: "Agent proposed: Rebalance DOT/USDC to 60/40",
    timestamp: "2 min ago",
    txHash: "0x1a2b...3c4d",
  },
  {
    id: "2",
    type: "vote",
    message: "0xA3f...8B2 voted APPROVE on Proposal #24",
    timestamp: "1 min ago",
    txHash: "0x5e6f...7g8h",
  },
  {
    id: "3",
    type: "agent_cycle",
    message: "Agent cycle #147 completed — 1 new proposal",
    timestamp: "2 min ago",
  },
  {
    id: "4",
    type: "execution",
    message: "Proposal #23 executed: Staked 2,000 DOT",
    timestamp: "5 hours ago",
    txHash: "0x9i0j...1k2l",
  },
  {
    id: "5",
    type: "vote",
    message: "0x7Cd...3E9 voted REJECT on Proposal #22",
    timestamp: "1 day ago",
    txHash: "0x3m4n...5o6p",
  },
  {
    id: "6",
    type: "deposit",
    message: "0xB1e...4F7 deposited 500 DOT",
    timestamp: "1 day ago",
    txHash: "0x7q8r...9s0t",
  },
  {
    id: "7",
    type: "agent_cycle",
    message: "Agent cycle #146 completed — no action needed",
    timestamp: "1 day ago",
  },
  {
    id: "8",
    type: "withdrawal",
    message: "0x2Af...6D1 withdrew 100 USDC",
    timestamp: "2 days ago",
    txHash: "0xu1v2...w3x4",
  },
];
