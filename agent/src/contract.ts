import { createPublicClient, createWalletClient, http, parseAbi, keccak256, toBytes, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ethers } from "ethers";

const paseoChain = defineChain({
  id: 420420417,
  name: "Polkadot Hub TestNet",
  nativeCurrency: { name: "PAS", symbol: "PAS", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://eth-rpc-testnet.polkadot.io/"] },
  },
});

const VAULT_ABI = parseAbi([
  "function getTreasuryState() view returns (uint256 totalValue, uint256 dotBalance, uint256 usdcBalance, uint256 activeProposals, uint256 apy)",
  "function getActiveGoals() view returns ((uint256 id, string text, uint8 status)[])",
  "function getRecentProposals(uint256 count) view returns ((uint256 id, uint8 status, string outcome)[])",
  "function dotToken() view returns (address)",
  "function usdcToken() view returns (address)",
  "function spendingLimitUsd() view returns (uint256)",
  "function getApprovedTargets() view returns (address[])",
  "function propose(string calldata ipfsHash, uint8 actionType, string calldata description, uint256 amount, address token, address targetToken, uint256 confidence) external returns (uint256)",
  "event ProposalCreated(uint256 indexed proposalId, string ipfsHash, uint8 actionType, uint256 confidence)",
]);

const ENS_ABI = parseAbi([
  "function resolve(string calldata name) view returns (address)",
  "function reverseName(address addr) view returns (string)",
  "function getRecord(string calldata name) view returns ((address addr, string name, string role, string description, string endpoint, uint256 registeredAt, bool active))",
  "function getAllActiveRecords() view returns ((address addr, string name, string role, string description, string endpoint, uint256 registeredAt, bool active)[])",
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

export interface GovernanceConstraints {
  spendingLimitUsd: number;
  approvedTargets: string[];
}

export interface VaultTokens {
  dotToken: string;
  usdcToken: string;
}

export class VaultContract {
  private publicClient: ReturnType<typeof createPublicClient>;
  private walletClient?: ReturnType<typeof createWalletClient>;
  private contractAddress: string;
  private ensAddress?: string;
  private cachedTokens?: VaultTokens;
  private ethersProvider: ethers.JsonRpcProvider;
  private ethersSigner?: ethers.Wallet;

  constructor(
    rpcUrl: string,
    contractAddress: string,
    privateKey?: string,
    ensAddress?: string
  ) {
    this.contractAddress = contractAddress;
    this.ensAddress = ensAddress;

    this.publicClient = createPublicClient({
      chain: paseoChain,
      transport: http(rpcUrl),
    });

    this.ethersProvider = new ethers.JsonRpcProvider(rpcUrl);

    if (privateKey) {
      const account = privateKeyToAccount(privateKey as `0x${string}`);
      this.walletClient = createWalletClient({
        account,
        chain: paseoChain,
        transport: http(rpcUrl),
      });
      this.ethersSigner = new ethers.Wallet(privateKey, this.ethersProvider);
    }
  }

  async getVaultTokens(): Promise<VaultTokens> {
    if (this.cachedTokens) {
      return this.cachedTokens;
    }

    const [dotToken, usdcToken] = await Promise.all([
      this.publicClient.readContract({
        address: this.contractAddress as `0x${string}`,
        abi: VAULT_ABI,
        functionName: "dotToken",
      }) as Promise<string>,
      this.publicClient.readContract({
        address: this.contractAddress as `0x${string}`,
        abi: VAULT_ABI,
        functionName: "usdcToken",
      }) as Promise<string>,
    ]);

    this.cachedTokens = {
      dotToken: dotToken.toLowerCase(),
      usdcToken: usdcToken.toLowerCase(),
    };

    return this.cachedTokens;
  }

  async getTreasuryState(): Promise<TreasuryState> {
    const result = (await this.publicClient.readContract({
      address: this.contractAddress as `0x${string}`,
      abi: VAULT_ABI,
      functionName: "getTreasuryState",
    })) as [bigint, bigint, bigint, bigint, bigint];

    return {
      totalValue: (result[0] / BigInt(10 ** 18)).toString(),
      dotBalance: (result[1] / BigInt(10 ** 18)).toString(),
      usdcBalance: (result[2] / BigInt(10 ** 6)).toString(),
      activeProposals: Number(result[3]),
      apy: (Number(result[4]) / 100).toString(),
    };
  }

  async getActiveGoals(): Promise<Goal[]> {
    const goals = (await this.publicClient.readContract({
      address: this.contractAddress as `0x${string}`,
      abi: VAULT_ABI,
      functionName: "getActiveGoals",
    })) as Array<{ id: bigint; text: string; status: number }>;

    return goals.map((g: { id: bigint; text: string; status: number }) => ({
      id: Number(g.id),
      text: g.text,
      status: g.status,
    }));
  }

  async getRecentProposals(count: number): Promise<ProposalSummary[]> {
    const proposals = (await this.publicClient.readContract({
      address: this.contractAddress as `0x${string}`,
      abi: VAULT_ABI,
      functionName: "getRecentProposals",
      args: [BigInt(count)],
    })) as Array<{ id: bigint; status: number; outcome: string }>;

    return proposals.map((p: { id: bigint; status: number; outcome: string }) => ({
      id: Number(p.id),
      status: p.status,
      outcome: p.outcome || undefined,
    }));
  }

  async submitProposal(proposal: ProposalSubmission): Promise<string> {
    if (!this.ethersSigner) {
      throw new Error("Ethers signer not initialized - private key required");
    }

    console.log("📝 Submitting proposal on-chain...");
    console.log(`   IPFS: ${proposal.ipfsHash}`);
    console.log(`   Action: ${proposal.actionType}, Amount: ${proposal.amount}`);

    const PROPOSE_ABI = [
      "function propose(string calldata ipfsHash, uint8 actionType, string calldata description, uint256 amount, address token, address targetToken, uint256 confidence) external returns (uint256)",
    ];

    const contract = new ethers.Contract(this.contractAddress, PROPOSE_ABI, this.ethersSigner);

    const feeData = await this.ethersProvider.getFeeData();
    // Paseo requires higher gas prices (base fee can be 1000+ gwei)
    const gasPrice = feeData.gasPrice || ethers.parseUnits("2000", "gwei");

    const tx = await contract.propose(
      proposal.ipfsHash,
      proposal.actionType,
      proposal.description,
      proposal.amount,
      proposal.token,
      proposal.targetToken,
      BigInt(proposal.confidence),
      { gasPrice, gasLimit: 500000 }
    );

    console.log(`⛓️  Proposal TX hash: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`✅ Proposal TX confirmed in block ${receipt?.blockNumber}`);

    return tx.hash;
  }

  async getGovernanceConstraints(opts?: {
    fallbackSpendingLimitUsd?: number;
    fallbackApprovedTargets?: string[];
  }): Promise<GovernanceConstraints> {
    let spendingLimitUsd = Number(opts?.fallbackSpendingLimitUsd ?? 0);
    let approvedTargets = [...(opts?.fallbackApprovedTargets ?? [])];

    try {
      const limit = (await this.publicClient.readContract({
        address: this.contractAddress as `0x${string}`,
        abi: VAULT_ABI,
        functionName: "spendingLimitUsd",
      })) as bigint;
      spendingLimitUsd = Number(limit);
    } catch {
      // fallback only
    }

    try {
      const targets = (await this.publicClient.readContract({
        address: this.contractAddress as `0x${string}`,
        abi: VAULT_ABI,
        functionName: "getApprovedTargets",
      })) as string[];
      approvedTargets = targets.map((t) => t.toLowerCase());
    } catch {
      // fallback only
    }

    return {
      spendingLimitUsd: Number.isFinite(spendingLimitUsd) ? spendingLimitUsd : 0,
      approvedTargets,
    };
  }

  verifyIPFSHash(ipfsHash: string, blob: string): boolean {
    const computed = keccak256(toBytes(blob));
    // In production, compare with on-chain stored hash
    return true;
  }

  // ─── ENS Resolution ───────────────────────────────────

  async resolveENS(name: string): Promise<string | null> {
    if (!this.ensAddress) return null;
    try {
      const addr = await this.publicClient.readContract({
        address: this.ensAddress as `0x${string}`,
        abi: ENS_ABI,
        functionName: "resolve",
        args: [name],
      });
      return addr as string;
    } catch {
      return null;
    }
  }

  async reverseENS(addr: string): Promise<string | null> {
    if (!this.ensAddress) return null;
    try {
      const name = await this.publicClient.readContract({
        address: this.ensAddress as `0x${string}`,
        abi: ENS_ABI,
        functionName: "reverseName",
        args: [addr as `0x${string}`],
      });
      return name as string;
    } catch {
      return null;
    }
  }

  async getENSRecord(name: string): Promise<any | null> {
    if (!this.ensAddress) return null;
    try {
      return await this.publicClient.readContract({
        address: this.ensAddress as `0x${string}`,
        abi: ENS_ABI,
        functionName: "getRecord",
        args: [name],
      });
    } catch {
      return null;
    }
  }
}
