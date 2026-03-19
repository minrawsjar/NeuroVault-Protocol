"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useAccount } from "wagmi";

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
    text: "Increase DOT allocation to 70% during Q2 bull cycle",
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
    text: "Accumulate DOT below $8 average entry",
    proposer: "0xA3f...8B2",
    status: "completed",
    votesFor: 29,
    votesAgainst: 8,
    totalVoters: 40,
    createdAt: "1 month ago",
  },
];

const goalStatusStyles = {
  voting: { bg: "bg-brand-yellow", label: "VOTING" },
  active: { bg: "bg-brand-lime", label: "ACTIVE" },
  completed: { bg: "bg-brand-purple", label: "DONE" },
};

export default function StakePage() {
  const [activeTab, setActiveTab] = useState<Tab>("deposit");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositToken, setDepositToken] = useState<"DOT" | "USDC">("DOT");
  const [withdrawToken, setWithdrawToken] = useState<"DOT" | "USDC">("DOT");
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newGoalText, setNewGoalText] = useState("");
  const { isConnected } = useAccount();

  const mockUserStake = {
    totalStaked: "2,450.00",
    dotStaked: "1,800.00",
    usdcStaked: "650.00",
    votingPower: "5.2%",
    proposalsVoted: 18,
    rewards: "32.50",
    stakingSince: "45 days",
  };

  const dotStakedNum = Number(mockUserStake.dotStaked.replace(/,/g, ""));
  const usdcStakedNum = Number(mockUserStake.usdcStaked.replace(/,/g, ""));
  const totalStakeNum = dotStakedNum + usdcStakedNum;
  const dotPct = totalStakeNum > 0 ? Math.round((dotStakedNum / totalStakeNum) * 100) : 0;
  const usdcPct = 100 - dotPct;

  const tabs: { key: Tab; label: string; icon: typeof Landmark }[] = [
    { key: "deposit", label: "Deposit", icon: ArrowDownToLine },
    { key: "withdraw", label: "Withdraw", icon: ArrowUpFromLine },
    { key: "goals", label: "Govern", icon: Target },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="neo-card !bg-foreground text-background p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-brand-lime flex items-center justify-center" style={{ border: "3px solid var(--background)" }}>
              <Landmark className="w-7 h-7 text-foreground" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-none">
                Stake & Govern
              </h2>
              <p className="text-xs font-bold uppercase tracking-widest text-background/50">
                Deposit tokens · Vote on proposals · Set agent goals
              </p>
            </div>
          </div>
          <p className="text-sm font-medium leading-relaxed max-w-2xl text-background/70">
            Stake DOT or USDC to gain voting power over the AI agent&apos;s decisions. Your stake determines your
            weight in approving or rejecting proposals, and lets you propose new goals for the agent to pursue.
          </p>
        </div>
      </div>

      {/* Your position overview */}
      <section>
        <h3 className="text-lg font-black uppercase tracking-tight mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5" strokeWidth={2.5} /> Your Position
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: "Total Staked", value: `$${mockUserStake.totalStaked}`, icon: Coins, color: "bg-brand-yellow" },
            { label: "DOT Staked", value: `${mockUserStake.dotStaked} DOT`, icon: TrendingUp, color: "bg-brand-pink" },
            { label: "USDC Staked", value: `$${mockUserStake.usdcStaked}`, icon: Coins, color: "bg-brand-cyan" },
            { label: "Voting Power", value: mockUserStake.votingPower, icon: Users, color: "bg-brand-lime" },
            { label: "Votes Cast", value: String(mockUserStake.proposalsVoted), icon: ThumbsUp, color: "bg-brand-purple" },
            { label: "Rewards", value: `$${mockUserStake.rewards}`, icon: TrendingUp, color: "bg-brand-orange" },
            { label: "Staking Since", value: mockUserStake.stakingSince, icon: Clock, color: "bg-brand-green" },
          ].map((stat) => (
            <div key={stat.label} className="neo-card p-3">
              <div className={`w-7 h-7 ${stat.color} border-2 border-border flex items-center justify-center mb-1.5`}>
                <stat.icon className="w-3.5 h-3.5" strokeWidth={2.5} />
              </div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/50 mb-0.5">{stat.label}</p>
              <p className="text-sm font-black">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="neo-card p-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-black uppercase tracking-wider">Stake Split</p>
            <p className="text-[11px] font-bold text-foreground/60">DOT {dotPct}% · USDC {usdcPct}%</p>
          </div>
          <div className="relative h-6 border-2 border-border bg-surface-alt overflow-hidden">
            <div className="absolute left-0 top-0 h-full bg-brand-pink" style={{ width: `${dotPct}%` }} />
            <div className="absolute right-0 top-0 h-full bg-brand-cyan" style={{ width: `${usdcPct}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="p-2 border-2 border-border bg-brand-pink/15">
              <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">DOT Staked</p>
              <p className="text-sm font-black">{mockUserStake.dotStaked} DOT</p>
            </div>
            <div className="p-2 border-2 border-border bg-brand-cyan/15">
              <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">USDC Staked</p>
              <p className="text-sm font-black">${mockUserStake.usdcStaked}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main tabs area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Deposit / Withdraw / Govern */}
        <div className="lg:col-span-2">
          {/* Tab bar */}
          <div className="flex gap-0 mb-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`neo-tab flex items-center gap-2 text-xs ${activeTab === tab.key ? "active" : ""}`}
                >
                  <Icon className="w-4 h-4" strokeWidth={2.5} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Deposit tab */}
          {activeTab === "deposit" && (
            <div className="neo-card p-6">
              <h3 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5" strokeWidth={2.5} /> Deposit Tokens
              </h3>

              <div className="space-y-4">
                {/* Token selector */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 block mb-2">Select Token</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setDepositToken("DOT")}
                      className={`neo-btn px-4 py-3 text-sm text-left ${depositToken === "DOT" ? "bg-brand-pink" : "bg-surface-alt"}`}
                    >
                      <p className="text-[10px] uppercase tracking-wider font-bold opacity-70">DOT</p>
                      <p className="text-sm font-black">{mockUserStake.dotStaked} available</p>
                    </button>
                    <button
                      onClick={() => setDepositToken("USDC")}
                      className={`neo-btn px-4 py-3 text-sm text-left ${depositToken === "USDC" ? "bg-brand-cyan" : "bg-surface-alt"}`}
                    >
                      <p className="text-[10px] uppercase tracking-wider font-bold opacity-70">USDC</p>
                      <p className="text-sm font-black">${mockUserStake.usdcStaked} available</p>
                    </button>
                  </div>
                </div>

                {/* Amount input */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 block mb-2">Amount</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder={`0.00 ${depositToken}`}
                      className="neo-input flex-1 text-base font-bold"
                    />
                    <button
                      onClick={() => setDepositAmount("1000")}
                      className="neo-btn px-4 py-2 text-xs bg-surface-alt"
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
                      className="neo-btn px-3 py-2 text-xs bg-surface-alt"
                    >
                      {amt}
                    </button>
                  ))}
                </div>

                {/* Info box */}
                <div className="bg-brand-yellow/20 p-3 border-2 border-border flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2.5} />
                  <p className="text-xs font-bold leading-relaxed">
                    Depositing gives you proportional voting power over AI agent decisions.
                    You can withdraw at any time. Current vault APY: <span className="text-brand-green">12.4%</span>.
                  </p>
                </div>

                {/* Submit */}
                <button
                  disabled={!isConnected || !depositAmount}
                  className="neo-btn w-full py-3 text-sm bg-brand-lime disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {!isConnected
                    ? "Connect Wallet First"
                    : !depositAmount
                    ? "Enter Amount"
                    : `Deposit ${depositAmount} ${depositToken}`}
                </button>
              </div>
            </div>
          )}

          {/* Withdraw tab */}
          {activeTab === "withdraw" && (
            <div className="neo-card p-6">
              <h3 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-2">
                <ArrowUpFromLine className="w-5 h-5" strokeWidth={2.5} /> Withdraw Tokens
              </h3>

              <div className="space-y-4">
                {/* Token selector */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 block mb-2">Select Token</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setWithdrawToken("DOT")}
                      className={`neo-btn px-4 py-3 text-sm text-left ${withdrawToken === "DOT" ? "bg-brand-pink" : "bg-surface-alt"}`}
                    >
                      <p className="text-[10px] uppercase tracking-wider font-bold opacity-70">DOT</p>
                      <p className="text-sm font-black">{mockUserStake.dotStaked} staked</p>
                    </button>
                    <button
                      onClick={() => setWithdrawToken("USDC")}
                      className={`neo-btn px-4 py-3 text-sm text-left ${withdrawToken === "USDC" ? "bg-brand-cyan" : "bg-surface-alt"}`}
                    >
                      <p className="text-[10px] uppercase tracking-wider font-bold opacity-70">USDC</p>
                      <p className="text-sm font-black">${mockUserStake.usdcStaked} staked</p>
                    </button>
                  </div>
                </div>

                {/* Amount input */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 block mb-2">Amount</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder={`0.00 ${withdrawToken}`}
                      className="neo-input flex-1 text-base font-bold"
                    />
                    <button
                      onClick={() => setWithdrawAmount(withdrawToken === "DOT" ? "1800" : "650")}
                      className="neo-btn px-4 py-2 text-xs bg-surface-alt"
                    >
                      Max
                    </button>
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-brand-red/10 p-3 border-2 border-brand-red flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-brand-red" strokeWidth={2.5} />
                  <p className="text-xs font-bold leading-relaxed">
                    Withdrawing reduces your voting power. If an active proposal is in progress,
                    your existing votes remain counted until the proposal resolves.
                  </p>
                </div>

                {/* Submit */}
                <button
                  disabled={!isConnected || !withdrawAmount}
                  className="neo-btn w-full py-3 text-sm bg-brand-orange disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {!isConnected
                    ? "Connect Wallet First"
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
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                  <Target className="w-5 h-5" strokeWidth={2.5} /> Agent Goals
                </h3>
                <button
                  onClick={() => setShowNewGoal(!showNewGoal)}
                  className="neo-btn px-4 py-2 text-xs bg-brand-yellow flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> New Goal
                </button>
              </div>

              {/* New goal form */}
              {showNewGoal && (
                <div className="neo-card p-4 !border-brand-yellow" style={{ borderColor: "var(--brand-yellow)" }}>
                  <h4 className="text-xs font-black uppercase tracking-wider mb-3">Propose New Goal</h4>
                  <textarea
                    value={newGoalText}
                    onChange={(e) => setNewGoalText(e.target.value)}
                    placeholder="Describe the goal for the AI agent... (e.g., 'Maximize yield while keeping drawdown under 5%')"
                    className="neo-input w-full text-sm min-h-[80px] resize-y"
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      disabled={!isConnected || !newGoalText}
                      className="neo-btn px-4 py-2 text-xs bg-brand-lime disabled:opacity-40"
                    >
                      Submit Goal
                    </button>
                    <button
                      onClick={() => { setShowNewGoal(false); setNewGoalText(""); }}
                      className="neo-btn px-4 py-2 text-xs bg-surface-alt"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Goal list */}
              {mockGoals.map((goal) => {
                const style = goalStatusStyles[goal.status];
                const approvalPct = Math.round((goal.votesFor / (goal.votesFor + goal.votesAgainst)) * 100);
                const participationPct = Math.round(((goal.votesFor + goal.votesAgainst) / goal.totalVoters) * 100);

                return (
                  <div key={goal.id} className="neo-card p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-10 h-10 shrink-0 ${style.bg} border-2 border-border flex items-center justify-center`}>
                          <span className="text-xs font-black">#{goal.id}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`neo-badge ${style.bg}`}>{style.label}</span>
                            <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">
                              by {goal.proposer}
                            </span>
                          </div>
                          <p className="text-sm font-bold leading-tight">{goal.text}</p>
                          <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" /> {goal.createdAt}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Vote bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
                        <span className="text-brand-green">{goal.votesFor} For</span>
                        <span className="text-foreground/40">{approvalPct}% approval · {participationPct}% participation</span>
                        <span className="text-brand-red">{goal.votesAgainst} Against</span>
                      </div>
                      <div className="neo-progress-track h-5">
                        <div className="h-full bg-brand-green absolute left-0 top-0" style={{ width: `${approvalPct}%` }} />
                        <div className="h-full bg-brand-red absolute right-0 top-0" style={{ width: `${100 - approvalPct}%` }} />
                      </div>
                    </div>

                    {/* Vote buttons */}
                    {goal.status === "voting" && (
                      <div className="flex gap-2">
                        <button
                          disabled={!isConnected}
                          className="neo-btn px-4 py-2 text-xs bg-brand-green text-white flex-1 flex items-center justify-center gap-1 disabled:opacity-40"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" /> Vote For
                        </button>
                        <button
                          disabled={!isConnected}
                          className="neo-btn px-4 py-2 text-xs bg-brand-red text-white flex-1 flex items-center justify-center gap-1 disabled:opacity-40"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" /> Vote Against
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right sidebar: How it works */}
        <div className="space-y-4">
          <div className="neo-card p-4">
            <h3 className="text-sm font-black uppercase tracking-wider mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" strokeWidth={2.5} /> How Staking Works
            </h3>
            <div className="space-y-3 text-xs font-bold leading-relaxed">
              <div className="flex gap-3">
                <div className="w-6 h-6 shrink-0 bg-brand-yellow border-2 border-border flex items-center justify-center">
                  <span className="text-[10px] font-black">1</span>
                </div>
                <p><span className="text-foreground">Deposit</span> <span className="text-foreground/60">DOT or USDC into the vault smart contract</span></p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 shrink-0 bg-brand-pink border-2 border-border flex items-center justify-center">
                  <span className="text-[10px] font-black">2</span>
                </div>
                <p><span className="text-foreground">Vote</span> <span className="text-foreground/60">on AI proposals weighted by your stake</span></p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 shrink-0 bg-brand-lime border-2 border-border flex items-center justify-center">
                  <span className="text-[10px] font-black">3</span>
                </div>
                <p><span className="text-foreground">Govern</span> <span className="text-foreground/60">by proposing goals that guide the AI agent</span></p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 shrink-0 bg-brand-cyan border-2 border-border flex items-center justify-center">
                  <span className="text-[10px] font-black">4</span>
                </div>
                <p><span className="text-foreground">Earn</span> <span className="text-foreground/60">yield from the agent&apos;s approved strategies</span></p>
              </div>
            </div>
          </div>

          <div className="neo-card p-4">
            <h3 className="text-sm font-black uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" strokeWidth={2.5} /> Security
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="font-bold uppercase tracking-wider text-foreground/50">Contract</span>
                <span className="neo-badge bg-brand-lime text-[9px]">Audited</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold uppercase tracking-wider text-foreground/50">Agent Keys</span>
                <span className="neo-badge bg-brand-cyan text-[9px]">Lit Protocol</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold uppercase tracking-wider text-foreground/50">Identity</span>
                <span className="font-mono font-bold text-brand-pink">neurovault.eth</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold uppercase tracking-wider text-foreground/50">Chain</span>
                <span className="neo-badge bg-brand-pink text-[9px]">Polkadot Hub</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold uppercase tracking-wider text-foreground/50">Reasoning</span>
                <span className="neo-badge bg-brand-purple text-[9px]">IPFS + On-chain</span>
              </div>
            </div>
          </div>

          <div className="neo-card p-4 bg-brand-yellow/10">
            <h3 className="text-sm font-black uppercase tracking-wider mb-2">Vault Stats</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="font-bold text-foreground/50">TVL</span>
                <span className="font-black">$142,850.00</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-foreground/50">Stakers</span>
                <span className="font-black">47</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-foreground/50">APY</span>
                <span className="font-black text-brand-green">12.4%</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-foreground/50">Proposals</span>
                <span className="font-black">24</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
