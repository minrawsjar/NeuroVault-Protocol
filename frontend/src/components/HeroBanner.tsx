"use client";

import Link from "next/link";
import { Brain, ArrowRight, Shield, Eye, Cpu } from "lucide-react";

export default function HeroBanner() {
  return (
    <section className="neo-card p-6 md:p-8 relative overflow-hidden" style={{ background: "var(--foreground)", color: "var(--background)" }}>
      {/* Decorative grid */}
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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-brand-yellow border-3 border-background flex items-center justify-center" style={{ borderWidth: "3px" }}>
                <Brain className="w-7 h-7 text-foreground" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-none">
                  NeuroVault
                </h2>
                <p className="text-xs font-bold uppercase tracking-widest text-background/50">
                  AI-Powered Treasury Protocol
                </p>
              </div>
            </div>
            <p className="text-sm md:text-base font-medium leading-relaxed max-w-xl text-background/80">
              An autonomous AI agent manages this shared treasury. Every decision is{" "}
              <span className="text-brand-yellow font-black">cryptographically committed on-chain</span>{" "}
              — reasoning pinned to IPFS, hash stored in the contract. Fully auditable. Forever.
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <Link href="/stake" className="neo-btn px-5 py-3 text-sm bg-brand-yellow text-foreground flex items-center gap-2">
              <span>Stake & Govern</span>
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </Link>
            <button className="neo-btn px-5 py-3 text-sm bg-brand-pink text-foreground flex items-center gap-2">
              <span>View Agent Logs</span>
              <Eye className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 mt-5">
          {[
            { icon: Shield, label: "Verifiable Reasoning", bg: "bg-brand-lime" },
            { icon: Cpu, label: "Claude Sonnet 4 Agent", bg: "bg-brand-cyan" },
            { icon: Eye, label: "IPFS Audit Trail", bg: "bg-brand-purple" },
          ].map((pill) => (
            <div
              key={pill.label}
              className={`${pill.bg} text-foreground neo-badge flex items-center gap-1.5 !text-[10px] !py-1`}
            >
              <pill.icon className="w-3 h-3" strokeWidth={2.5} />
              {pill.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
