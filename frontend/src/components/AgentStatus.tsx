"use client";

import { TreasuryState } from "@/lib/types";
import { Bot, Wifi, WifiOff, Brain, Moon } from "lucide-react";

interface Props {
  treasury: TreasuryState;
}

const statusConfig = {
  online: { label: "Online", color: "bg-brand-green", icon: Wifi, dotColor: "bg-green-500" },
  thinking: { label: "Thinking...", color: "bg-brand-yellow", icon: Brain, dotColor: "bg-yellow-500" },
  sleeping: { label: "Sleeping", color: "bg-brand-purple", icon: Moon, dotColor: "bg-purple-500" },
  offline: { label: "Offline", color: "bg-brand-red", icon: WifiOff, dotColor: "bg-red-500" },
};

export default function AgentStatus({ treasury }: Props) {
  const config = statusConfig[treasury.agentStatus];
  const Icon = config.icon;

  return (
    <div className="neo-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 ${config.color} border-2 border-border flex items-center justify-center`}>
            <Bot className="w-4 h-4" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-foreground/50">Agent Status</p>
            <p className="text-sm font-black uppercase">{config.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${config.dotColor} animate-pulse-dot`} />
          <Icon className="w-4 h-4" strokeWidth={2.5} />
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="font-bold uppercase tracking-wider text-foreground/50">Model</span>
          <span className="font-mono font-bold">claude-sonnet-4</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold uppercase tracking-wider text-foreground/50">Identity</span>
          <span className="font-mono font-bold text-brand-pink">neurovault.eth</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold uppercase tracking-wider text-foreground/50">Cycle #</span>
          <span className="font-mono font-bold">147</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold uppercase tracking-wider text-foreground/50">Secrets</span>
          <span className="neo-badge bg-brand-cyan text-[9px]">Lit Protocol</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold uppercase tracking-wider text-foreground/50">Chain</span>
          <span className="neo-badge bg-brand-pink text-[9px]">Polkadot Hub</span>
        </div>
      </div>
    </div>
  );
}
