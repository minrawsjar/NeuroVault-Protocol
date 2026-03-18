import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NeuroVault — AI Treasury Protocol",
  description:
    "An autonomous AI agent manages a shared on-chain treasury. Every decision is cryptographically committed on-chain — reasoning pinned to IPFS, hash stored in the contract.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t-3 border-border bg-white p-4 text-center" style={{ borderTopWidth: "3px" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">
            NeuroVault Protocol · Polkadot Hub · Built for Polkadot Solidity Hackathon & Synthesis 2025
          </p>
        </footer>
      </body>
    </html>
  );
}
