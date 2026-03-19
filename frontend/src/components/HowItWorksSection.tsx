"use client";

import { useRef } from "react";
import { Eye, Brain, Upload, Vote, CheckCircle } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Eye,
    title: "Monitor",
    description: "AI reads treasury state, balances, and active goals from the blockchain every 30 minutes",
  },
  {
    number: "02",
    icon: Brain,
    title: "Reason",
    description: "Claude Sonnet 4 analyzes market conditions and generates optimal strategies with confidence scores",
  },
  {
    number: "03",
    icon: Upload,
    title: "Store",
    description: "Full reasoning is encrypted and stored with an on-chain hash commitment for verification",
  },
  {
    number: "04",
    icon: Vote,
    title: "Govern",
    description: "Stakers vote with their tokens - 66% quorum with majority approval required for execution",
  },
  {
    number: "05",
    icon: CheckCircle,
    title: "Execute",
    description: "Approved strategies execute automatically - rebalancing, staking, or cross-chain transfers",
  },
];

const CONNECTOR_PATH =
  "M 200 80 Q 400 80, 500 160 T 800 240 Q 600 320, 500 400 T 200 480 Q 400 560, 500 640 T 800 720";

export default function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="py-32 px-6 bg-black relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-24">
          <span className="text-sm tracking-[0.3em] uppercase text-gray-500 mb-6 block">
            Process
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 uppercase tracking-tight">
            How It Works
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            From continuous monitoring to autonomous execution
          </p>
        </div>

        {/* Zig-Zag Steps */}
        <div className="relative">
          {/* SVG Connecting Path */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none hidden lg:block"
            preserveAspectRatio="none"
          >
            <path
              d={CONNECTOR_PATH}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="2"
              strokeDasharray="8 4"
            />
          </svg>

          <div className="space-y-24 lg:space-y-32">
            {steps.map((step, index) => {
              const isLeft = index % 2 === 0;
              const Icon = step.icon;
              
              return (
                <div
                  key={index}
                  className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-16 ${
                    isLeft ? "lg:flex-row" : "lg:flex-row-reverse"
                  }`}
                >
                  {/* Content side */}
                  <div className={`flex-1 text-center ${isLeft ? "lg:text-right" : "lg:text-left"}`}>
                    <div className={`inline-flex items-center gap-3 mb-4 ${isLeft ? "lg:flex-row-reverse" : ""}`}>
                      <span className="text-6xl md:text-7xl lg:text-8xl font-black text-white/10">
                        {step.number}
                      </span>
                    </div>
                    <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 uppercase tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-gray-400 text-lg md:text-xl leading-relaxed max-w-md mx-auto lg:mx-0">
                      {step.description}
                    </p>
                  </div>

                  {/* Icon center */}
                  <div className="relative flex-shrink-0">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl scale-150" />
                    {/* Icon circle */}
                    <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border border-gray-700 bg-black flex items-center justify-center">
                      <Icon className="w-10 h-10 md:w-12 md:h-12 text-white" />
                    </div>
                    {/* Step badge */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 bg-white text-black rounded-full text-sm font-bold">
                      {step.number}
                    </div>
                  </div>

                  {/* Empty spacer for layout balance */}
                  <div className="flex-1 hidden lg:block" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
