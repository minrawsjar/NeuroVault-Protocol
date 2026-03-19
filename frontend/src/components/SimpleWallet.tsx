"use client";

import { useMemo } from 'react';
import { useEffect, useState } from 'react';
import { Wallet, Copy, LogOut } from 'lucide-react';
import { formatUnits } from 'viem';
import { useAccount, useBalance, useConnect, useDisconnect } from 'wagmi';

export function useWallet() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balanceData } = useBalance({
    address,
    query: {
      enabled: !!address,
    },
  });

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
    if (connectors.length === 0) {
      return;
    }

    const injectedConnector = connectors.find((connector) => connector.id === 'injected');
    connect({ connector: injectedConnector ?? connectors[0] });
  };

  return {
    address,
    isConnected,
    chain,
    balance,
    isConnecting: isPending,
    formatAddress,
    copyAddress,
    connect: connectWallet,
    disconnect,
  };
}

export function WalletConnectButton() {
  const [mounted, setMounted] = useState(false);
  const { isConnected, address, balance, disconnect, formatAddress, copyAddress, connect, isConnecting } = useWallet();

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
        {chain?.id === 1 ? '🔷' : '⛓️'}
      </button>
    </div>
  );
}
