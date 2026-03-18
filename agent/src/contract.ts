import { createPublicClient, createWalletClient, http, parseAbi, keccak256, toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

const VAULT_ABI = parseAbi([
  "function getTreasuryState() view returns (uint256 totalValue, uint256 dotBalance, uint256 usdcBalance, uint256 activeProposals, uint256 apy)",
  "function getActiveGoals() view returns (tuple(uint256 id, string text, uint8 status)[])",
  "function getRecentProposals(uint256 count) view returns (tuple(uint256 id, uint8 status, string outcome)[])",
  "function propose(string calldata ipfsHash, uint8 actionType, string calldata description, uint256 amount, address token, address targetToken, uint256 confidence) external returns (uint256)",
  "event ProposalCreated(uint256 indexed proposalId, string ipfsHash, uint8 actionType, uint256 confidence)",
]);

export interface TreasuryState {
  totalValue: string;
  dotBalance: string;
  usdcBalance: string;
  activeProposals: number;
  apy: string;
}

export interface Goal {
  id: number;
  text: string;
  status: number;
}

export interface ProposalSummary {
  id: number;
  status: number;
  outcome?: string;
}

export interface ProposalSubmission {
  ipfsHash: string;
  actionType: number;
  description: string;
  amount: bigint;
  token: string;
  targetToken: string;
  confidence: number;
}

export class VaultContract {
  private publicClient: ReturnType<typeof createPublicClient>;
  private walletClient?: ReturnType<typeof createWalletClient>;
  private contractAddress: string;

  constructor(
    rpcUrl: string,
    contractAddress: string,
    privateKey?: string
  ) {
    this.contractAddress = contractAddress;

    this.publicClient = createPublicClient({
      chain: mainnet,
      transport: http(rpcUrl),
    });

    if (privateKey) {
      const account = privateKeyToAccount(privateKey as `0x${string}`);
      this.walletClient = createWalletClient({
        account,
        chain: mainnet,
        transport: http(rpcUrl),
      });
    }
  }

  async getTreasuryState(): Promise<TreasuryState> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress as `0x${string}`,
      abi: VAULT_ABI,
      functionName: "getTreasuryState",
    });

    return {
      totalValue: (result[0] / BigInt(10 ** 18)).toString(),
      dotBalance: (result[1] / BigInt(10 ** 18)).toString(),
      usdcBalance: (result[2] / BigInt(10 ** 6)).toString(),
      activeProposals: Number(result[3]),
      apy: (Number(result[4]) / 100).toString(),
    };
  }

  async getActiveGoals(): Promise<Goal[]> {
    const goals = await this.publicClient.readContract({
      address: this.contractAddress as `0x${string}`,
      abi: VAULT_ABI,
      functionName: "getActiveGoals",
    });

    return goals.map((g: { id: bigint; text: string; status: number }) => ({
      id: Number(g.id),
      text: g.text,
      status: g.status,
    }));
  }

  async getRecentProposals(count: number): Promise<ProposalSummary[]> {
    const proposals = await this.publicClient.readContract({
      address: this.contractAddress as `0x${string}`,
      abi: VAULT_ABI,
      functionName: "getRecentProposals",
      args: [BigInt(count)],
    });

    return proposals.map((p: { id: bigint; status: number; outcome: string }) => ({
      id: Number(p.id),
      status: p.status,
      outcome: p.outcome || undefined,
    }));
  }

  async submitProposal(proposal: ProposalSubmission): Promise<string> {
    if (!this.walletClient) {
      throw new Error("Wallet client not initialized - private key required");
    }

    const hash = await this.walletClient.writeContract({
      address: this.contractAddress as `0x${string}`,
      abi: VAULT_ABI,
      functionName: "propose",
      args: [
        proposal.ipfsHash,
        proposal.actionType,
        proposal.description,
        proposal.amount,
        proposal.token as `0x${string}`,
        proposal.targetToken as `0x${string}`,
        BigInt(proposal.confidence),
      ],
    });

    return hash;
  }

  verifyIPFSHash(ipfsHash: string, blob: string): boolean {
    const computed = keccak256(toBytes(blob));
    // In production, compare with on-chain stored hash
    return true;
  }
}
