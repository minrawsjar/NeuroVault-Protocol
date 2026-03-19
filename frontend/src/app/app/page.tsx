"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, Bot, Landmark, Target, Terminal, Coins, ArrowDownToLine } from "lucide-react";
import ActivityFeed from "@/components/ActivityFeed";
import GoalsPanel from "@/components/GoalsPanel";

const activities = [
  {
    id: "a1",
    type: "agent_cycle",
    message: "Agent completed cycle #184 and rebalanced to 62% DOT / 38% USDC",
    timestamp: "2m ago",
    txHash: "0x81F...2cA",
  },
  {
    id: "a2",
    type: "proposal",
    message: "New proposal created: Increase stablecoin floor to 35%",
    timestamp: "11m ago",
    txHash: "0x4Dd...91B",
  },
  {
    id: "a3",
    type: "vote",
    message: "Proposal #18 reached quorum with 71% approval",
    timestamp: "29m ago",
  },
  {
    id: "a4",
    type: "deposit",
    message: "Whale deposited 12,000 USDC into treasury vault",
    timestamp: "54m ago",
    txHash: "0xAa1...77e",
  },
  {
    id: "a5",
    type: "execution",
    message: "Executed staking strategy on Polkadot Hub",
    timestamp: "1h ago",
    txHash: "0x99C...00f",
  },
] as const;

export default function AppPage() {
  const [stakeAmount, setStakeAmount] = useState("250");
  const [stakeToken, setStakeToken] = useState<"DOT" | "USDC">("DOT");
  const [command, setCommand] = useState("treasury status");
  const [isRunning, setIsRunning] = useState(false);
  const [consoleLines, setConsoleLines] = useState<string[]>([
    "> neurovault bot ready",
    "> try: treasury status | stake 250 DOT | governance queue",
  ]);

  const runBotCommand = async (rawCommand?: string) => {
    const input = (rawCommand ?? command).trim();
    if (!input) return;

    setIsRunning(true);
    setConsoleLines((prev) => [...prev.slice(-7), `> ${input}`, "...thinking"]);

    try {
      const res = await fetch("/api/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: input }),
      });

      const data = await res.json();
      const reply = data?.reply || "Bot failed to respond";
      const provider = data?.provider ? ` [${data.provider}]` : "";

      setConsoleLines((prev) => {
        const withoutThinking = prev.filter((line) => line !== "...thinking");
        return [...withoutThinking.slice(-7), `${reply}${provider}`];
      });
    } catch {
      setConsoleLines((prev) => {
        const withoutThinking = prev.filter((line) => line !== "...thinking");
        return [...withoutThinking.slice(-7), "Bot request failed. Check API route."];
      });
    } finally {
      setIsRunning(false);
    }
  };

  const quickStake = () => {
    const cmd = `stake ${stakeAmount || "0"} ${stakeToken}`;
    setCommand(cmd);
    runBotCommand(cmd);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <section className="neo-card !bg-foreground text-background p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-12 h-12 bg-brand-yellow flex items-center justify-center"
                style={{ border: "3px solid var(--background)" }}
              >
                <Bot className="w-7 h-7 text-foreground" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-none">
                  NeuroVault Command
                </h1>
                <p className="text-xs font-bold uppercase tracking-widest text-background/50">
                  Autonomous treasury · Human governance
                </p>
              </div>
            </div>
            <p className="text-sm font-medium leading-relaxed max-w-2xl text-background/70">
              This is your live operations dashboard for treasury activity, AI cycle output,
              and governance navigation.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Treasury Value", value: "$284.7K", icon: Landmark, color: "bg-brand-cyan" },
          { label: "Agent Cycles", value: "184", icon: Bot, color: "bg-brand-lime" },
          { label: "Open Proposals", value: "3", icon: Target, color: "bg-brand-yellow" },
          { label: "24h Activity", value: "29 events", icon: Activity, color: "bg-brand-purple" },
        ].map((item) => (
          <div key={item.label} className="neo-card p-3">
            <div className={`w-7 h-7 ${item.color} border-2 border-border flex items-center justify-center mb-1.5`}>
              <item.icon className="w-3.5 h-3.5" strokeWidth={2.5} />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/50 mb-0.5">{item.label}</p>
            <p className="text-sm font-black">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="neo-card p-3 sm:p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/app/overview", label: "Overview" },
            { href: "/app/stake", label: "Stake & Govern" },
            { href: "/app/vote", label: "Vote" },
            { href: "/app/treasury", label: "Treasury" },
          ].map((link) => (
            <Link key={link.href} href={link.href} className="neo-btn px-4 py-2 text-xs bg-surface-alt">
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6" id="bot-console">
        <div className="neo-card p-5 xl:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4" strokeWidth={2.5} />
            <h3 className="text-sm font-black uppercase tracking-wider">Treasury Bot Console</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              "treasury status",
              "stake 250 DOT",
              "governance queue",
            ].map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setCommand(preset);
                  runBotCommand(preset);
                }}
                className="neo-btn px-3 py-1 text-[10px] bg-surface-alt"
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Type a command..."
              className="neo-input flex-1 text-sm"
            />
            <button
              onClick={() => runBotCommand()}
              disabled={isRunning}
              className="neo-btn px-4 py-2 text-sm bg-brand-lime disabled:opacity-50"
            >
              {isRunning ? "Running..." : "Run"}
            </button>
          </div>

          <div className="border-2 border-border bg-black/60 p-3 min-h-[140px] font-mono text-xs space-y-1">
            {consoleLines.map((line, idx) => (
              <p key={`${line}-${idx}`} className="text-white/80">
                {line}
              </p>
            ))}
          </div>
        </div>

        <div className="neo-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4" strokeWidth={2.5} />
            <h3 className="text-sm font-black uppercase tracking-wider">Quick Stake</h3>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Amount</p>
            <input
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="neo-input w-full text-sm"
              placeholder="0.00"
            />
          </div>

          <div className="flex gap-2">
            {(["DOT", "USDC"] as const).map((token) => (
              <button
                key={token}
                onClick={() => setStakeToken(token)}
                className={`neo-btn px-4 py-2 text-xs ${stakeToken === token ? "bg-brand-cyan" : "bg-surface-alt"}`}
              >
                {token}
              </button>
            ))}
          </div>

          <button onClick={quickStake} className="neo-btn w-full py-2 text-sm bg-brand-yellow flex items-center justify-center gap-2">
            <ArrowDownToLine className="w-4 h-4" strokeWidth={2.5} /> Simulate Stake
          </button>

          <p className="text-xs text-foreground/60">
            This is a simple interface for command testing. Execute real deposits in the Stake page.
          </p>

          <Link href="/app/stake" className="neo-btn w-full py-2 text-xs bg-surface-alt text-center">
            Open Full Stake Interface
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ActivityFeed activities={[...activities]} />
        </div>
        <div className="space-y-6">
          <GoalsPanel />
          <Link
            href="/app/stake"
            className="neo-card p-4 flex items-center justify-between hover:-translate-y-0.5 transition-transform"
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">Next Action</p>
              <p className="text-sm font-black">Stake more and increase voting power</p>
            </div>
            <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
          </Link>
        </div>
      </section>
    </div>
  );
}
