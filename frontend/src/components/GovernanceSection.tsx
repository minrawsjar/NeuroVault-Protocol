"use client";

import { useRef, useState } from "react";
import { Vote, CheckCircle, XCircle, Clock, ExternalLink, Users } from "lucide-react";

interface Proposal {
  id: number;
  title: string;
  description: string;
  type: "rebalance" | "stake" | "transfer" | "swap";
  confidence: number;
  votesFor: number;
  votesAgainst: number;
  status: "active" | "passed" | "rejected" | "executed";
  timeLeft: string;
  ipfsHash: string;
}

type ProposalFilter = "all" | "active" | "passed" | "rejected";

const mockProposals: Proposal[] = [
  {
    id: 1,
    title: "Rebalance to 55/45 DOT/USDC",
    description: "AI suggests increasing DOT allocation to capture upcoming parachain auction upside",
    type: "rebalance",
    confidence: 82,
    votesFor: 12500,
    votesAgainst: 3200,
    status: "active",
    timeLeft: "2 days",
    ipfsHash: "QmXyz123",
  },
  {
    id: 2,
    title: "Stake 20K DOT in Nomination Pool",
    description: "Optimize yield by staking idle DOT at 14.2% APY via Bifrost",
    type: "stake",
    confidence: 91,
    votesFor: 15200,
    votesAgainst: 1800,
    status: "passed",
    timeLeft: "Executed",
    ipfsHash: "QmAbc456",
  },
  {
    id: 3,
    title: "Cross-chain USDC transfer to Moonbeam",
    description: "Bridge $200K USDC via Hyperbridge for yield farming opportunity",
    type: "transfer",
    confidence: 78,
    votesFor: 8900,
    votesAgainst: 5600,
    status: "rejected",
    timeLeft: "Closed",
    ipfsHash: "QmDef789",
  },
];

const statusConfig: Record<string, { icon: typeof CheckCircle; label: string }> = {
  active: { icon: Clock, label: "Voting" },
  passed: { icon: CheckCircle, label: "Passed" },
  rejected: { icon: XCircle, label: "Rejected" },
  executed: { icon: CheckCircle, label: "Executed" },
};

export default function GovernanceSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [filter, setFilter] = useState<ProposalFilter>("all");

  const filterOptions: ProposalFilter[] = ["all", "active", "passed", "rejected"];

  const filteredProposals = filter === "all" 
    ? mockProposals 
    : mockProposals.filter(p => p.status === filter);

  const totalVotingPower = mockProposals.reduce((acc, p) => acc + p.votesFor + p.votesAgainst, 0);

  return (
    <section
      ref={sectionRef}
      id="governance"
      className="py-32 px-6 bg-black relative"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-20">
          <span className="text-sm tracking-[0.3em] uppercase text-gray-500 mb-6 block">
            Governance
          </span>
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Proposals & Votes
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed">
            Every AI strategy requires staker approval. Review reasoning, cast your vote,
            and shape the treasury&apos;s future.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { icon: Users, value: "1,200+", label: "Stakers" },
              { icon: Vote, value: totalVotingPower.toLocaleString(), label: "Voting Power" },
              { icon: CheckCircle, value: "66%", label: "Quorum Required" },
            ].map((stat, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 px-6 py-3 rounded-full border border-gray-800"
              >
                <stat.icon className="w-5 h-5 text-gray-500" />
                <div className="text-left">
                  <div className="text-lg font-medium text-white">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {filterOptions.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all border ${
                filter === f
                  ? "bg-white text-black border-white"
                  : "text-gray-500 border-gray-800 hover:border-gray-600 hover:text-white"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Proposals grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-gray-800">
          {filteredProposals.map((proposal) => {
            const status = statusConfig[proposal.status];
            const StatusIcon = status.icon;
            const totalVotes = proposal.votesFor + proposal.votesAgainst;
            const forPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;

            return (
              <div 
                key={proposal.id} 
                className="p-8 bg-black hover:bg-gray-900 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border border-gray-700 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {proposal.type.toUpperCase().slice(0, 3)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-medium text-white mb-1">{proposal.title}</h3>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-white">
                          {proposal.confidence}% confidence
                        </span>
                        <span className="flex items-center gap-1 text-xs px-3 py-1 rounded-full border border-gray-700 text-gray-400">
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <a
                    href={`https://ipfs.io/ipfs/${proposal.ipfsHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center hover:border-white hover:bg-white hover:text-black transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Description */}
                <p className="text-gray-500 mb-6 leading-relaxed">
                  {proposal.description}
                </p>

                {/* Vote progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-gray-500">Votes</span>
                    <span className="text-white font-medium">
                      {proposal.votesFor.toLocaleString()} / {totalVotes.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all"
                      style={{ width: `${forPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-2">
                    <span className="text-white">{forPercentage.toFixed(1)}% For</span>
                    <span className="text-gray-500">{proposal.timeLeft}</span>
                  </div>
                </div>

                {/* Actions */}
                {proposal.status === "active" && (
                  <div className="flex gap-4">
                    <button className="flex-1 py-3 bg-white text-black rounded-full font-medium hover:bg-gray-200 transition-all">
                      Vote For
                    </button>
                    <button className="flex-1 py-3 border border-gray-700 text-gray-400 rounded-full font-medium hover:border-white hover:text-white transition-all">
                      Vote Against
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* View all CTA */}
        <div className="text-center mt-16">
          <button className="px-8 py-4 border border-gray-700 text-white rounded-full hover:border-white hover:bg-white hover:text-black transition-all">
            View All Proposals
          </button>
        </div>
      </div>
    </section>
  );
}
