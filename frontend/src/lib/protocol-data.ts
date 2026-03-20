import { createPublicClient, createWalletClient, formatUnits, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CONTRACTS, ENS_ABI, NEUROVAULT_ABI } from "@/lib/contracts";
import { getServerAgentApiUrl } from "@/lib/server-env";

const DEFAULT_RPC_URL = "https://eth-rpc-testnet.polkadot.io/";
const RPC_URL = (process.env.VAULT_RPC_URL || process.env.RPC_URL || DEFAULT_RPC_URL).trim();
const publicClient = createPublicClient({
  transport: http(RPC_URL),
});

export interface OnchainGoalRecord {
  id: number;
  text: string;
  status: number;
}

export interface OnchainProposalRecord {
  id: number;
  ipfsHash: string;
  actionType: number;
  description: string;
  amount: string;
  token: string;
  targetToken: string;
  confidence: number;
  status: number;
  votesFor: string;
  votesAgainst: string;
  createdAt: number;
  votingDeadline: number;
  outcome: string;
  proposer: string;
}

export interface OnchainEnsRecord {
  addr: string;
  name: string;
  role: string;
  description: string;
  endpoint: string;
  registeredAt: number;
  active: boolean;
}

export interface AgentRuntimeStatus {
  isRunning: boolean;
  cycleInProgress: boolean;
  cycleCount: number;
  lastCycleCompletedAt: number;
  lastCycleResult?: {
    cycleNumber: number;
    timestamp: string;
    triggerType: string;
    action: string;
    proposalId?: number;
    ipfsHash?: string;
    confidence: number;
    reasoning: string;
    error?: string;
  };
}

export interface DerivedCrossChainTransfer {
  id: string;
  token: "PAS" | "USDC";
  amount: string;
  from: string;
  to: string;
  bridge: "Hyperbridge";
  status: "queued" | "bridging" | "settled" | "failed";
  eta: string;
  proposalId: number;
  description: string;
}

function getVaultAddress() {
  return (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS || CONTRACTS.paseo.NeuroVault) as `0x${string}`;
}

function getEnsAddress() {
  return (process.env.ENS_ADDRESS || CONTRACTS.paseo.NeuroVaultENS) as `0x${string}`;
}

function toStatusLabel(status: number) {
  if (status === 0) return "queued";
  if (status === 1) return "bridging";
  if (status === 3) return "settled";
  return "failed";
}

function toTokenSymbol(address: string) {
  const lower = address.toLowerCase();
  if (lower === CONTRACTS.paseo.USDC.toLowerCase()) return "USDC";
  return "PAS";
}

function toDestination(actionType: number, targetToken: string) {
  if (actionType === 1) return "Bifrost";
  if (actionType === 2 && /^0x[a-fA-F0-9]{40}$/.test(targetToken)) return targetToken;
  if (actionType === 3) return "Treasury Rebalance";
  return "NeuroVault";
}

export async function getActiveGoalsOnchain(): Promise<OnchainGoalRecord[]> {
  const goals = (await publicClient.readContract({
    address: getVaultAddress(),
    abi: NEUROVAULT_ABI,
    functionName: "getActiveGoals",
  })) as Array<{ id: bigint; text: string; status: number }>;

  return goals.map((goal) => ({
    id: Number(goal.id),
    text: goal.text,
    status: Number(goal.status),
  }));
}

export async function getRecentProposalsOnchain(count: number): Promise<OnchainProposalRecord[]> {
  const views = (await publicClient.readContract({
    address: getVaultAddress(),
    abi: NEUROVAULT_ABI,
    functionName: "getRecentProposals",
    args: [BigInt(count)],
  })) as readonly { id: bigint; status: number; outcome: string }[];

  const proposals = await Promise.all(
    views.map(async (view) => {
      const proposal = (await publicClient.readContract({
        address: getVaultAddress(),
        abi: NEUROVAULT_ABI,
        functionName: "getProposal",
        args: [view.id],
      })) as {
        id: bigint;
        ipfsHash: string;
        actionType: number;
        description: string;
        amount: bigint;
        token: string;
        targetToken: string;
        confidence: bigint;
        status: number;
        votesFor: bigint;
        votesAgainst: bigint;
        snapshotTotalStaked: bigint;
        createdAt: bigint;
        votingDeadline: bigint;
        outcome: string;
        proposer: string;
      };

      const tokenSymbol = toTokenSymbol(proposal.token);
      return {
        id: Number(proposal.id),
        ipfsHash: proposal.ipfsHash,
        actionType: Number(proposal.actionType),
        description: proposal.description,
        amount: formatUnits(proposal.amount, tokenSymbol === "USDC" ? 6 : 18),
        token: proposal.token,
        targetToken: proposal.targetToken,
        confidence: Number(proposal.confidence),
        status: Number(proposal.status),
        votesFor: formatUnits(proposal.votesFor, 18),
        votesAgainst: formatUnits(proposal.votesAgainst, 18),
        createdAt: Number(proposal.createdAt) * 1000,
        votingDeadline: Number(proposal.votingDeadline) * 1000,
        outcome: proposal.outcome,
        proposer: proposal.proposer,
      };
    })
  );

  return proposals;
}

export async function getEnsRecordsOnchain(): Promise<OnchainEnsRecord[]> {
  const records = (await publicClient.readContract({
    address: getEnsAddress(),
    abi: ENS_ABI,
    functionName: "getAllActiveRecords",
  })) as Array<{
    addr: string;
    name: string;
    role: string;
    description: string;
    endpoint: string;
    registeredAt: bigint;
    active: boolean;
  }>;

  return records.map((record) => ({
    ...record,
    registeredAt: Number(record.registeredAt),
  }));
}

export async function getAgentRuntimeStatus(): Promise<AgentRuntimeStatus | null> {
  const agentApiUrl = getServerAgentApiUrl();
  if (!agentApiUrl) return null;

  const response = await fetch(`${agentApiUrl.replace(/\/$/, "")}/status`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Agent status request failed (${response.status})`);
  }

  return (await response.json()) as AgentRuntimeStatus;
}

export async function deriveCrossChainQueue(count = 10): Promise<DerivedCrossChainTransfer[]> {
  const proposals = await getRecentProposalsOnchain(count);

  return proposals
    .filter((proposal) => [1, 2, 3].includes(proposal.actionType))
    .map((proposal) => {
      const token = toTokenSymbol(proposal.token);
      return {
        id: `proposal-${proposal.id}`,
        token,
        amount: proposal.amount,
        from: "NeuroVault",
        to: toDestination(proposal.actionType, proposal.targetToken),
        bridge: "Hyperbridge",
        status: toStatusLabel(proposal.status),
        eta: proposal.status === 3 ? "done" : proposal.status === 1 ? "~1m" : "~pending vote",
        proposalId: proposal.id,
        description: proposal.description,
      };
    });
}

export async function registerEnsNameOnchain(params: {
  name: string;
  owner: string;
  role?: string;
  description?: string;
  endpoint?: string;
}) {
  const privateKey = (process.env.ENS_OWNER_PRIVATE_KEY || process.env.AGENT_PRIVATE_KEY || "").trim();
  if (!privateKey) {
    throw new Error("Missing ENS owner key");
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    transport: http(RPC_URL),
  });

  const txHash = await walletClient.writeContract({
    address: getEnsAddress(),
    abi: [
      ...ENS_ABI,
      {
        inputs: [
          { internalType: "string", name: "name", type: "string" },
          { internalType: "address", name: "addr", type: "address" },
          { internalType: "string", name: "role", type: "string" },
          { internalType: "string", name: "description", type: "string" },
          { internalType: "string", name: "endpoint", type: "string" },
        ],
        name: "register",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
    ] as const,
    functionName: "register",
    args: [
      params.name,
      params.owner as `0x${string}`,
      params.role || "staker",
      params.description || "Registered via NeuroVault frontend",
      params.endpoint || "",
    ],
    chain: undefined,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  return {
    txHash,
    blockNumber: receipt.blockNumber,
  };
}
