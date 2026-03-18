"use client";

import { ActivityLog } from "@/lib/types";
import {
  FileText,
  Vote,
  Zap,
  ArrowDownToLine,
  ArrowUpFromLine,
  Bot,
  ExternalLink,
} from "lucide-react";

interface Props {
  activities: ActivityLog[];
}

const typeConfig = {
  proposal: { icon: FileText, color: "bg-brand-yellow" },
  vote: { icon: Vote, color: "bg-brand-purple" },
  execution: { icon: Zap, color: "bg-brand-green" },
  deposit: { icon: ArrowDownToLine, color: "bg-brand-lime" },
  withdrawal: { icon: ArrowUpFromLine, color: "bg-brand-orange" },
  agent_cycle: { icon: Bot, color: "bg-brand-cyan" },
};

export default function ActivityFeed({ activities }: Props) {
  return (
    <div className="neo-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black uppercase tracking-wider">Activity Feed</h3>
        <span className="neo-badge bg-brand-yellow">{activities.length} events</span>
      </div>
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {activities.map((activity) => {
          const config = typeConfig[activity.type];
          const Icon = config.icon;
          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-2 border-2 border-border bg-background hover:bg-brand-yellow/10 transition-colors"
            >
              <div
                className={`w-7 h-7 shrink-0 ${config.color} border-2 border-border flex items-center justify-center`}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold leading-tight">{activity.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">
                    {activity.timestamp}
                  </span>
                  {activity.txHash && (
                    <a
                      href="#"
                      className="text-[10px] font-bold text-brand-pink uppercase tracking-wider flex items-center gap-0.5 hover:underline"
                    >
                      {activity.txHash} <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
