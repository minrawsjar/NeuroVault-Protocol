"use client";

import { Target } from "lucide-react";

interface Goal {
  id: number;
  text: string;
  status: "active" | "pending" | "completed";
}

const statusStyles = {
  active: { bg: "bg-brand-lime", label: "ACTIVE" },
  pending: { bg: "bg-brand-yellow", label: "PENDING" },
  completed: { bg: "bg-brand-purple", label: "DONE" },
};

export default function GoalsPanel({ goals }: { goals: Goal[] }) {
  return (
    <div className="neo-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4" strokeWidth={2.5} />
          <h3 className="text-sm font-black uppercase tracking-wider">Agent Goals</h3>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">On-chain</span>
      </div>
      <div className="space-y-2">
        {goals.length === 0 ? (
          <div className="p-3 border-2 border-dashed border-border bg-background text-xs font-bold text-foreground/40">
            No active goals found on-chain.
          </div>
        ) : goals.map((goal) => {
          const style = statusStyles[goal.status];
          return (
            <div
              key={goal.id}
              className="flex items-start gap-3 p-2 border-2 border-border bg-background"
            >
              <div className={`w-7 h-7 shrink-0 ${style.bg} border-2 border-border flex items-center justify-center`}>
                <span className="text-[10px] font-black">#{goal.id}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold leading-tight">{goal.text}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`neo-badge ${style.bg} text-[9px]`}>{style.label}</span>
                  <span className="text-[10px] font-bold text-foreground/40">
                    Governance actions flow through proposals
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
