import { Vote, FileText, CircleCheck, Gavel, Users, ShieldCheck } from "lucide-react";

const governanceFlow = [
  {
    icon: FileText,
    title: "1. Proposal Is Created",
    description: "AI and community inputs are packaged into a transparent proposal with rationale.",
  },
  {
    icon: Users,
    title: "2. Stakers Review",
    description: "Token holders evaluate expected return, risk, and strategy assumptions.",
  },
  {
    icon: Vote,
    title: "3. Voting Period",
    description: "Votes are cast on-chain with quorum and majority requirements.",
  },
  {
    icon: Gavel,
    title: "4. Execution",
    description: "If approved, execution runs through protocol guardrails and timelocks.",
  },
];

const governanceBenefits = [
  "Community control over treasury decisions",
  "Checks AI actions before capital is moved",
  "On-chain audit trail for every vote",
  "Aligned incentives between stakers and protocol",
];

export default function GovernanceSection() {
  return (
    <section id="governance" className="py-32 px-6 bg-black relative border-t border-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm tracking-[0.3em] uppercase text-gray-500 mb-6 block">Governance</span>
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">How Governance Works</h2>
          <p className="text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
            Governance ensures NeuroVault stays accountable. AI proposes, stakers decide.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="border border-gray-800 bg-black p-8">
            <h3 className="text-2xl font-light text-white mb-8">Governance Flow</h3>
            <div className="space-y-6">
              {governanceFlow.map((item) => (
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
                <CircleCheck className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-light text-white">Benefits</h3>
            </div>

            <div className="space-y-4 mb-8">
              {governanceBenefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3 py-3 border-b border-gray-800 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-white mt-2" />
                  <p className="text-gray-300 leading-relaxed">{benefit}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-gray-800 px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Governance protects treasury through quorum, voting thresholds, and timelocks.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
