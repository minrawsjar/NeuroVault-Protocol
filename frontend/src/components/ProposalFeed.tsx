"use client";

import { Proposal } from "@/lib/types";
import ProposalCard from "./ProposalCard";
import { FileText } from "lucide-react";

interface Props {
  proposals: Proposal[];
}

export default function ProposalFeed({ proposals }: Props) {
  const active = proposals.filter((p) => p.status === "active");
  const past = proposals.filter((p) => p.status !== "active");

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <FileText className="w-5 h-5" strokeWidth={2.5} />
        <h2 className="text-2xl font-black uppercase tracking-tight">Proposals</h2>
        {active.length > 0 && (
          <span className="neo-badge bg-brand-yellow">{active.length} Active</span>
        )}
      </div>

      <div className="space-y-4">
        {active.map((p) => (
          <ProposalCard key={p.id} proposal={p} />
        ))}
        {past.map((p) => (
          <ProposalCard key={p.id} proposal={p} />
        ))}
      </div>
    </section>
  );
}
