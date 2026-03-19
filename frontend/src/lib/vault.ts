export interface VaultSnapshot {
  totalValueUsd: number;
  dotAllocationPct: number;
  usdcAllocationPct: number;
  apyPct: number;
  stakers: number;
  activeProposals: number;
  updatedAt: string;
  source: "mock" | "http";
}

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
  const source = (process.env.VAULT_DATA_SOURCE || "mock").toLowerCase();
  const statusUrl = process.env.VAULT_STATUS_URL;

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
      // fall through to mock
    }
  }

  return {
    ...MOCK_VAULT_SNAPSHOT,
    updatedAt: new Date().toISOString(),
  };
}
