"use client";

import { useState, useEffect } from "react";
import {
  Landmark,
  ArrowDownToLine,
  ArrowUpFromLine,
  Target,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Shield,
  Coins,
  TrendingUp,
  Users,
  Clock,
  Info,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useWallet } from "@/components/SimpleWallet";
import { useNeuroVaultContract, TreasuryState, StakerInfo } from "@/hooks/useNeuroVault";

type Tab = "deposit" | "withdraw" | "goals";

interface Goal {
  id: number;
  text: string;
  proposer: string;
  status: "voting" | "active" | "completed";
  votesFor: number;
  votesAgainst: number;
  totalVoters: number;
  createdAt: string;
}

const mockGoals: Goal[] = [
  {
    id: 8,
    text: "Increase PAS allocation to 70% during Q2 bull cycle",
    proposer: "0xA3f...8B2",
    status: "voting",
    votesFor: 18,
    votesAgainst: 5,
    totalVoters: 47,
    createdAt: "3 hours ago",
  },
  {
    id: 7,
    text: "Maintain balanced risk exposure during high-volatility periods",
    proposer: "0x7Cd...3E9",
    status: "active",
    votesFor: 38,
    votesAgainst: 4,
    totalVoters: 47,
    createdAt: "2 days ago",
  },
  {
    id: 6,
    text: "Grow yield to 10% APY this quarter",
    proposer: "0xB1e...4F7",
    status: "active",
    votesFor: 41,
    votesAgainst: 2,
    totalVoters: 47,
    createdAt: "5 days ago",
  },
  {
    id: 5,
    text: "Diversify into 3+ stablecoin positions",
    proposer: "0x2Af...6D1",
    status: "completed",
    votesFor: 35,
    votesAgainst: 6,
    totalVoters: 44,
    createdAt: "2 weeks ago",
  },
  {
    id: 4,
    text: "Accumulate PAS below $8 average entry",
    proposer: "0xA3f...8B2",
    status: "completed",
    votesFor: 29,
    votesAgainst: 8,
    totalVoters: 40,
    createdAt: "1 month ago",
  },
];

const goalStatusStyles = {
  voting: { bg: "bg-blue-900/30 text-blue-300 border-blue-700/50", label: "VOTING", badge: "bg-blue-500/20 text-blue-300" },
  active: { bg: "bg-emerald-900/30 text-emerald-300 border-emerald-700/50", label: "ACTIVE", badge: "bg-emerald-500/20 text-emerald-300" },
  completed: { bg: "bg-zinc-800 text-zinc-300 border-zinc-700/50", label: "DONE", badge: "bg-zinc-700 text-zinc-300" },
};

export default function StakePage() {
  const [activeTab, setActiveTab] = useState<Tab>("deposit");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositToken, setDepositToken] = useState<"PAS" | "USDC">("PAS");
  const [withdrawToken, setWithdrawToken] = useState<"PAS" | "USDC">("PAS");
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newGoalText, setNewGoalText] = useState("");
  const [goalList, setGoalList] = useState<Goal[]>(mockGoals);
  const [goalVotes, setGoalVotes] = useState<Record<number, "for" | "against" | null>>({});
  const [votingGoal, setVotingGoal] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Contract integration
  const { address, isConnected } = useWallet();
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  const { 
    getTreasuryState, 
    getStakerInfo, 
    getTokenBalances,
    stake, 
    unstake,
    isLoading,
    error,
    networkError,
    switchNetwork,
  } = useNeuroVaultContract();
  
  // Real contract data
  const [treasuryState, setTreasuryState] = useState<TreasuryState | null>(null);
  const [stakerInfo, setStakerInfo] = useState<StakerInfo | null>(null);
  const [tokenBalances, setTokenBalances] = useState<{ pas: string; usdc: string } | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [stakeSuccess, setStakeSuccess] = useState<string | null>(null);
  const [unstakeSuccess, setUnstakeSuccess] = useState<string | null>(null);

  // Load contract data
  useEffect(() => {
    const loadContractData = async () => {
      console.log("loadContractData - isConnected:", isConnected, "address:", address);
      
      if (!isConnected || !address) {
        console.log("Skipping data load - not connected or no address");
        setIsDataLoading(false);
        return;
      }

      setIsDataLoading(true);
      try {
        console.log("Loading contract data for address:", address);
        const [treasury, staker, balances] = await Promise.all([
          getTreasuryState(),
          getStakerInfo(address),
          getTokenBalances(address),
        ]);

        console.log("Loaded data:", { treasury, staker, balances });
        
        if (treasury) setTreasuryState(treasury);
        if (staker) setStakerInfo(staker);
        if (balances) setTokenBalances(balances);
      } catch (err) {
        console.error("Error loading contract data:", err);
      } finally {
        setIsDataLoading(false);
      }
    };

    loadContractData();
  }, [isConnected, address, getTreasuryState, getStakerInfo, getTokenBalances]);

  // Handle stake
  const handleStake = async () => {
    if (!depositAmount || !isConnected) return;
    
    const success = await stake(depositAmount);
    if (success) {
      setStakeSuccess(`Successfully staked ${depositAmount} PAS`);
      setDepositAmount("");
      // Refresh data
      const staker = await getStakerInfo(address!);
      const balances = await getTokenBalances(address!);
      if (staker) setStakerInfo(staker);
      if (balances) setTokenBalances(balances);
      setTimeout(() => setStakeSuccess(null), 5000);
    }
  };

  // Handle unstake
  const handleUnstake = async () => {
    if (!withdrawAmount || !isConnected) return;
    
    const success = await unstake(withdrawAmount);
    if (success) {
      setUnstakeSuccess(`Successfully unstaked ${withdrawAmount} PAS`);
      setWithdrawAmount("");
      // Refresh data
      const staker = await getStakerInfo(address!);
      const balances = await getTokenBalances(address!);
      if (staker) setStakerInfo(staker);
      if (balances) setTokenBalances(balances);
      setTimeout(() => setUnstakeSuccess(null), 5000);
    }
  };

  // Use real data or fallback
  const userStake = stakerInfo ? {
    totalStaked: stakerInfo.staked,
    pasStaked: stakerInfo.staked,
    usdcStaked: "0",
    votingPower: `${stakerInfo.votingPower.toFixed(1)}%`,
    proposalsVoted: 18,
    rewards: "32.50",
    stakingSince: "45 days",
  } : {
    totalStaked: "0",
    pasStaked: "0",
    usdcStaked: "0",
    votingPower: "0%",
    proposalsVoted: 0,
    rewards: "0",
    stakingSince: "--",
  };

  const handleGoalVote = async (goalId: number, voteType: "for" | "against") => {
    setVotingGoal(goalId);
    try {
      // Simulate voting
      await new Promise((resolve) => setTimeout(resolve, 600));
      
      // Update goal vote counts
      setGoalList((prev) =>
        prev.map((goal) => {
          if (goal.id === goalId) {
            const oldVote = goalVotes[goalId];
            let newVotesFor = goal.votesFor;
            let newVotesAgainst = goal.votesAgainst;

            // Remove old vote if it exists
            if (oldVote === "for") {
              newVotesFor -= 1;
            } else if (oldVote === "against") {
              newVotesAgainst -= 1;
            }

            // Add new vote
            if (voteType === "for") {
              newVotesFor += 1;
            } else {
              newVotesAgainst += 1;
            }

            return { ...goal, votesFor: newVotesFor, votesAgainst: newVotesAgainst };
          }
          return goal;
        })
      );

      setGoalVotes((prev) => ({
        ...prev,
        [goalId]: voteType,
      }));
    } finally {
      setVotingGoal(null);
    }
  };

  const handleRemoveGoalVote = async (goalId: number) => {
    setVotingGoal(goalId);
    try {
      // Simulate vote removal
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Update goal vote counts
      setGoalList((prev) =>
        prev.map((goal) => {
          if (goal.id === goalId) {
            const oldVote = goalVotes[goalId];
            let newVotesFor = goal.votesFor;
            let newVotesAgainst = goal.votesAgainst;

            // Remove the vote
            if (oldVote === "for") {
              newVotesFor -= 1;
            } else if (oldVote === "against") {
              newVotesAgainst -= 1;
            }

            return { ...goal, votesFor: newVotesFor, votesAgainst: newVotesAgainst };
          }
          return goal;
        })
      );

      setGoalVotes((prev) => ({
        ...prev,
        [goalId]: null,
      }));
    } finally {
      setVotingGoal(null);
    }
  };

  const pasStakedNum = Number(userStake.pasStaked.replace(/,/g, ""));
  const usdcStakedNum = Number(userStake.usdcStaked.replace(/,/g, ""));
  const totalStakeNum = pasStakedNum + usdcStakedNum;
  const pasPct = totalStakeNum > 0 ? Math.round((pasStakedNum / totalStakeNum) * 100) : 0;
  const usdcPct = 100 - pasPct;

  const tabs: { key: Tab; label: string; icon: typeof Landmark }[] = [
    { key: "deposit", label: "Deposit", icon: ArrowDownToLine },
    { key: "withdraw", label: "Withdraw", icon: ArrowUpFromLine },
    { key: "goals", label: "Govern", icon: Target },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Loading Overlay */}
      {isDataLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mr-3" />
          <span className="text-zinc-400">Loading contract data...</span>
        </div>
      )}

      {/* Network Error Banner */}
      {(networkError || (error && error.includes('network'))) && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-sm font-semibold text-red-400">Wrong Network</p>
            </div>
            <button
              onClick={switchNetwork}
              className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 transition-colors"
            >
              Switch to Polkadot Hub TestNet
            </button>
          </div>
          <p className="text-sm text-red-300">
            Please switch to Polkadot Hub TestNet (Chain ID: 420420417) to use NeuroVault.
          </p>
        </div>
      )}
      
      {/* Other Error Banner */}
      {error && !error.includes('network') && !networkError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Success Banners */}
      {stakeSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-400" />
          <p className="text-sm text-emerald-400">{stakeSuccess}</p>
        </div>
      )}
      {unstakeSuccess && (
        <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-orange-400" />
          <p className="text-sm text-orange-400">{unstakeSuccess}</p>
        </div>
      )}

      {/* Transaction Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-2" />
          <span className="text-sm text-zinc-500">Transaction in progress...</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-blue-900/20 via-zinc-900 to-zinc-900 p-6 md:p-8">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <Landmark className="w-7 h-7 text-blue-400" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">Stake & Govern</h1>
            <p className="text-sm text-zinc-400">Deposit tokens, vote on proposals, and shape the AI agent's future</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" /> Your Position
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: "Total Staked", value: `$${userStake.totalStaked}`, icon: Coins, color: "bg-blue-500/10" },
            { label: "PAS Staked", value: `${userStake.pasStaked} PAS`, icon: TrendingUp, color: "bg-indigo-500/10" },
            { label: "USDC Staked", value: `$${userStake.usdcStaked}`, icon: Coins, color: "bg-cyan-500/10" },
            { label: "Voting Power", value: userStake.votingPower, icon: Users, color: "bg-emerald-500/10" },
            { label: "Votes Cast", value: String(userStake.proposalsVoted), icon: ThumbsUp, color: "bg-purple-500/10" },
            { label: "Rewards", value: `$${userStake.rewards}`, icon: TrendingUp, color: "bg-orange-500/10" },
            { label: "Staking Since", value: userStake.stakingSince, icon: Clock, color: "bg-pink-500/10" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700 transition-colors">
              <div className={`w-8 h-8 rounded-lg ${stat.color} border border-zinc-700/50 flex items-center justify-center mb-2`}>
                <stat.icon className="w-4 h-4 text-blue-300" strokeWidth={2} />
              </div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">{stat.label}</p>
              <p className="text-sm font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-zinc-300">Stake Split</p>
            <p className="text-xs text-zinc-500">PAS {pasPct}% · USDC {usdcPct}%</p>
          </div>
          <div className="relative h-3 rounded-full bg-zinc-800 overflow-hidden mb-4">
            <div className="absolute left-0 top-0 h-full bg-blue-500" style={{ width: `${pasPct}%` }} />
            <div className="absolute right-0 top-0 h-full bg-indigo-500" style={{ width: `${usdcPct}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">PAS Staked</p>
              <p className="text-base font-semibold text-white">{userStake.pasStaked} PAS</p>
            </div>
            <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3">
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">USDC Staked</p>
              <p className="text-base font-semibold text-white">${userStake.usdcStaked}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Actions */}
        <div className="lg:col-span-2">
          {/* Tab buttons */}
          <div className="flex gap-2 mb-6 border-b border-zinc-800 pb-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    active
                      ? "text-white border-blue-500"
                      : "text-zinc-400 border-transparent hover:text-zinc-300"
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={2} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Deposit tab */}
          {activeTab === "deposit" && (
            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5 text-blue-400" strokeWidth={2} /> Deposit Tokens
              </h3>

              <div className="space-y-4">
                {/* Token selector */}
                <div>
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide block mb-3">Select Token</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setDepositToken("PAS")}
                      className={`rounded-lg border transition-all p-4 text-left ${
                        depositToken === "PAS"
                          ? "border-blue-500/50 bg-blue-500/20"
                          : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-600"
                      }`}
                    >
                      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">PAS</p>
                      <p className="text-base font-semibold text-white">
                        {!mounted 
                          ? '...' 
                          : !address 
                          ? 'Connect wallet' 
                          : isDataLoading 
                          ? 'Loading...' 
                          : tokenBalances 
                          ? `${Number(tokenBalances.pas).toFixed(2)} available` 
                          : error 
                          ? 'Network error' 
                          : '0.00 available'}
                      </p>
                    </button>
                    <button
                      onClick={() => setDepositToken("USDC")}
                      className={`rounded-lg border transition-all p-4 text-left ${
                        depositToken === "USDC"
                          ? "border-indigo-500/50 bg-indigo-500/20"
                          : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-600"
                      }`}
                    >
                      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">USDC</p>
                      <p className="text-base font-semibold text-white">
                        {!mounted 
                          ? '...' 
                          : !address 
                          ? 'Connect wallet' 
                          : isDataLoading 
                          ? 'Loading...' 
                          : tokenBalances 
                          ? `${Number(tokenBalances.usdc).toFixed(2)} available` 
                          : error 
                          ? 'Network error' 
                          : '0.00 available'}
                      </p>
                    </button>
                  </div>
                </div>

                {/* Amount input */}
                <div>
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide block mb-3">Amount</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder={`0.00 ${depositToken}`}
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 text-white px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => setDepositAmount("1000")}
                      className="rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white px-4 py-2 text-xs font-medium transition-colors"
                    >
                      Max
                    </button>
                  </div>
                </div>

                {/* Quick amounts */}
                <div className="grid grid-cols-4 gap-2">
                  {["100", "500", "1000", "5000"].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setDepositAmount(amt)}
                      className="rounded-lg border border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:text-white text-xs font-medium py-2 transition-colors"
                    >
                      {amt}
                    </button>
                  ))}
                </div>

                {/* Info box */}
                <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 flex items-start gap-3">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" strokeWidth={2} />
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    Depositing gives you proportional voting power. You can withdraw at any time. Current vault APY:{" "}
                    <span className="text-emerald-400 font-semibold">12.4%</span>
                  </p>
                </div>

                {/* Submit */}
                <button
                  onClick={handleStake}
                  disabled={!isConnected || !depositAmount || isLoading}
                  className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold py-3 transition-colors"
                >
                  {!isConnected
                    ? "Connect Wallet First"
                    : isLoading
                    ? "Processing..."
                    : !depositAmount
                    ? "Enter Amount"
                    : `Deposit ${depositAmount} ${depositToken}`}
                </button>
              </div>
            </div>
          )}

          {/* Withdraw tab */}
          {activeTab === "withdraw" && (
            <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <ArrowUpFromLine className="w-5 h-5 text-orange-400" strokeWidth={2} /> Withdraw Tokens
              </h3>

              <div className="space-y-4">
                {/* Token selector */}
                <div>
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide block mb-3">Select Token</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setWithdrawToken("PAS")}
                      className={`rounded-lg border transition-all p-4 text-left ${
                        withdrawToken === "PAS"
                          ? "border-blue-500/50 bg-blue-500/20"
                          : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-600"
                      }`}
                    >
                      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">PAS</p>
                      <p className="text-base font-semibold text-white">{userStake.pasStaked} staked</p>
                    </button>
                    <button
                      onClick={() => setWithdrawToken("USDC")}
                      className={`rounded-lg border transition-all p-4 text-left ${
                        withdrawToken === "USDC"
                          ? "border-indigo-500/50 bg-indigo-500/20"
                          : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-600"
                      }`}
                    >
                      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">USDC</p>
                      <p className="text-base font-semibold text-white">${userStake.usdcStaked} staked</p>
                    </button>
                  </div>
                </div>

                {/* Amount input */}
                <div>
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide block mb-3">Amount</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder={`0.00 ${withdrawToken}`}
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 text-white px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
                    />
                    <button
                      onClick={() => setWithdrawAmount(withdrawToken === "PAS" ? userStake.pasStaked : "0")}
                      className="rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white px-4 py-2 text-xs font-medium transition-colors"
                    >
                      Max
                    </button>
                  </div>
                </div>

                {/* Warning */}
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-red-400" strokeWidth={2} />
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    Withdrawing reduces your voting power. Active proposal votes remain counted until resolution.
                  </p>
                </div>

                {/* Submit */}
                <button
                  onClick={handleUnstake}
                  disabled={!isConnected || !withdrawAmount || isLoading}
                  className="w-full rounded-lg bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold py-3 transition-colors"
                >
                  {!isConnected
                    ? "Connect Wallet First"
                    : isLoading
                    ? "Processing..."
                    : !withdrawAmount
                    ? "Enter Amount"
                    : `Withdraw ${withdrawAmount} ${withdrawToken}`}
                </button>
              </div>
            </div>
          )}

          {/* Govern tab */}
          {activeTab === "goals" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
                <p className="text-sm text-zinc-400 mb-3">You are in Governance mode</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveTab("deposit")}
                    className="rounded-lg border border-zinc-700 bg-blue-600/20 text-blue-300 hover:text-blue-200 px-4 py-2 text-xs font-medium transition-colors"
                  >
                    ← Back to Deposit
                  </button>
                  <button
                    onClick={() => setActiveTab("withdraw")}
                    className="rounded-lg border border-zinc-700 bg-orange-600/20 text-orange-300 hover:text-orange-200 px-4 py-2 text-xs font-medium transition-colors"
                  >
                    ← Back to Withdraw
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-400" strokeWidth={2} /> Agent Goals
                </h3>
                <button
                  onClick={() => setShowNewGoal(!showNewGoal)}
                  className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> New Goal
                </button>
              </div>

              {/* New goal form */}
              {showNewGoal && (
                <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6">
                  <h4 className="text-sm font-semibold text-white mb-4">Propose New Goal</h4>
                  <textarea
                    value={newGoalText}
                    onChange={(e) => setNewGoalText(e.target.value)}
                    placeholder="Describe the goal for the AI agent... (e.g., 'Maximize yield while keeping drawdown under 5%')"
                    className="w-full rounded-lg border border-blue-500/30 bg-zinc-900 text-white px-4 py-3 text-sm min-h-[100px] resize-none focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-2 mt-4">
                    <button
                      disabled={!isConnected || !newGoalText}
                      className="rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white px-4 py-2 text-sm font-medium transition-colors"
                    >
                      Submit Goal
                    </button>
                    <button
                      onClick={() => { setShowNewGoal(false); setNewGoalText(""); }}
                      className="rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white px-4 py-2 text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Goal list */}
              {goalList.map((goal) => {
                const style = goalStatusStyles[goal.status];
                const approvalPct = Math.round((goal.votesFor / (goal.votesFor + goal.votesAgainst)) * 100);
                const participationPct = Math.round(((goal.votesFor + goal.votesAgainst) / goal.totalVoters) * 100);

                return (
                  <div key={goal.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-zinc-700 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-block rounded-lg px-2 py-1 text-xs font-semibold border ${style.badge} border-zinc-700`}>
                            {style.label}
                          </span>
                          <span className="text-xs text-zinc-500">by {goal.proposer}</span>
                        </div>
                        <p className="text-base font-semibold text-white mb-2">{goal.text}</p>
                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {goal.createdAt}
                        </span>
                      </div>
                    </div>

                    {/* Vote bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-zinc-400 mb-2">
                        <span className="text-emerald-400 font-medium">{goal.votesFor} For</span>
                        <span>{approvalPct}% approval · {participationPct}% participation</span>
                        <span className="text-red-400 font-medium">{goal.votesAgainst} Against</span>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden flex">
                        <div className="bg-emerald-500" style={{ width: `${approvalPct}%` }} />
                        <div className="bg-red-500" style={{ width: `${100 - approvalPct}%` }} />
                      </div>
                    </div>

                    {/* Vote buttons */}
                    {goal.status === "voting" && (
                      <div className="flex gap-2">
                        {goalVotes[goal.id] ? (
                          <div className="w-full flex gap-2 items-center">
                            <div className="flex-1 rounded-lg bg-emerald-600/20 border border-emerald-500/50 text-emerald-300 px-4 py-2 text-sm font-medium flex items-center justify-center gap-1">
                              ✓ You voted {goalVotes[goal.id] === "for" ? "For" : "Against"}
                            </div>
                            <button
                              onClick={() => handleGoalVote(goal.id, goalVotes[goal.id] === "for" ? "against" : "for")}
                              disabled={votingGoal === goal.id}
                              className="rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              {votingGoal === goal.id ? "..." : "Change"}
                            </button>
                            <button
                              onClick={() => handleRemoveGoalVote(goal.id)}
                              disabled={votingGoal === goal.id}
                              className="rounded-lg border border-red-500/30 bg-red-900/30 text-red-400 hover:bg-red-900/50 px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              {votingGoal === goal.id ? "..." : "Remove"}
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleGoalVote(goal.id, "for")}
                              disabled={votingGoal === goal.id}
                              className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white px-4 py-2 text-sm font-medium flex items-center justify-center gap-1 transition-colors"
                            >
                              <ThumbsUp className="w-4 h-4" /> {votingGoal === goal.id ? "..." : "Vote For"}
                            </button>
                            <button
                              onClick={() => handleGoalVote(goal.id, "against")}
                              disabled={votingGoal === goal.id}
                              className="flex-1 rounded-lg bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white px-4 py-2 text-sm font-medium flex items-center justify-center gap-1 transition-colors"
                            >
                              <ThumbsDown className="w-4 h-4" /> {votingGoal === goal.id ? "..." : "Vote Against"}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400" /> How Staking Works
            </h3>
            <div className="space-y-3">
              {[
                { num: 1, title: "Deposit", desc: "PAS or USDC into the vault" },
                { num: 2, title: "Vote", desc: "on AI proposals weighted by stake" },
                { num: 3, title: "Govern", desc: "by proposing goals for the AI agent" },
                { num: 4, title: "Earn", desc: "yield from approved strategies" },
              ].map((step) => (
                <div key={step.num} className="flex gap-3">
                  <div className="w-6 h-6 shrink-0 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <span className="text-xs font-semibold text-blue-300">{step.num}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-white font-semibold">{step.title}</span>
                    <span className="text-zinc-400"> - {step.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" /> Security
            </h3>
            <div className="space-y-3 text-xs">
              {[
                { label: "Contract", value: "Audited", color: "text-emerald-400" },
                { label: "Agent Keys", value: "Lit Protocol", color: "text-blue-400" },
                { label: "Identity", value: "neurovault.eth", color: "text-pink-400" },
                { label: "Chain", value: "Polkadot Hub", color: "text-purple-400" },
                { label: "Reasoning", value: "IPFS + On-chain", color: "text-orange-400" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="font-medium text-zinc-400 uppercase tracking-wide">{item.label}</span>
                  <span className={`font-semibold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">Vault Stats</h3>
            <div className="space-y-3 text-sm">
              {[
                { label: "TVL", value: "$142,850.00" },
                { label: "Stakers", value: "47" },
                { label: "APY", value: "12.4%", highlight: true },
                { label: "Proposals", value: "24" },
              ].map((stat) => (
                <div key={stat.label} className="flex justify-between">
                  <span className="text-zinc-400 font-medium">{stat.label}</span>
                  <span className={`font-semibold ${stat.highlight ? "text-emerald-400" : "text-white"}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
