import { ShieldCheck, Workflow, BarChart3, Lock, Sparkles, Coins } from "lucide-react";

const treasuryFlow = [
  {
    icon: Coins,
    title: "1. Funds Enter Treasury",
    description: "Deposits from stakers are pooled into a protocol-controlled vault.",
  },
  {
    icon: Workflow,
    title: "2. AI Builds Strategy",
    description: "NeuroVault analyzes market, risk, and yield opportunities to propose an allocation plan.",
  },
  {
    icon: ShieldCheck,
    title: "3. Safety Checks Run",
    description: "Execution rules enforce allocation caps, slippage limits, and confidence thresholds.",
  },
  {
    icon: BarChart3,
    title: "4. Performance Is Reported",
    description: "Every rebalance and result is visible on-chain with transparent treasury accounting.",
  },
];

const treasuryBenefits = [
  "Higher capital efficiency through continuous optimization",
  "Transparent on-chain treasury actions and reporting",
  "Risk controls before any movement is executed",
  "Diversification across stable and growth allocations",
];

export default function TreasurySection() {
  return (
    <section id="treasury" className="py-32 px-6 bg-black relative border-t border-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm tracking-[0.3em] uppercase text-gray-500 mb-6 block">Treasury</span>
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">How Treasury Works</h2>
          <p className="text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
            NeuroVault treasury is designed for autonomous allocation with strict safety rails and full transparency.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="border border-gray-800 bg-black p-8">
            <h3 className="text-2xl font-light text-white mb-8">Process</h3>
            <div className="space-y-6">
              {treasuryFlow.map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full border border-gray-700 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">{item.title}</p>
                    <p className="text-gray-500 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-gray-800 bg-black p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 rounded-full border border-gray-700 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-light text-white">Benefits</h3>
            </div>

            <div className="space-y-4 mb-8">
              {treasuryBenefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3 py-3 border-b border-gray-800 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-white mt-2" />
                  <p className="text-gray-300 leading-relaxed">{benefit}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-gray-800 px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Non-custodial design with governance-approved execution.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
