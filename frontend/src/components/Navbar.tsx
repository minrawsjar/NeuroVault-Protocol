"use client";

import { useState } from "react";
import Link from "next/link";
import { Brain, Wallet, Menu, X, ExternalLink, Sun, Moon, LogOut, Copy, Check } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { injected } from "wagmi/connectors";

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [walletDropdown, setWalletDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { address, isConnected } = useAccount();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });

  const handleConnect = () => {
    connect({ connector: injected() });
  };

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <nav className="bg-surface sticky top-0 z-50" style={{ borderBottomWidth: "3px", borderBottomStyle: "solid", borderBottomColor: "var(--border)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-yellow flex items-center justify-center" style={{ border: "3px solid var(--border)" }}>
              <Brain className="w-6 h-6 text-foreground" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase">NeuroVault</h1>
              <p className="text-[10px] font-bold tracking-widest uppercase text-foreground/50 -mt-1">AI Treasury Protocol</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/" className="neo-badge bg-brand-pink text-foreground flex items-center gap-1">
              Dashboard
            </Link>
            <Link href="/stake" className="neo-badge bg-brand-lime text-foreground flex items-center gap-1">
              Stake & Govern
            </Link>
            <a
              href="https://polkadot.network"
              target="_blank"
              rel="noopener noreferrer"
              className="neo-badge bg-brand-cyan text-foreground flex items-center gap-1"
            >
              Polkadot <ExternalLink className="w-3 h-3" />
            </a>

            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="neo-btn p-2 bg-brand-purple"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" strokeWidth={2.5} />
              ) : (
                <Moon className="w-4 h-4" strokeWidth={2.5} />
              )}
            </button>

            {/* Wallet */}
            <div className="relative">
              {isConnected && address ? (
                <button
                  onClick={() => setWalletDropdown(!walletDropdown)}
                  className="neo-btn px-4 py-2 text-sm bg-brand-lime"
                >
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-green" />
                    <span>{truncateAddress(address)}</span>
                  </span>
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="neo-btn px-4 py-2 text-sm bg-brand-yellow disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" strokeWidth={2.5} />
                    {isConnecting ? "Connecting..." : "Connect Wallet"}
                  </span>
                </button>
              )}

              {/* Wallet dropdown */}
              {walletDropdown && isConnected && address && (
                <div className="absolute right-0 top-full mt-2 w-64 neo-card p-0 z-50">
                  <div className="p-3 border-b-2 border-border">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 mb-1">Connected</p>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm">{truncateAddress(address)}</span>
                      <button onClick={handleCopy} className="p-1 hover:bg-surface-alt transition-colors">
                        {copied ? <Check className="w-3.5 h-3.5 text-brand-green" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  {balance && (
                    <div className="p-3 border-b-2 border-border">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 mb-1">Balance</p>
                      <p className="font-mono font-bold text-sm">
                        {(Number(balance.value) / 10 ** balance.decimals).toFixed(4)} {balance.symbol}
                      </p>
                    </div>
                  )}
                  <div className="p-3 border-b-2 border-border">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 mb-1">Network</p>
                    <span className="neo-badge bg-brand-pink text-[9px]">Ethereum</span>
                  </div>
                  <button
                    onClick={() => { disconnect(); setWalletDropdown(false); }}
                    className="w-full p-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-red hover:bg-brand-red/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile buttons */}
          <div className="flex md:hidden items-center gap-2">
            <button onClick={toggleTheme} className="neo-btn p-2 bg-brand-purple">
              {theme === "dark" ? <Sun className="w-4 h-4" strokeWidth={2.5} /> : <Moon className="w-4 h-4" strokeWidth={2.5} />}
            </button>
            <button
              className="neo-btn p-2 bg-brand-yellow"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-3">
            <Link href="/" onClick={() => setMobileOpen(false)} className="neo-badge bg-brand-pink text-foreground w-fit">
              Dashboard
            </Link>
            <Link href="/stake" onClick={() => setMobileOpen(false)} className="neo-badge bg-brand-lime text-foreground w-fit">
              Stake & Govern
            </Link>
            <a href="https://polkadot.network" target="_blank" rel="noopener noreferrer" className="neo-badge bg-brand-cyan text-foreground w-fit">
              Polkadot <ExternalLink className="w-3 h-3 inline ml-1" />
            </a>
            {isConnected && address ? (
              <div className="flex items-center gap-2">
                <span className="neo-badge bg-brand-lime text-foreground">{truncateAddress(address)}</span>
                <button
                  onClick={() => { disconnect(); setMobileOpen(false); }}
                  className="neo-btn px-3 py-1 text-[10px] bg-brand-red text-white"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => { handleConnect(); setMobileOpen(false); }}
                disabled={isConnecting}
                className="neo-btn px-4 py-2 text-sm bg-brand-yellow w-fit"
              >
                <span className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" strokeWidth={2.5} />
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Click-away for wallet dropdown */}
      {walletDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setWalletDropdown(false)} />
      )}
    </nav>
  );
}
