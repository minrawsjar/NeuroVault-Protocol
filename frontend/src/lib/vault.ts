import { createPublicClient, http, parseAbi } from "viem";

export interface VaultSnapshot {
  totalValueUsd: number;
  dotAllocationPct: number;
  usdcAllocationPct: number;
  apyPct: number;
  stakers: number;
  activeProposals: number;
  updatedAt: string;
  source: "mock" | "http" | "onchain";
}

const VAULT_ABI = parseAbi([
  "function getTreasuryState() view returns (uint256 totalValue, uint256 dotBalance, uint256 usdcBalance, uint256 activeProposals, uint256 apy)",
]);

const MOCK_VAULT_SNAPSHOT: VaultSnapshot = {
  totalValueUsd: 284700,
  dotAllocationPct: 62,
  usdcAllocationPct: 38,
  apyPct: 12.4,
  stakers: 47,
  activeProposals: 3,
  updatedAt: new Date().toISOString(),
  source: "mock",
};

function clampPct(value: number) {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

function normalizeFromUnknown(payload: unknown): VaultSnapshot | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;

  const directTotal = Number(obj.totalValueUsd ?? obj.totalValue ?? obj.tvl);
  const directDotPct = Number(obj.dotAllocationPct ?? obj.dotPct ?? obj.dot_ratio);
  const directUsdcPct = Number(obj.usdcAllocationPct ?? obj.usdcPct ?? obj.usdc_ratio);
  const directApy = Number(obj.apyPct ?? obj.apy);
  const directStakers = Number(obj.stakers ?? obj.totalStakers);
  const directActive = Number(obj.activeProposals ?? obj.openProposals);

  if (
    Number.isFinite(directTotal) &&
    Number.isFinite(directDotPct) &&
    Number.isFinite(directUsdcPct)
  ) {
    return {
      totalValueUsd: directTotal,
      dotAllocationPct: clampPct(directDotPct),
      usdcAllocationPct: clampPct(directUsdcPct),
      apyPct: Number.isFinite(directApy) ? directApy : 0,
      stakers: Number.isFinite(directStakers) ? Math.floor(directStakers) : 0,
      activeProposals: Number.isFinite(directActive) ? Math.floor(directActive) : 0,
      updatedAt: new Date().toISOString(),
      source: "http",
    };
  }

  // Support agent /status style payloads with treasuryState nesting.
  const treasuryState = obj.treasuryState as Record<string, unknown> | undefined;
  if (treasuryState) {
    const total = Number(treasuryState.totalValue);
    const dotBalance = Number(treasuryState.dotBalance);
    const usdcBalance = Number(treasuryState.usdcBalance);
    const denom = dotBalance + usdcBalance;

    if (Number.isFinite(total) && Number.isFinite(dotBalance) && Number.isFinite(usdcBalance) && denom > 0) {
      const dotPct = (dotBalance / denom) * 100;
      const usdcPct = 100 - dotPct;
      return {
        totalValueUsd: total,
        dotAllocationPct: clampPct(dotPct),
        usdcAllocationPct: clampPct(usdcPct),
        apyPct: Number(treasuryState.apy ?? 0),
        stakers: Number.isFinite(directStakers) ? Math.floor(directStakers) : 0,
        activeProposals: Number(treasuryState.activeProposals ?? directActive ?? 0),
        updatedAt: new Date().toISOString(),
        source: "http",
      };
    }
  }

  return null;
}

export async function getVaultSnapshot(): Promise<VaultSnapshot> {
  const source = (process.env.VAULT_DATA_SOURCE || "onchain").toLowerCase();
  const allowLocalFallback = (process.env.ALLOW_LOCAL_FALLBACK || "false").toLowerCase() === "true";
  const statusUrl = process.env.VAULT_STATUS_URL;
  const vaultRpcUrl = process.env.VAULT_RPC_URL || process.env.RPC_URL;
  const vaultContractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS;

  if (source === "onchain") {
    try {
      if (!vaultRpcUrl || !vaultContractAddress) {
        throw new Error("Missing VAULT_RPC_URL/RPC_URL or CONTRACT_ADDRESS");
      }

      const client = createPublicClient({
        transport: http(vaultRpcUrl),
      });

      const result = (await client.readContract({
        address: vaultContractAddress as `0x${string}`,
        abi: VAULT_ABI,
        functionName: "getTreasuryState",
      })) as [bigint, bigint, bigint, bigint, bigint];

      const totalValueRaw = Number(result[0]) / 1e18;
      const dotBalanceRaw = Number(result[1]) / 1e18;
      const usdcBalanceRaw = Number(result[2]) / 1e6;
      const denom = dotBalanceRaw + usdcBalanceRaw;

      const dotPct = denom > 0 ? clampPct((dotBalanceRaw / denom) * 100) : 0;
      const usdcPct = 100 - dotPct;

      return {
        totalValueUsd: totalValueRaw,
        dotAllocationPct: dotPct,
        usdcAllocationPct: usdcPct,
        apyPct: Number(result[4]) / 100,
        stakers: 0,
        activeProposals: Number(result[3]),
        updatedAt: new Date().toISOString(),
        source: "onchain",
      };
    } catch (err) {
      if (!allowLocalFallback) {
        throw new Error(`On-chain vault read failed: ${String(err)}`);
      }
    }
  }

  if (source === "http" && statusUrl) {
    try {
      const response = await fetch(statusUrl, {
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 20 },
      });
      if (response.ok) {
        const payload = await response.json();
        const normalized = normalizeFromUnknown(payload);
        if (normalized) {
          return normalized;
        }
      }
    } catch {
      if (!allowLocalFallback) {
        throw new Error("HTTP vault read failed and local fallback disabled");
      }
    }
  }

  if (!allowLocalFallback) {
    throw new Error("Vault data unavailable and local fallback disabled");
  }

  return {
    ...MOCK_VAULT_SNAPSHOT,
    updatedAt: new Date().toISOString(),
  };
}
