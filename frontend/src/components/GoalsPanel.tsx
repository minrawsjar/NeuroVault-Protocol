"use client";

import { Target, ThumbsUp, Plus } from "lucide-react";

interface Goal {
  id: number;
  text: string;
  status: "active" | "pending" | "completed";
  votes: number;
}

const mockGoals: Goal[] = [
  { id: 7, text: "Maintain balanced risk exposure during high-volatility periods", status: "active", votes: 38 },
  { id: 6, text: "Grow yield to 10% APY this quarter", status: "active", votes: 41 },
  { id: 5, text: "Diversify into 3+ stablecoin positions", status: "completed", votes: 35 },
  { id: 4, text: "Accumulate DOT below $8 average entry", status: "completed", votes: 29 },
];

const statusStyles = {
  active: { bg: "bg-brand-lime", label: "ACTIVE" },
  pending: { bg: "bg-brand-yellow", label: "PENDING" },
  completed: { bg: "bg-brand-purple", label: "DONE" },
};

export default function GoalsPanel() {
  return (
    <div className="neo-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4" strokeWidth={2.5} />
          <h3 className="text-sm font-black uppercase tracking-wider">Agent Goals</h3>
        </div>
        <button className="neo-btn px-3 py-1 text-[10px] bg-brand-yellow flex items-center gap-1">
          <Plus className="w-3 h-3" /> Propose Goal
        </button>
      </div>
      <div className="space-y-2">
        {mockGoals.map((goal) => {
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
                  <span className="text-[10px] font-bold text-foreground/40 flex items-center gap-0.5">
                    <ThumbsUp className="w-2.5 h-2.5" /> {goal.votes} votes
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
