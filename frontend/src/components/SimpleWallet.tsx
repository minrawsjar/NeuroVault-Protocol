"use client";

import { useMemo } from 'react';
import { useEffect, useState } from 'react';
import { Wallet, Copy, LogOut, AlertCircle } from 'lucide-react';
import { formatUnits } from 'viem';
import { useAccount, useBalance, useConnect, useDisconnect } from 'wagmi';

// Check for wallet conflicts
function checkWalletConflicts(): string | null {
  if (typeof window === 'undefined') return null;
  
  const ethereum = (window as any).ethereum;
  if (!ethereum) return null;
  
  // Check for multiple wallet providers
  const providers = ethereum.providers || [ethereum];
  const isPhantom = ethereum.isPhantom || providers.some((p: any) => p?.isPhantom);
  const isMetaMask = ethereum.isMetaMask || providers.some((p: any) => p?.isMetaMask);
  
  if (isPhantom && isMetaMask) {
    return "Phantom and MetaMask detected. Please disable one to avoid conflicts.";
  }
  
  return null;
}

export function useWallet() {
  const [walletError, setWalletError] = useState<string | null>(null);
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balanceData } = useBalance({
    address,
    query: {
      enabled: !!address,
    },
  });

  // Check for conflicts on mount
  useEffect(() => {
    const conflict = checkWalletConflicts();
    if (conflict) {
      setWalletError(conflict);
    }
  }, []);

  const balance = useMemo(() => {
    if (!balanceData) {
      return null;
    }

    const value = Number(formatUnits(balanceData.value, balanceData.decimals));
    return `${value.toFixed(4)} ${balanceData.symbol}`;
  }, [balanceData]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
    }
  };

  const connectWallet = () => {
    setWalletError(null);
    
    if (connectors.length === 0) {
      setWalletError("No wallet connectors available. Please install MetaMask or another wallet.");
      return;
    }

    // Prefer MetaMask over other injected wallets
    const metamaskConnector = connectors.find((c) => 
      c.id === 'metaMask' || c.name.toLowerCase().includes('metamask')
    );
    const injectedConnector = connectors.find((c) => c.id === 'injected');
    
    try {
      connect({ connector: metamaskConnector ?? injectedConnector ?? connectors[0] });
    } catch (err: any) {
      console.error("Connection error:", err);
      setWalletError(err.message || "Failed to connect. Try refreshing the page.");
    }
  };

  return {
    address,
    isConnected,
    chain,
    balance,
    isConnecting: isPending,
    walletError,
    formatAddress,
    copyAddress,
    connect: connectWallet,
    disconnect,
  };
}

export function WalletConnectButton() {
  const [mounted, setMounted] = useState(false);
  const { 
    isConnected, 
    address, 
    balance, 
    disconnect, 
    formatAddress, 
    copyAddress, 
    connect, 
    isConnecting,
    walletError 
  } = useWallet();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        disabled
        className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-sm font-medium opacity-70"
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </button>
    );
  }

  if (walletError && !isConnected) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-amber-400 text-xs max-w-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{walletError}</span>
        </div>
        <button
          onClick={connect}
          disabled={isConnecting}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition-all disabled:opacity-50"
        >
          <Wallet className="w-4 h-4" />
          {isConnecting ? 'Connecting...' : 'Try Connect'}
        </button>
      </div>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-full">
          <div className="text-right">
            <div className="text-sm font-medium text-white">{formatAddress(address)}</div>
            <div className="text-xs text-gray-400">
              {balance ?? '0.0000 ETH'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={copyAddress}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Copy address"
          >
            <Copy className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => disconnect()}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Disconnect"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={isConnecting}
      className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition-all disabled:opacity-50"
    >
      <Wallet className="w-4 h-4" />
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}

export function NetworkSwitcher() {
  const { chain } = useWallet();

  return (
    <div className="flex items-center gap-2">
      <button
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm bg-white text-black"
        title={chain?.name ?? 'Network'}
      >
        {chain?.id === 1 ? '🔷' : chain?.id === 420420417 ? '🟣' : '⛓️'}
      </button>
    </div>
  );
}
