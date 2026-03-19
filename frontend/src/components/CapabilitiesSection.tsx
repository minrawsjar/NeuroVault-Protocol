"use client";

import { useEffect, useRef } from "react";
import { Brain, Shield, Zap, TrendingUp, Lock, Globe } from "lucide-react";

const capabilities = [
  {
    icon: Brain,
    title: "AI-Powered Reasoning",
    description: "Claude analyzes treasury state, market conditions, and staker goals to propose optimal actions",
  },
  {
    icon: Shield,
    title: "Verifiable Proposals",
    description: "Every AI decision is stored on IPFS with a hash commitment on-chain for full transparency",
  },
  {
    icon: Zap,
    title: "Autonomous Execution",
    description: "Agent runs 24/7, monitoring the treasury and proposing rebalancing strategies automatically",
  },
  {
    icon: TrendingUp,
    title: "Yield Optimization",
    description: "Smart staking in Polkadot nomination pools and strategic rebalancing for maximum APY",
  },
  {
    icon: Lock,
    title: "Lit Protocol Security",
    description: "API keys encrypted with Lit Protocol - only authorized agents can decrypt secrets",
  },
  {
    icon: Globe,
    title: "Cross-Chain Ready",
    description: "Hyperbridge integration enables seamless cross-chain treasury management",
  },
];

export default function CapabilitiesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
          }
        });
      },
      { threshold: 0.1 }
    );

    const cards = sectionRef.current?.querySelectorAll(".capability-card");
    cards?.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="capabilities"
      className="py-32 px-6 bg-black relative"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-20">
          <span className="text-sm tracking-[0.3em] uppercase text-gray-500 mb-6 block">
            Capabilities
          </span>
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Intelligent by Design
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            NeuroVault combines cutting-edge AI with blockchain infrastructure 
            to deliver autonomous treasury management
          </p>
        </div>

        {/* Capabilities grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-800">
          {capabilities.map((cap, index) => (
            <div
              key={index}
              className="capability-card group p-8 bg-black opacity-0 translate-y-8 transition-all duration-700 hover:bg-gray-900"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-full border border-gray-700 flex items-center justify-center mb-6 group-hover:border-white group-hover:bg-white group-hover:text-black transition-all">
                <cap.icon className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-medium text-white mb-3">
                {cap.title}
              </h3>
              <p className="text-gray-500 leading-relaxed">
                {cap.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
