"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Clock,
  ThumbsDown,
  ThumbsUp,
  Vote,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useWallet } from "@/components/SimpleWallet";
import { useNeuroVaultContract, Proposal, StakerInfo } from "@/hooks/useNeuroVault";

// Status mapping from contract (0=Pending, 1=Approved, 2=Rejected, 3=Executed, 4=Expired)
const STATUS_MAP = ["Pending", "Approved", "Rejected", "Executed", "Expired"];

export default function AppVotePage() {
  const { address, isConnected } = useWallet();
  const {
    getRecentProposals,
    getTreasuryState,
    getStakerInfo,
    vote,
    finalizeProposal,
    isLoading,
    error,
  } = useNeuroVaultContract();

  // Contract data states
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [treasuryState, setTreasuryState] = useState<{ activeProposals: number; apy: number } | null>(null);
  const [stakerInfo, setStakerInfo] = useState<StakerInfo | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [voteSuccess, setVoteSuccess] = useState<string | null>(null);
  const [votes, setVotes] = useState<Record<number, "for" | "against" | null>>({});
  const [votingInProgress, setVotingInProgress] = useState<number | null>(null);

  // Load contract data
  useEffect(() => {
    const loadContractData = async () => {
      if (!isConnected) {
        setIsDataLoading(false);
        return;
      }

      setIsDataLoading(true);
      try {
        const [recentProposals, treasury, staker] = await Promise.all([
          getRecentProposals(10),
          getTreasuryState(),
          address ? getStakerInfo(address) : null,
        ]);

        if (recentProposals.length > 0) {
          setProposals(recentProposals);
        }
        if (treasury) {
          setTreasuryState(treasury);
        }
        if (staker) {
          setStakerInfo(staker);
        }
      } catch (err) {
        console.error("Error loading contract data:", err);
      } finally {
        setIsDataLoading(false);
      }
    };

    loadContractData();
  }, [isConnected, address, getRecentProposals, getTreasuryState, getStakerInfo]);

  // Handle voting
  const handleVote = async (proposalId: number, voteType: "for" | "against") => {
    if (!isConnected) return;

    setVotingInProgress(proposalId);
    try {
      const success = await vote(proposalId, voteType === "for");
      if (success) {
        setVotes((prev) => ({ ...prev, [proposalId]: voteType }));
        setVoteSuccess(`Successfully voted ${voteType} on proposal #${proposalId}`);
        
        // Refresh proposals
        const updatedProposals = await getRecentProposals(10);
        if (updatedProposals.length > 0) {
          setProposals(updatedProposals);
        }
        
        setTimeout(() => setVoteSuccess(null), 5000);
      }
    } finally {
      setVotingInProgress(null);
    }
  };

  // Handle finalize proposal
  const handleFinalize = async (proposalId: number) => {
    const success = await finalizeProposal(proposalId);
    if (success) {
      setVoteSuccess(`Proposal #${proposalId} finalized successfully`);
      
      // Refresh proposals
      const updatedProposals = await getRecentProposals(10);
      if (updatedProposals.length > 0) {
        setProposals(updatedProposals);
      }
      
      setTimeout(() => setVoteSuccess(null), 5000);
    }
  };

  const activeProposals = proposals.filter(p => p.status === 0).length;
  const totalVotes = proposals.reduce((sum, p) => sum + Number(p.votesFor) + Number(p.votesAgainst), 0);

  if (isDataLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading proposals...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-8 text-zinc-300">
      <div className="space-y-8">
        {/* Error Banner */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Success Banner */}
        {voteSuccess && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <p className="text-sm text-emerald-400">{voteSuccess}</p>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-2" />
            <span className="text-sm text-zinc-500">Transaction in progress...</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Data Source</p>
            <p className="text-xl font-bold text-white">NeuroVault Contract</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Current Status</p>
            <p className="text-xl font-bold text-white">
              {activeProposals} active • {proposals.length - activeProposals} closed
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Current APY</p>
            <p className="text-xl font-bold text-white">
              {treasuryState ? `${treasuryState.apy.toFixed(2)}%` : "--"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4 flex items-center justify-between">
              Active Proposals <Clock size={14} className="text-blue-400" />
            </p>
            <div>
              <span className="text-4xl font-bold text-white tracking-tight">{activeProposals}</span>
              <p className="text-sm text-zinc-400 mt-1">Voting ongoing • {totalVotes.toLocaleString()} total votes</p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-blue-500/30 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-4 flex items-center justify-between">
              Your Voting Power <Activity size={14} />
            </p>
            <div>
              <span className="text-4xl font-bold text-white tracking-tight">
                {stakerInfo ? `${stakerInfo.votingPower.toFixed(2)}%` : "0%"}
              </span>
              <p className="text-sm text-zinc-400 mt-1">
                {stakerInfo ? `${stakerInfo.staked} DOT staked` : "Connect wallet to see"}
              </p>
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
            <Vote className="mr-2 text-zinc-400" /> Active & Recent Proposals
          </h2>

          {proposals.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
              <p className="text-zinc-400">No proposals found. Check back later!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  userVote={votes[proposal.id] ?? null}
                  onVote={handleVote}
                  onFinalize={handleFinalize}
                  isVoting={votingInProgress === proposal.id}
                  isLoading={isLoading}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function ProposalCard({
  proposal,
  userVote,
  onVote,
  onFinalize,
  isVoting,
  isLoading,
}: {
  proposal: Proposal;
  userVote: "for" | "against" | null;
  onVote: (proposalId: number, voteType: "for" | "against") => Promise<void>;
  onFinalize: (proposalId: number) => Promise<void>;
  isVoting: boolean;
  isLoading: boolean;
}) {
  const forVotes = Number(proposal.votesFor);
  const againstVotes = Number(proposal.votesAgainst);
  const totalVotes = forVotes + againstVotes;
  const forPercent = totalVotes > 0 ? (forVotes / totalVotes) * 100 : 0;
  const againstPercent = totalVotes > 0 ? (againstVotes / totalVotes) * 100 : 0;
  const isActive = proposal.status === 0; // Pending
  const isExpired = proposal.votingDeadline < Date.now();

  // Map action type to tag
  const actionTags = ["Swap", "Stake", "Transfer", "Rebalance", "None"];
  const tag = actionTags[proposal.actionType] || "General";

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
          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />}
          {STATUS_MAP[proposal.status]}
        </span>
        <span className="text-xs text-zinc-500">
          Confidence: {proposal.confidence}%
        </span>
      </div>

      <h3 className="text-xl font-semibold text-white mb-2">
        #{proposal.id}: {proposal.description}
      </h3>
      <p className="text-sm text-zinc-400 mb-2">
        Amount: {proposal.amount} • Token: {proposal.token.slice(0, 6)}...{proposal.token.slice(-4)}
      </p>
      <p className="text-xs text-zinc-500 mb-6">
        IPFS: {proposal.ipfsHash.slice(0, 20)}... • Proposer: {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}
      </p>

      <div className="mb-6">
        <div className="flex justify-between text-xs text-zinc-500 mb-2 font-medium">
          <span className="flex items-center text-zinc-300"><ThumbsUp size={12} className="mr-1" /> {forVotes.toLocaleString()} For</span>
          <span>{totalVotes.toLocaleString()} total votes</span>
          <span className="flex items-center text-zinc-400">{againstVotes.toLocaleString()} Against <ThumbsDown size={12} className="ml-1" /></span>
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
          <Clock size={12} className="mr-1" />
          {isExpired ? "Voting ended" : `Deadline: ${new Date(proposal.votingDeadline).toLocaleDateString()}`}
        </span>
        
        {isActive && !isExpired ? (
          userVote ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-400">
                ✓ You voted {userVote === "for" ? "For" : "Against"}
              </span>
              <button
                onClick={() => onVote(proposal.id, userVote === "for" ? "against" : "for")}
                disabled={isVoting || isLoading}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
              >
                {isVoting ? "..." : "Change"}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => onVote(proposal.id, "for")}
                disabled={isVoting || isLoading}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 flex items-center gap-1"
              >
                <ThumbsUp size={14} />
                {isVoting ? "..." : "Vote For"}
              </button>
              <button
                onClick={() => onVote(proposal.id, "against")}
                disabled={isVoting || isLoading}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 flex items-center gap-1"
              >
                <ThumbsDown size={14} />
                {isVoting ? "..." : "Vote Against"}
              </button>
            </div>
          )
        ) : isActive && isExpired ? (
          <button
            onClick={() => onFinalize(proposal.id)}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
          >
            {isLoading ? "..." : "Finalize Proposal"}
          </button>
        ) : (
          <button
            disabled
            className="bg-zinc-800 text-zinc-500 cursor-not-allowed px-6 py-2 rounded-lg text-sm font-semibold"
          >
            {STATUS_MAP[proposal.status]}
          </button>
        )}
      </div>
    </div>
  );
}
