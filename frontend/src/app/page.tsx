import type { Metadata } from "next";
import HeroSection from "@/components/HeroSection";
import CapabilitiesSection from "@/components/CapabilitiesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TreasurySection from "@/components/TreasurySection";
import GovernanceSection from "@/components/GovernanceSection";
import NeuroVaultLogo from "@/components/Logo";

export const metadata: Metadata = {
  title: "NeuroVault - AI-Powered Treasury Protocol",
  description: "Autonomous treasury management agent using Claude AI for reasoning and on-chain governance for execution",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <HeroSection />
      <CapabilitiesSection />
      <HowItWorksSection />
      <TreasurySection />
      <GovernanceSection />
      
      {/* Footer */}
      <footer className="py-20 px-6 bg-black border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <NeuroVaultLogo className="w-10 h-10 text-white" />
                <span className="text-xl font-medium text-white">NeuroVault</span>
              </div>
              <p className="text-gray-500 max-w-sm leading-relaxed">
                AI-powered treasury management protocol on Polkadot. 
                Autonomous, verifiable, and governed by stakers.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-medium mb-4">Protocol</h4>
              <ul className="space-y-3">
                <li><a href="#capabilities" className="text-gray-500 hover:text-white transition-colors">Capabilities</a></li>
                <li><a href="#how-it-works" className="text-gray-500 hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#treasury" className="text-gray-500 hover:text-white transition-colors">Treasury</a></li>
                <li><a href="#governance" className="text-gray-500 hover:text-white transition-colors">Governance</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-medium mb-4">Resources</h4>
              <ul className="space-y-3">
                <li><a href="https://github.com/minrawsjar/NeuroVault-Protocol" className="text-gray-500 hover:text-white transition-colors">GitHub</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white transition-colors">Agent API</a></li>
                <li><a href="mailto:hello@neurovault.eth" className="text-gray-500 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-sm">
              Built for Polkadot Hackathon 2025
            </p>
            <p className="text-gray-600 text-sm">
              neurovault.eth
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
