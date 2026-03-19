"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Bot,
  ChevronRight,
  Clock,
  Cpu,
  FileText,
  Network,
  PieChart,
  Shield,
  Terminal,
  Wallet,
  TrendingUp,
  Vote,
  DollarSign,
  AlertCircle,
  Loader2,
} from "lucide-react";
import ActivityFeed from "@/components/ActivityFeed";
import GoalsPanel from "@/components/GoalsPanel";
import { useWallet } from "@/components/SimpleWallet";
import { useNeuroVaultContract, TreasuryState, Proposal, StakerInfo } from "@/hooks/useNeuroVault";

const activities = [
  {
    id: "a1",
    type: "agent_cycle",
    message: "Agent completed cycle #184 and rebalanced to 62% PAS / 38% USDC",
    timestamp: "2m ago",
    txHash: "0x81F...2cA",
  },
  {
    id: "a2",
    type: "proposal",
    message: "New proposal created: Increase stablecoin floor to 35%",
    timestamp: "11m ago",
    txHash: "0x4Dd...91B",
  },
  {
    id: "a3",
    type: "vote",
    message: "Proposal #18 reached quorum with 71% approval",
    timestamp: "29m ago",
  },
  {
    id: "a4",
    type: "deposit",
    message: "Whale deposited 12,000 USDC into treasury vault",
    timestamp: "54m ago",
    txHash: "0xAa1...77e",
  },
  {
    id: "a5",
    type: "execution",
    message: "Executed staking strategy on Polkadot Hub",
    timestamp: "1h ago",
    txHash: "0x99C...00f",
  },
] as const;

export default function AppPage() {
  const { address, isConnected } = useWallet();
  const {
    getTreasuryState,
    getRecentProposals,
    getStakerInfo,
    getTokenBalances,
    isLoading,
    error,
  } = useNeuroVaultContract();

  // Contract data states
  const [treasuryState, setTreasuryState] = useState<TreasuryState | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [stakerInfo, setStakerInfo] = useState<StakerInfo | null>(null);
  const [tokenBalances, setTokenBalances] = useState<{ pas: string; usdc: string } | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Fallback stats
  const [vaultStats, setVaultStats] = useState({
    totalValueUsd: 284700,
    dotAllocationPct: 62,
    usdcAllocationPct: 38,
    apyPct: 12.4,
    stakers: 47,
    activeProposals: 3,
  });

  const [agentSummary, setAgentSummary] = useState({
    total: 0,
    active: 0,
    degraded: 0,
    offline: 0,
    ensReady: false,
    primaryEns: "",
    accessMode: "wallet+role",
    accessIndependentOfEns: true,
  });

  const [crosschainSummary, setCrosschainSummary] = useState({
    total: 0,
    queued: 0,
    bridging: 0,
    settled: 0,
    bridge: "Hyperbridge",
  });

  const [command, setCommand] = useState("treasury status");
  const [isRunning, setIsRunning] = useState(false);
  const [consoleLines, setConsoleLines] = useState<string[]>([
    "> neurovault bot ready",
    "> deterministic: treasury status | stake 250 PAS | governance queue | agent status | crosschain queue | register ens <name>.eth | resolve ens <name>.eth",
    "> gemini: suggest rebalance plan",
  ]);

  // Load contract data
  useEffect(() => {
    const loadContractData = async () => {
      if (!isConnected || !address) return;

      setIsDataLoading(true);
      try {
        // Load treasury state
        const treasury = await getTreasuryState();
        if (treasury) {
          setTreasuryState(treasury);
          setVaultStats((prev) => ({
            ...prev,
            apyPct: treasury.apy,
            activeProposals: treasury.activeProposals,
          }));
        }

        // Load proposals
        const recentProposals = await getRecentProposals(5);
        if (recentProposals.length > 0) {
          setProposals(recentProposals);
        }

        // Load staker info
        const staker = await getStakerInfo(address);
        if (staker) {
          setStakerInfo(staker);
        }

        // Load token balances
        const balances = await getTokenBalances(address);
        if (balances) {
          setTokenBalances(balances);
        }
      } catch (err) {
        console.error("Error loading contract data:", err);
      } finally {
        setIsDataLoading(false);
      }
    };

    loadContractData();
  }, [isConnected, address, getTreasuryState, getRecentProposals, getStakerInfo, getTokenBalances]);

  // Load other data
  useEffect(() => {
    const loadVault = async () => {
      try {
        const res = await fetch("/api/vault/status");
        if (!res.ok) return;
        const data = await res.json();
        setVaultStats((prev) => ({
          ...prev,
          totalValueUsd: Number(data?.totalValueUsd ?? 284700),
          dotAllocationPct: Number(data?.dotAllocationPct ?? 62),
          usdcAllocationPct: Number(data?.usdcAllocationPct ?? 38),
        }));
      } catch {
        // keep fallback UI values
      }
    };

    const loadAgents = async () => {
      try {
        const res = await fetch("/api/agents");
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.summary) return;
        setAgentSummary({
          total: Number(data.summary.total ?? 0),
          active: Number(data.summary.active ?? 0),
          degraded: Number(data.summary.degraded ?? 0),
          offline: Number(data.summary.offline ?? 0),
          ensReady: Boolean(data.summary.ensReady),
          primaryEns: String(data.summary.primaryEns ?? ""),
          accessMode: String(data.summary.accessMode ?? "wallet+role"),
          accessIndependentOfEns: Boolean(data.summary.accessIndependentOfEns ?? true),
        });
      } catch {
        // keep fallback UI values
      }
    };

    const loadCrosschain = async () => {
      try {
        const res = await fetch("/api/crosschain");
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.summary) return;
        setCrosschainSummary({
          total: Number(data.summary.total ?? 0),
          queued: Number(data.summary.queued ?? 0),
          bridging: Number(data.summary.bridging ?? 0),
          settled: Number(data.summary.settled ?? 0),
          bridge: String(data.summary.bridge ?? "Hyperbridge"),
        });
      } catch {
        // keep fallback UI values
      }
    };

    loadVault();
    loadAgents();
    loadCrosschain();
  }, []);

  const runBotCommand = async (rawCommand?: string) => {
    const input = (rawCommand ?? command).trim();
    if (!input) return;

    setIsRunning(true);
    setConsoleLines((prev) => [...prev.slice(-7), `> ${input}`, "...thinking"]);

    try {
      const res = await fetch("/api/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: input, requesterAddress: address }),
      });

      const data = await res.json();
      const reply = data?.reply || "Bot failed to respond";
      const provider = data?.provider ? ` [${data.provider}]` : "";

      if (data?.action === "ens_register") {
        try {
          const agentsRes = await fetch("/api/agents");
          if (agentsRes.ok) {
            const agentsData = await agentsRes.json();
            if (agentsData?.summary) {
              setAgentSummary({
                total: Number(agentsData.summary.total ?? 0),
                active: Number(agentsData.summary.active ?? 0),
                degraded: Number(agentsData.summary.degraded ?? 0),
                offline: Number(agentsData.summary.offline ?? 0),
                ensReady: Boolean(agentsData.summary.ensReady),
                primaryEns: String(agentsData.summary.primaryEns ?? ""),
                accessMode: String(agentsData.summary.accessMode ?? "wallet+role"),
                accessIndependentOfEns: Boolean(agentsData.summary.accessIndependentOfEns ?? true),
              });
            }
          }
        } catch {
          // non-blocking refresh
        }
      }

      setConsoleLines((prev) => {
        const withoutThinking = prev.filter((line) => line !== "...thinking");
        const lines = [...withoutThinking.slice(-6), `${reply}${provider}`];
        if (data?.lit?.ciphertext) {
          lines.push(`lit sealed: ${String(data.lit.dataToEncryptHash).slice(0, 18)}...`);
        }
        return lines;
      });
    } catch {
      setConsoleLines((prev) => {
        const withoutThinking = prev.filter((line) => line !== "...thinking");
        return [...withoutThinking.slice(-7), "Bot request failed. Check API route."];
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Render loading state
  if (isDataLoading && isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading contract data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-zinc-300">
      {/* Wallet Status Banner */}
      {isConnected && stakerInfo && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-blue-400 font-medium">Your Position</p>
                <p className="text-xs text-zinc-400">
                  Staked: {stakerInfo.staked} PAS • Voting Power: {stakerInfo.votingPower.toFixed(2)}%
                </p>
              </div>
            </div>
            {tokenBalances && (
              <div className="text-right">
                <p className="text-xs text-zinc-500">Balances</p>
                <p className="text-sm text-white">{tokenBalances.pas} PAS • {tokenBalances.usdc} USDC</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-2" />
          <span className="text-sm text-zinc-500">Transaction in progress...</span>
        </div>
      )}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2 flex items-center">
              <Wallet size={14} className="mr-2" /> Total Value Locked
            </h2>
            <span className="text-4xl md:text-6xl font-bold text-white tracking-tight">
              ${treasuryState 
                ? Number(treasuryState.totalValue).toLocaleString() 
                : vaultStats.totalValueUsd.toLocaleString()
              }
            </span>
            <p className="text-sm text-zinc-400 mt-2">
              {treasuryState ? vaultStats.stakers : "--"} stakers • On-chain verified
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 min-w-[120px]">
              <p className="text-xs text-zinc-500 mb-1 flex items-center">
                <Activity size={12} className="mr-1" /> APY
              </p>
              <p className="text-2xl font-semibold text-white">
                {treasuryState ? treasuryState.apy.toFixed(2) : vaultStats.apyPct}%
              </p>
            </div>
            <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 min-w-[120px]">
              <p className="text-xs text-zinc-500 mb-1 flex items-center">
                <Shield size={12} className="mr-1" /> Reserve
              </p>
              <p className="text-2xl font-semibold text-white">720%</p>
            </div>
          </div>
        </div>

        {/* Treasury Breakdown */}
        {treasuryState && (
          <div className="mt-6 pt-6 border-t border-zinc-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">PAS Balance</p>
                  <p className="text-lg font-medium text-white">{Number(treasuryState.dotBalance).toLocaleString()} PAS</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">USDC Balance</p>
                  <p className="text-lg font-medium text-white">{Number(treasuryState.usdcBalance).toLocaleString()} USDC</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Vote className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Active Proposals</p>
                  <p className="text-lg font-medium text-white">{treasuryState.activeProposals}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/app/stake" className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-600 transition-colors">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Stake</p>
          <p className="text-xl font-bold text-white">Deposit & Withdraw</p>
          <p className="text-sm text-zinc-400 mt-1">Manage PAS and USDC positions</p>
        </Link>
        <Link href="/app/treasury" className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-600 transition-colors">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Treasury</p>
          <p className="text-xl font-bold text-white">Current Status</p>
          <p className="text-sm text-zinc-400 mt-1">Allocation, activity, and rebalancing</p>
        </Link>
        <Link href="/app/vote" className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-600 transition-colors">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Governance</p>
          <p className="text-xl font-bold text-white">Proposal Status</p>
          <p className="text-sm text-zinc-400 mt-1">
            {proposals.length > 0 ? `${proposals.filter(p => p.status === 0).length} active proposals` : "Active votes and participation metrics"}
          </p>
        </Link>
      </section>

      {/* Active Proposals Preview */}
      {proposals.length > 0 && (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest flex items-center">
              <Vote size={16} className="mr-2" /> Recent Proposals
            </h3>
            <Link href="/app/vote" className="text-xs text-blue-400 hover:text-blue-300">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {proposals.slice(0, 3).map((proposal) => (
              <div key={proposal.id} className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
                <div>
                  <p className="text-sm text-white font-medium">{proposal.description}</p>
                  <p className="text-xs text-zinc-500">
                    #{proposal.id} • {["Pending", "Approved", "Rejected", "Executed", "Expired"][proposal.status]}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-400">{proposal.votesFor} for</p>
                  <p className="text-xs text-zinc-500">{proposal.votesAgainst} against</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6" id="bot-console">
        <div className="xl:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
          <div className="flex items-center gap-2 text-zinc-300">
            <Terminal className="w-4 h-4" strokeWidth={2.5} />
            <h3 className="text-sm font-semibold uppercase tracking-widest">Treasury Bot Console</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              "treasury status",
              "stake 250 PAS",
              "governance queue",
              "agent status",
              "crosschain queue",
              "register ens neurovault-ops.eth",
              "resolve ens neurovault.eth",
              "suggest rebalance plan",
            ].map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setCommand(preset);
                  runBotCommand(preset);
                }}
                className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-950 text-xs text-zinc-300 hover:border-zinc-500"
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Type a command..."
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
            />
            <button
              onClick={() => runBotCommand()}
              disabled={isRunning}
              className="px-4 py-2 rounded-lg bg-white text-zinc-950 text-sm font-semibold disabled:opacity-50"
            >
              {isRunning ? "Running..." : "Run"}
            </button>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 min-h-[140px] font-mono text-xs space-y-1">
            {consoleLines.map((line, idx) => (
              <p key={`${line}-${idx}`} className="text-zinc-300">
                {line}
              </p>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4 flex items-center">
              <PieChart size={16} className="mr-2" /> Allocation
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white">PAS</span>
                  <span className="text-blue-400">{vaultStats.dotAllocationPct}%</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${vaultStats.dotAllocationPct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white">USDC</span>
                  <span className="text-indigo-400">{vaultStats.usdcAllocationPct}%</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${vaultStats.usdcAllocationPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4 flex items-center">
              <Cpu size={16} className="mr-2 text-indigo-400" /> Privacy Engine
            </h3>
            <div className="space-y-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-medium">FHE Encrypted Vaults</p>
                  <p className="text-xs text-zinc-500">Homomorphic state active</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-medium">ZK-Proof Verification</p>
                  <p className="text-xs text-zinc-500">Batched transactions</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4 flex items-center">
              <Bot size={16} className="mr-2 text-emerald-400" /> External Agents Access
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Active Agents</span>
                <span className="text-white font-semibold">{agentSummary.active}/{agentSummary.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Degraded</span>
                <span className="text-amber-400 font-semibold">{agentSummary.degraded}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Access Control</span>
                <span className="text-emerald-400 font-semibold">
                  {agentSummary.accessMode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">ENS Required</span>
                <span className="text-zinc-300 font-semibold">
                  {agentSummary.accessIndependentOfEns ? "No" : "Yes"}
                </span>
              </div>
              {agentSummary.primaryEns ? (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Linked ENS (optional)</span>
                  <span className="text-zinc-300 font-semibold">{agentSummary.primaryEns}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4 flex items-center">
              <Network size={16} className="mr-2 text-blue-400" /> Hyperbridge / XCM Queue
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Queued</span>
                <span className="text-white font-semibold">{crosschainSummary.queued}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Bridging</span>
                <span className="text-blue-400 font-semibold">{crosschainSummary.bridging}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Settled</span>
                <span className="text-emerald-400 font-semibold">{crosschainSummary.settled}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Bridge</span>
                <span className="text-zinc-300 font-semibold">{crosschainSummary.bridge}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <ActivityFeed activities={[...activities]} />
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <GoalsPanel />
          </div>
          <Link href="/app/vote" className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 flex items-center justify-between hover:border-zinc-600 transition-colors">
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-500">Next Action</p>
              <p className="text-sm font-semibold text-zinc-100">Review active governance proposals</p>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-400" />
          </Link>
        </div>
      </section>
    </div>
  );
}
