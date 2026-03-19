"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Clock,
  ThumbsDown,
  ThumbsUp,
  Vote,
} from "lucide-react";
import { VaultSnapshot } from "@/lib/vault";

type Proposal = {
  tag: string;
  status: "Active" | "Pending";
  title: string;
  desc: string;
  forVotes: number;
  againstVotes: number;
  deadline: string;
};

const proposals: Proposal[] = [
  {
    tag: "Economics",
    status: "Active",
    title: "Increase APY to 14% for Q2 2026",
    desc: "Proposal to increase staking APY from 12.4% to 14% starting Q2 based on improved yield strategies.",
    forVotes: 38,
    againstVotes: 9,
    deadline: "2026-03-25",
  },
  {
    tag: "Strategy",
    status: "Active",
    title: "Deploy Treasury to Aave v4 Lending",
    desc: "Move 20% of idle USDC reserves to Aave v4 for additional yield generation utilizing custom hooks.",
    forVotes: 32,
    againstVotes: 15,
    deadline: "2026-03-28",
  },
  {
    tag: "Technical",
    status: "Active",
    title: "Protocol Version 2.1 Update",
    desc: "Security patches, performance optimizations for the ZK-Rollup, and new delegated governance features.",
    forVotes: 44,
    againstVotes: 3,
    deadline: "2026-03-30",
  },
  {
    tag: "Expansion",
    status: "Pending",
    title: "Multi-Chain Expansion Phase 1",
    desc: "Initiate deployment plan for Avalanche and Polygon networks. Waiting on security audit completion.",
    forVotes: 0,
    againstVotes: 0,
    deadline: "TBD",
  },
];

export default function AppVotePage() {
  const [vault, setVault] = useState<VaultSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [proposalList, setProposalList] = useState<Proposal[]>(proposals);
  const [votes, setVotes] = useState<Record<string, "for" | "against" | null>>({});
  const [votingInProgress, setVotingInProgress] = useState<string | null>(null);

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

  const handleVote = async (proposalTitle: string, voteType: "for" | "against") => {
    setVotingInProgress(proposalTitle);
    try {
      // Simulate voting action
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      // Update the proposal vote counts
      setProposalList((prev) =>
        prev.map((p) => {
          if (p.title === proposalTitle) {
            const oldVote = votes[proposalTitle];
            let newForVotes = p.forVotes;
            let newAgainstVotes = p.againstVotes;

            // Remove old vote if it exists
            if (oldVote === "for") {
              newForVotes -= 1;
            } else if (oldVote === "against") {
              newAgainstVotes -= 1;
            }

            // Add new vote
            if (voteType === "for") {
              newForVotes += 1;
            } else {
              newAgainstVotes += 1;
            }

            return { ...p, forVotes: newForVotes, againstVotes: newAgainstVotes };
          }
          return p;
        })
      );

      setVotes((prev) => ({
        ...prev,
        [proposalTitle]: voteType,
      }));
    } catch (err) {
      console.error("Voting error:", err);
    } finally {
      setVotingInProgress(null);
    }
  };

  const handleRemoveVote = async (proposalTitle: string) => {
    setVotingInProgress(proposalTitle);
    try {
      // Simulate vote removal
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Update the proposal vote counts
      setProposalList((prev) =>
        prev.map((p) => {
          if (p.title === proposalTitle) {
            const oldVote = votes[proposalTitle];
            let newForVotes = p.forVotes;
            let newAgainstVotes = p.againstVotes;

            // Remove the vote
            if (oldVote === "for") {
              newForVotes -= 1;
            } else if (oldVote === "against") {
              newAgainstVotes -= 1;
            }

            return { ...p, forVotes: newForVotes, againstVotes: newAgainstVotes };
          }
          return p;
        })
      );

      setVotes((prev) => ({
        ...prev,
        [proposalTitle]: null,
      }));
    } catch (err) {
      console.error("Error removing vote:", err);
    } finally {
      setVotingInProgress(null);
    }
  };

  const activeProposals = vault?.activeProposals ?? 3;
  const source = vault?.source === "http" ? "Live" : "Mock";
  const lastSync = vault?.updatedAt ? new Date(vault.updatedAt).toLocaleString() : "Not synced yet";
  const totalVotes = proposals.reduce((sum, p) => sum + p.forVotes + p.againstVotes, 0);

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-8 text-zinc-300">
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Data Source</p>
            <p className="text-xl font-bold text-white">{loading ? "Syncing..." : source}</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Current Status</p>
            <p className="text-xl font-bold text-white">3 active • 1 pending</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Last Sync</p>
            <p className="text-sm font-semibold text-white">{loading ? "Fetching latest" : lastSync}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4 flex items-center justify-between">
              Active Proposals <Clock size={14} className="text-blue-400" />
            </p>
            <div>
              <span className="text-4xl font-bold text-white tracking-tight">{activeProposals}</span>
              <p className="text-sm text-zinc-400 mt-1">Voting ongoing • {totalVotes} total votes</p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-blue-500/30 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-4 flex items-center justify-between">
              Your Voting Power <Activity size={14} />
            </p>
            <div>
              <span className="text-4xl font-bold text-white tracking-tight">1,250</span>
              <p className="text-sm text-zinc-400 mt-1">0.45% of total protocol power</p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4 flex items-center justify-between">
              Participation Rate <CheckCircle2 size={14} className="text-emerald-400" />
            </p>
            <div>
              <span className="text-4xl font-bold text-white tracking-tight">87%</span>
              <p className="text-sm text-zinc-400 mt-1">All time historical average</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <Vote className="mr-2 text-zinc-400" /> Active & Upcoming Proposals
          </h2>

          <div className="space-y-4">
            {proposalList.map((proposal) => (
              <ProposalCard 
                key={proposal.title} 
                {...proposal} 
                userVote={votes[proposal.title] ?? null}
                onVote={handleVote}
                onRemoveVote={handleRemoveVote}
                isVoting={votingInProgress === proposal.title}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function ProposalCard({ 
  tag, 
  status, 
  title, 
  desc, 
  forVotes, 
  againstVotes, 
  deadline,
  userVote,
  onVote,
  onRemoveVote,
  isVoting,
}: Proposal & { 
  userVote: "for" | "against" | null;
  onVote: (proposalTitle: string, voteType: "for" | "against") => Promise<void>;
  onRemoveVote: (proposalTitle: string) => Promise<void>;
  isVoting: boolean;
}) {
  const totalVotes = forVotes + againstVotes;
  const forPercent = totalVotes > 0 ? (forVotes / totalVotes) * 100 : 0;
  const againstPercent = totalVotes > 0 ? (againstVotes / totalVotes) * 100 : 0;
  const isActive = status === "Active";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all duration-300">
      <div className="flex items-center space-x-3 mb-4">
        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-800 rounded-md">
          {tag}
        </span>
        <span
          className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center border ${
            isActive
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-zinc-800 text-zinc-400 border-zinc-700"
          }`}
        >
          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />}
          {status}
        </span>
      </div>

      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 mb-6 max-w-3xl">{desc}</p>

      <div className="mb-6">
        <div className="flex justify-between text-xs text-zinc-500 mb-2 font-medium">
          <span className="flex items-center text-zinc-300"><ThumbsUp size={12} className="mr-1" /> {forVotes} For</span>
          <span>{totalVotes} total votes</span>
          <span className="flex items-center text-zinc-400">{againstVotes} Against <ThumbsDown size={12} className="ml-1" /></span>
        </div>

        {totalVotes > 0 ? (
          <div className="w-full h-2 bg-zinc-950 rounded-full flex overflow-hidden border border-zinc-800">
            <div className="bg-blue-500 h-full" style={{ width: `${forPercent}%` }} />
            <div className="bg-zinc-600 h-full" style={{ width: `${againstPercent}%` }} />
          </div>
        ) : (
          <div className="w-full h-2 bg-zinc-950 rounded-full border border-zinc-800" />
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
        <span className="text-xs text-zinc-500 flex items-center">
          <Clock size={12} className="mr-1" /> Deadline: {deadline}
        </span>
        {isActive ? (
          userVote ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-400">
                ✓ You voted {userVote === "for" ? "For" : "Against"}
              </span>
              <button
                onClick={() => onVote(title, userVote === "for" ? "against" : "for")}
                disabled={isVoting}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
              >
                {isVoting ? "..." : "Change"}
              </button>
              <button
                onClick={() => onRemoveVote(title)}
                disabled={isVoting}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-500/30 disabled:opacity-50"
              >
                {isVoting ? "..." : "Remove"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                // Open vote modal or inline voting UI
                // For now, default to "for"
                onVote(title, "for");
              }}
              disabled={isVoting}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                isVoting
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-white text-zinc-950 hover:bg-zinc-200"
              }`}
            >
              {isVoting ? "Voting..." : "Cast Your Vote"}
            </button>
          )
        ) : (
          <button
            disabled
            className="bg-zinc-800 text-zinc-500 cursor-not-allowed px-6 py-2 rounded-lg text-sm font-semibold"
          >
            Voting Closed
          </button>
        )}
      </div>
    </div>
  );
}
