"use client";

import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { WagmiProvider } from 'wagmi'
import { mainnet, polygon, arbitrum, optimism, type Chain } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'

// Polkadot Hub TestNet (Paseo) chain definition
const polkadotHubTestNet: Chain = {
  id: 420420417,
  name: 'Polkadot Hub TestNet',
  nativeCurrency: { name: 'PAS', symbol: 'PAS', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://eth-rpc-testnet.polkadot.io/'] },
  },
  blockExplorers: {
    default: { name: 'Subscan', url: 'https://paseo.subscan.io' },
  },
  testnet: true,
};

// Web3Modal project ID
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id'

const metadata = {
  name: 'NeuroVault',
  description: 'AI-Powered Treasury Protocol',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://neurovault.eth',
  icons: ['https://neurovault.eth/favicon.ico']
}

// Create Wagmi config — Polkadot Hub TestNet first so it's the default
const chains = [polkadotHubTestNet, mainnet, polygon, arbitrum, optimism] as const
const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true
})

// Create QueryClient
const queryClient = new QueryClient()

export function Web3ModalProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
