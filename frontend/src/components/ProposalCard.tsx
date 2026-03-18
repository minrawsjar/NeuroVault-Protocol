"use client";

import { useState } from "react";
import { Proposal } from "@/lib/types";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Brain,
  ArrowRightLeft,
  Landmark,
  SendHorizonal,
  RefreshCw,
  Check,
  X,
  Clock,
} from "lucide-react";

interface Props {
  proposal: Proposal;
}

const actionIcons = {
  swap: ArrowRightLeft,
  stake: Landmark,
  transfer: SendHorizonal,
  rebalance: RefreshCw,
};

const statusStyles = {
  active: { bg: "bg-brand-yellow", label: "VOTING" },
  approved: { bg: "bg-brand-lime", label: "APPROVED" },
  rejected: { bg: "bg-brand-red", label: "REJECTED" },
  executed: { bg: "bg-brand-green", label: "EXECUTED" },
};

export default function ProposalCard({ proposal }: Props) {
  const [expanded, setExpanded] = useState(proposal.status === "active");
  const ActionIcon = actionIcons[proposal.proposedAction.type];
  const status = statusStyles[proposal.status];
  const votePercent =
    proposal.votesFor + proposal.votesAgainst > 0
      ? Math.round(
          (proposal.votesFor / (proposal.votesFor + proposal.votesAgainst)) * 100
        )
      : 0;
  const quorumPercent = Math.round(
    ((proposal.votesFor + proposal.votesAgainst) / proposal.totalStaked) * 100
  );

  return (
    <div className={`neo-card ${proposal.status === "active" ? "!border-brand-yellow" : ""}`} style={proposal.status === "active" ? { borderColor: "var(--brand-yellow)", borderWidth: "3px" } : {}}>
      {/* Header */}
      <div
        className="p-4 cursor-pointer flex items-start justify-between gap-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 shrink-0 ${status.bg} border-2 border-border flex items-center justify-center`}>
            <span className="text-sm font-black">#{proposal.id}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`neo-badge ${status.bg}`}>{status.label}</span>
              <span className="neo-badge bg-surface">
                <ActionIcon className="w-3 h-3 inline mr-1" />
                {proposal.proposedAction.type}
              </span>
            </div>
            <h3 className="font-bold text-sm leading-tight">{proposal.title}</h3>
            <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-foreground/40 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {proposal.createdAt}
              </span>
              <span className="flex items-center gap-1">
                <Brain className="w-3 h-3" /> {proposal.confidence}% confidence
              </span>
            </div>
          </div>
        </div>
        <div className="shrink-0 mt-1">
          {expanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t-3 border-border" style={{ borderTopWidth: "3px" }}>
          {/* Vote bar */}
          <div className="p-4 bg-background">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2">
              <span className="text-brand-green flex items-center gap-1">
                <Check className="w-3 h-3" /> {proposal.votesFor} Approve
              </span>
              <span className="text-foreground/40">{votePercent}% approval</span>
              <span className="text-brand-red flex items-center gap-1">
                {proposal.votesAgainst} Reject <X className="w-3 h-3" />
              </span>
            </div>
            <div className="neo-progress-track h-6">
              <div
                className="h-full bg-brand-green absolute left-0 top-0"
                style={{ width: `${votePercent}%` }}
              />
              <div
                className="h-full bg-brand-red absolute right-0 top-0"
                style={{ width: `${100 - votePercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-foreground/40 mt-2">
              <span>Quorum: {quorumPercent}% / {proposal.quorum}%</span>
              {proposal.executedAt && <span>Executed: {proposal.executedAt}</span>}
            </div>
          </div>

          {/* AI Reasoning */}
          <div className="p-4 border-t-3 border-border" style={{ borderTopWidth: "3px" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4" strokeWidth={2.5} />
                <span className="text-xs font-black uppercase tracking-wider">
                  AI Reasoning
                </span>
              </div>
              <a
                href={`https://ipfs.io/ipfs/${proposal.ipfsHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="neo-badge bg-brand-cyan flex items-center gap-1 cursor-pointer hover:bg-brand-cyan/80"
              >
                IPFS: {proposal.ipfsHash} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="bg-foreground text-background p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap" style={{ border: "3px solid var(--border)" }}>
              {proposal.reasoning}
              {proposal.status === "active" && (
                <span className="animate-blink ml-1">▌</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2 text-[10px] font-bold text-foreground/40 uppercase tracking-wider">
              <span>Model: {proposal.modelVersion}</span>
              <span>Hash verified on-chain</span>
            </div>
          </div>

          {/* Action details */}
          <div className="p-4 border-t-3 border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ borderTopWidth: "3px" }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-orange border-2 border-border flex items-center justify-center">
                <ActionIcon className="w-4 h-4" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-xs font-black uppercase">
                  {proposal.proposedAction.description}
                </p>
                <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">
                  {proposal.proposedAction.amount} {proposal.proposedAction.token}
                  {proposal.proposedAction.targetToken &&
                    ` → ${proposal.proposedAction.targetToken}`}
                </p>
              </div>
            </div>

            {proposal.status === "active" && (
              <div className="flex gap-2">
                <button className="neo-btn px-4 py-2 text-xs bg-brand-green text-white">
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3" /> Approve
                  </span>
                </button>
                <button className="neo-btn px-4 py-2 text-xs bg-brand-red text-white">
                  <span className="flex items-center gap-1">
                    <X className="w-3 h-3" /> Reject
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
