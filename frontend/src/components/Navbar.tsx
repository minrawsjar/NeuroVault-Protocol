"use client";

import { useState } from "react";
import { Brain, Wallet, Menu, X, ExternalLink } from "lucide-react";

export default function Navbar() {
  const [connected, setConnected] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="border-b-3 border-border bg-white sticky top-0 z-50" style={{ borderBottomWidth: "3px" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-yellow border-3 border-border flex items-center justify-center" style={{ borderWidth: "3px" }}>
              <Brain className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase">NeuroVault</h1>
              <p className="text-[10px] font-bold tracking-widest uppercase text-foreground/50 -mt-1">AI Treasury Protocol</p>
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://polkadot.network"
              target="_blank"
              rel="noopener noreferrer"
              className="neo-badge bg-brand-pink text-foreground flex items-center gap-1"
            >
              Polkadot Hub <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="#"
              className="neo-badge bg-brand-cyan text-foreground flex items-center gap-1"
            >
              neurovault.eth <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={() => setConnected(!connected)}
              className={`neo-btn px-4 py-2 text-sm ${
                connected ? "bg-brand-lime" : "bg-brand-yellow"
              }`}
            >
              <span className="flex items-center gap-2">
                <Wallet className="w-4 h-4" strokeWidth={2.5} />
                {connected ? "0xA3f...8B2" : "Connect Wallet"}
              </span>
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden neo-btn p-2 bg-brand-yellow"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-3">
            <a href="https://polkadot.network" target="_blank" rel="noopener noreferrer" className="neo-badge bg-brand-pink text-foreground w-fit">
              Polkadot Hub
            </a>
            <a href="#" className="neo-badge bg-brand-cyan text-foreground w-fit">
              neurovault.eth
            </a>
            <button
              onClick={() => { setConnected(!connected); setMobileOpen(false); }}
              className={`neo-btn px-4 py-2 text-sm w-fit ${connected ? "bg-brand-lime" : "bg-brand-yellow"}`}
            >
              <span className="flex items-center gap-2">
                <Wallet className="w-4 h-4" strokeWidth={2.5} />
                {connected ? "0xA3f...8B2" : "Connect Wallet"}
              </span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
