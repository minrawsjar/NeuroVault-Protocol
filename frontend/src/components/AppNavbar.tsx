"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bot, Zap } from "lucide-react";
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
    <header className="sticky top-0 z-50 border-b border-zinc-800/90 bg-zinc-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-zinc-700 bg-zinc-900 text-zinc-100 hover:border-zinc-500"
            >
              <Home className="w-3.5 h-3.5" strokeWidth={2.5} /> Back Home
            </Link>
          </div>

          <nav className="flex items-center gap-2 flex-wrap">
            {appLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                    active
                      ? "bg-white text-zinc-950 border-white"
                      : "bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-500"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/app#bot-console"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500"
            >
              <Bot className="w-3.5 h-3.5" strokeWidth={2.5} /> Bot Console
            </Link>
          </nav>

          <div className="self-start lg:self-auto flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[10px] font-semibold text-zinc-300">
              <Zap className="w-3.5 h-3.5 text-blue-400" /> Live
            </span>
            <WalletConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
