"use client";

import { TreasuryState } from "@/lib/types";
import { Vault, Users, FileCheck, TrendingUp, Clock, Zap } from "lucide-react";

interface Props {
  treasury: TreasuryState;
}

const statCards = [
  {
    label: "Total Value Locked",
    key: "totalValue" as const,
    prefix: "$",
    icon: Vault,
    color: "bg-brand-yellow",
  },
  {
    label: "DOT Balance",
    key: "dotBalance" as const,
    suffix: " DOT",
    icon: TrendingUp,
    color: "bg-brand-pink",
  },
  {
    label: "USDC Balance",
    key: "usdcBalance" as const,
    prefix: "$",
    icon: Zap,
    color: "bg-brand-cyan",
  },
  {
    label: "Active Stakers",
    key: "totalStakers" as const,
    icon: Users,
    color: "bg-brand-lime",
  },
  {
    label: "Proposals Executed",
    key: "executedProposals" as const,
    icon: FileCheck,
    color: "bg-brand-purple",
  },
  {
    label: "Vault APY",
    key: "apy" as const,
    suffix: "%",
    icon: TrendingUp,
    color: "bg-brand-orange",
  },
];

export default function TreasuryStats({ treasury }: Props) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-2xl font-black uppercase tracking-tight">Treasury Overview</h2>
        <span className="neo-badge bg-brand-lime">Live</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const value = treasury[card.key];
          return (
            <div key={card.key} className="neo-card p-4">
              <div className={`w-8 h-8 ${card.color} border-2 border-border flex items-center justify-center mb-2`}>
                <Icon className="w-4 h-4" strokeWidth={2.5} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 mb-1">
                {card.label}
              </p>
              <p className="text-xl font-black">
                {card.prefix ?? ""}
                {value}
                {card.suffix ?? ""}
              </p>
            </div>
          );
        })}
      </div>

      {/* Agent cycle bar */}
      <div className="mt-4 neo-card p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" strokeWidth={2.5} />
          <span className="text-xs font-bold uppercase tracking-wider">
            Last cycle: {treasury.lastCycleAt}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">
            Next cycle in: {treasury.nextCycleAt}
          </span>
          <div className="w-32 neo-progress-track h-4">
            <div
              className="h-full bg-brand-yellow"
              style={{ width: "7%" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
