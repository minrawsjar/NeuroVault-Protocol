"use client";

import { useEffect, useRef } from "react";
import { TrendingUp, Wallet, PieChart, ArrowUpRight, Activity, Brain } from "lucide-react";

const treasuryMetrics = [
  {
    icon: Wallet,
    label: "Total Value Locked",
    value: "$2.4M",
    change: "+12.5%",
    positive: true,
  },
  {
    icon: PieChart,
    label: "DOT Holdings",
    value: "45,230 DOT",
    change: "+8.2%",
    positive: true,
  },
  {
    icon: TrendingUp,
    label: "USDC Holdings",
    value: "$890K",
    change: "+15.3%",
    positive: true,
  },
  {
    icon: Activity,
    label: "Current APY",
    value: "12.4%",
    change: "+2.1%",
    positive: true,
  },
];

const assetAllocation = [
  { asset: "DOT", percentage: 55, value: "$1.32M" },
  { asset: "USDC", percentage: 35, value: "$890K" },
  { asset: "Staked DOT", percentage: 10, value: "$190K" },
];

export default function TreasurySection() {
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

    const cards = sectionRef.current?.querySelectorAll(".treasury-card");
    cards?.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="treasury"
      className="py-32 px-6 bg-black relative"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-20">
          <span className="text-sm tracking-[0.3em] uppercase text-gray-500 mb-6 block">
            Treasury
          </span>
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Live Assets
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Transparent treasury state with AI-optimized allocation strategies.
            All movements tracked on-chain.
          </p>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-800 mb-px">
          {treasuryMetrics.map((metric, index) => (
            <div
              key={index}
              className="treasury-card group p-8 bg-black opacity-0 translate-y-8 transition-all duration-700 hover:bg-gray-900"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full border border-gray-700 flex items-center justify-center group-hover:border-white group-hover:bg-white group-hover:text-black transition-all">
                  <metric.icon className="w-5 h-5" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${metric.positive ? 'text-white' : 'text-gray-500'}`}>
                  <ArrowUpRight className="w-4 h-4" />
                  {metric.change}
                </div>
              </div>
              <p className="text-gray-500 text-sm mb-1">{metric.label}</p>
              <p className="text-3xl font-light text-white">{metric.value}</p>
            </div>
          ))}
        </div>

        {/* Asset allocation & Strategy */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-gray-800">
          {/* Allocation chart */}
          <div className="p-8 bg-black">
            <h3 className="text-2xl font-light text-white mb-8">Asset Allocation</h3>
            
            {/* Visual bar */}
            <div className="flex h-2 bg-gray-800 rounded-full overflow-hidden mb-8">
              {assetAllocation.map((asset, index) => (
                <div
                  key={index}
                  style={{ width: `${asset.percentage}%` }}
                  className={`h-full ${index === 0 ? 'bg-white' : index === 1 ? 'bg-gray-400' : 'bg-gray-600'}`}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="space-y-4">
              {assetAllocation.map((asset, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-white' : index === 1 ? 'bg-gray-400' : 'bg-gray-600'}`} />
                    <span className="text-white font-medium">{asset.asset}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-gray-500">{asset.value}</span>
                    <span className="text-white w-12 text-right">{asset.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Strategy */}
          <div className="p-8 bg-black border-l border-gray-800">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-full border border-gray-700 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-light text-white">AI Strategy</h3>
                <p className="text-gray-500">Conservative Growth</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {[
                { label: "Risk Profile", value: "Low-Medium" },
                { label: "Rebalance Threshold", value: "5% deviation" },
                { label: "Next Proposal", value: "12 minutes" },
                { label: "Confidence Target", value: "> 70%" },
              ].map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between py-4 border-b border-gray-800 last:border-0"
                >
                  <span className="text-gray-500">{item.label}</span>
                  <span className="text-white font-medium">{item.value}</span>
                </div>
              ))}
            </div>

            <button className="w-full py-4 bg-white text-black rounded-full font-medium hover:bg-gray-200 transition-all">
              View Full Strategy
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
