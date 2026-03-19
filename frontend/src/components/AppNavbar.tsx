"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Landmark, Bot, ShieldCheck } from "lucide-react";
import { WalletConnectButton } from "@/components/SimpleWallet";

const appLinks = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/stake", label: "Stake" },
  { href: "/app/treasury", label: "Treasury" },
  { href: "/app/vote", label: "Governance" },
];

export default function AppNavbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-black/90 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-white/20 hover:border-white/40"
            >
              <Home className="w-3.5 h-3.5" strokeWidth={2.5} /> Back Home
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/50">
              <Landmark className="w-3.5 h-3.5" /> Treasury Status: $284.7K
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/50">
              <ShieldCheck className="w-3.5 h-3.5" /> APY 12.4%
            </div>
          </div>

          <nav className="flex items-center gap-2 flex-wrap">
            {appLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border transition-colors ${
                    active
                      ? "bg-white text-black border-white"
                      : "bg-transparent text-white/80 border-white/20 hover:border-white/40"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/app#bot-console"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border border-white/20 hover:border-white/40"
            >
              <Bot className="w-3.5 h-3.5" strokeWidth={2.5} /> Bot Console
            </Link>
          </nav>

          <div className="self-start lg:self-auto">
            <WalletConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
