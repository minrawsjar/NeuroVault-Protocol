"use client";

import { useState } from "react";
import { useWallet } from "@/components/SimpleWallet";
import { useNeuroVaultContract } from "@/hooks/useNeuroVault";
import { Loader2, AlertCircle, CheckCircle2, Coins, ArrowRight } from "lucide-react";

export default function AdminPage() {
  const { address, isConnected } = useWallet();
  const { stake, getTokenBalances, isLoading, error } = useNeuroVaultContract();
  
  const [pasAmount, setPasAmount] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [balances, setBalances] = useState<{ pas: string; usdc: string } | null>(null);

  const handleAddPas = async () => {
    if (!pasAmount || !isConnected || !address) return;
    
    const result = await stake(pasAmount);
    if (result) {
      setSuccess(`Successfully added ${pasAmount} PAS to vault!`);
      setPasAmount("");
      
      // Refresh balances
      const newBalances = await getTokenBalances(address);
      if (newBalances) setBalances(newBalances);
      
      setTimeout(() => setSuccess(null), 5000);
    }
  };

  const loadBalances = async () => {
    if (!address) return;
    const bal = await getTokenBalances(address);
    if (bal) setBalances(bal);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Add Tokens to Vault</h1>
        <p className="text-zinc-400">Deposit PAS tokens into the NeuroVault treasury</p>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 mb-6">
          <p className="text-amber-400 text-sm">Please connect your wallet to continue</p>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Success Banner */}
      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 mb-6 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <p className="text-sm text-emerald-400">{success}</p>
        </div>
      )}

      {/* Your Balances */}
      {isConnected && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Your Wallet Balances</h2>
            <button
              onClick={loadBalances}
              disabled={isLoading}
              className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
          
          {balances ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
                <p className="text-xs text-zinc-400 mb-1">PAS Balance</p>
                <p className="text-xl font-semibold text-white">{balances.pas}</p>
              </div>
              <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-4">
                <p className="text-xs text-zinc-400 mb-1">USDC Balance</p>
                <p className="text-xl font-semibold text-white">{balances.usdc}</p>
              </div>
            </div>
          ) : (
            <button
              onClick={loadBalances}
              disabled={isLoading}
              className="w-full py-3 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Load Balances"}
            </button>
          )}
        </div>
      )}

      {/* Add DOT Form */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Coins className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Add PAS to Vault</h2>
            <p className="text-sm text-zinc-400">Stake PAS tokens to gain voting power</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-zinc-300 block mb-2">
              Amount (PAS)
            </label>
            <input
              type="number"
              value={pasAmount}
              onChange={(e) => setPasAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 text-white px-4 py-3 text-lg focus:outline-none focus:border-blue-500"
              disabled={!isConnected || isLoading}
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {["10", "50", "100", "500"].map((amount) => (
              <button
                key={amount}
                onClick={() => setPasAmount(amount)}
                disabled={!isConnected || isLoading}
                className="rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 py-2 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {amount}
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
            <p className="text-sm text-zinc-300">
              <strong className="text-blue-400">Note:</strong> This will execute 2 transactions:
            </p>
            <ol className="text-sm text-zinc-400 mt-2 space-y-1 ml-4 list-decimal">
              <li>Approve NeuroVault contract to spend your PAS</li>
              <li>Stake PAS into the vault</li>
            </ol>
          </div>

          <button
            onClick={handleAddPas}
            disabled={!isConnected || !pasAmount || isLoading}
            className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold py-3 transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Add {pasAmount || "0"} PAS to Vault
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">How it Works</h3>
        <div className="space-y-3 text-sm text-zinc-400">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-semibold text-blue-400">1</span>
            </div>
            <div>
              <p className="text-white font-medium mb-1">Approve Token Spending</p>
              <p>Grant the NeuroVault contract permission to transfer your PAS tokens</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-semibold text-blue-400">2</span>
            </div>
            <div>
              <p className="text-white font-medium mb-1">Stake Tokens</p>
              <p>Your PAS is transferred to the vault and you receive voting power</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-semibold text-blue-400">3</span>
            </div>
            <div>
              <p className="text-white font-medium mb-1">Earn & Govern</p>
              <p>Earn yield from vault strategies and vote on AI proposals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Addresses */}
      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Contract Addresses (Paseo)</p>
        <div className="space-y-1 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-zinc-500">NeuroVault:</span>
            <span className="text-zinc-300">0xC6D0...54Ed</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">PAS Token:</span>
            <span className="text-zinc-300">0x8caC...fEFE</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">USDC Token:</span>
            <span className="text-zinc-300">0xc394...a388</span>
          </div>
        </div>
      </div>
    </div>
  );
}
