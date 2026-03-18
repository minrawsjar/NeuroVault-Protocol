import HeroBanner from "@/components/HeroBanner";
import TreasuryStats from "@/components/TreasuryStats";
import ProposalFeed from "@/components/ProposalFeed";
import AgentStatus from "@/components/AgentStatus";
import ActivityFeed from "@/components/ActivityFeed";
import GoalsPanel from "@/components/GoalsPanel";
import { mockTreasury, mockProposals, mockActivity } from "@/lib/mock-data";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Hero */}
      <HeroBanner />

      {/* Treasury stats */}
      <TreasuryStats treasury={mockTreasury} />

      {/* Main content: proposals + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Proposals — 2/3 width */}
        <div className="lg:col-span-2">
          <ProposalFeed proposals={mockProposals} />
        </div>

        {/* Sidebar — 1/3 width */}
        <div className="space-y-4">
          <AgentStatus treasury={mockTreasury} />
          <GoalsPanel />
          <ActivityFeed activities={mockActivity} />
        </div>
      </div>
    </div>
  );
}
