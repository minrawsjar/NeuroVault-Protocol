"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  FileText,
  PieChart,
  Shield,
  Wallet,
  Zap,
} from "lucide-react";
import { VaultSnapshot } from "@/lib/vault";

export default function AppTreasuryPage() {
  const [vault, setVault] = useState<VaultSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVault() {
      try {
        const res = await fetch("/api/vault/status");
        if (res.ok) {
          const data = await res.json();
          setVault(data);
        }
      } catch (err) {
        console.error("Error fetching vault:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchVault();
  }, []);

  const tvl = vault?.totalValueUsd ?? 284700;
  const dotPct = vault?.dotAllocationPct ?? 62;
  const usdcPct = vault?.usdcAllocationPct ?? 38;
  const apy = vault?.apyPct ?? 12.4;
  const stakers = vault?.stakers ?? 47;
  const source = vault?.source === "mock" ? "Mock" : "Live network data";

  const dotValue = tvl * (dotPct / 100);
  const usdcValue = tvl * (usdcPct / 100);
  const dotAmount = dotValue / 18.5;
  const usdcAmount = usdcValue;

  const reserveCoverage = 720;

  const recentActivity = [
    {
      title: "Staking Reward Distributed",
      desc: "Automated Protocol Emission",
      val: "+$2,847",
      type: "pos",
      time: "2 hours ago",
      icon: <ArrowUpRight size={18} />,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Governance Proposal Executed",
      desc: "Protocol Version 2.1 Update",
      val: "Tx: 0x8f...2a1",
      type: "neutral",
      time: "Yesterday",
      icon: <FileText size={18} />,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "Treasury Rebalanced",
      desc: "DOT/USDC Ratio Adjusted",
      val: "Tx: 0x1c...9b4",
      type: "neutral",
      time: "Mar 16, 2026",
      icon: <PieChart size={18} />,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
    },
    {
      title: "New Staker Joined",
      desc: "Vault Deposit",
      val: "+$5,000",
      type: "pos",
      time: "Mar 15, 2026",
      icon: <ArrowUpRight size={18} />,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-8 text-zinc-300">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2 flex items-center">
                  <Wallet size={14} className="mr-2" /> Total Value Locked
                </h2>
                <div className="flex items-baseline space-x-4">
                  <span className="text-5xl md:text-6xl font-bold text-white tracking-tight">
                    ${tvl.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 mt-2">{stakers} stakers • {loading ? "Syncing..." : source}</p>
              </div>

              <div className="flex space-x-4">
                <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 min-w-[120px]">
                  <p className="text-xs text-zinc-500 mb-1 flex items-center"><Activity size={12} className="mr-1" /> APY</p>
                  <p className="text-2xl font-semibold text-white">{apy}%</p>
                </div>
                <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 min-w-[120px]">
                  <p className="text-xs text-zinc-500 mb-1 flex items-center"><Shield size={12} className="mr-1" /> Reserve</p>
                  <p className="text-2xl font-semibold text-white">{reserveCoverage}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-6 flex items-center">
              <Clock size={16} className="mr-2 text-zinc-500" /> Recent Treasury Activity
            </h3>
            <div className="space-y-2">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 hover:bg-zinc-800/50 rounded-xl transition-colors group cursor-default">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.bg} ${item.color}`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">{item.title}</p>
                      <p className="text-xs text-zinc-500">{item.time} • {item.desc}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${item.type === "pos" ? "text-emerald-400" : "text-zinc-400 font-mono"}`}>
                    {item.val}
                  </span>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-3 text-sm text-zinc-400 hover:text-white flex items-center justify-center transition-colors">
              View All Activity <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-6 flex items-center">
              <PieChart size={16} className="mr-2 text-zinc-500" /> Asset Allocation
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <span className="text-white font-medium block">Polkadot (DOT)</span>
                    <span className="text-xs text-zinc-500">{dotAmount.toFixed(0)} DOT • ${dotValue.toLocaleString()}</span>
                  </div>
                  <span className="text-blue-400 font-medium text-lg">{dotPct}%</span>
                </div>
                <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-800">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${dotPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <span className="text-white font-medium block">USD Coin (USDC)</span>
                    <span className="text-xs text-zinc-500">{usdcAmount.toFixed(0)} USDC • ${usdcValue.toLocaleString()}</span>
                  </div>
                  <span className="text-indigo-400 font-medium text-lg">{usdcPct}%</span>
                </div>
                <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-800">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${usdcPct}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-900/10 border border-blue-500/20 rounded-xl">
              <p className="text-xs text-blue-400 font-medium flex items-center mb-1">
                <Zap size={12} className="mr-1" /> Next Rebalance
              </p>
              <p className="text-xs text-zinc-400">Scheduled for March 22, 2026 based on AI market condition thresholds.</p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-6 flex items-center">
              <Cpu size={16} className="mr-2 text-indigo-400" /> Privacy Engine
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-white">FHE Encrypted Vaults</p>
                  <p className="text-xs text-zinc-500">Homomorphic state active</p>
                </div>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-white">ZK-Proof Verification</p>
                  <p className="text-xs text-zinc-500">Batched transactions</p>
                </div>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10">
                  <CheckCircle2 size={16} className="text-blue-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
