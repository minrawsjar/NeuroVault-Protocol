"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACTS, NEUROVAULT_ABI, ERC20_ABI } from "@/lib/contracts";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (accounts: string[]) => void) => void;
      removeListener: (event: string, handler: (accounts: string[]) => void) => void;
    };
  }
}

// Types
export interface TreasuryState {
  totalValue: string;
  dotBalance: string;
  usdcBalance: string;
  activeProposals: number;
  apy: number;
}

export interface Proposal {
  id: number;
  ipfsHash: string;
  actionType: number;
  description: string;
  amount: string;
  token: string;
  targetToken: string;
  confidence: number;
  status: number;
  votesFor: string;
  votesAgainst: string;
  snapshotTotalStaked: string;
  createdAt: number;
  votingDeadline: number;
  outcome: string;
  proposer: string;
}

export interface StakerInfo {
  staked: string;
  votingPower: number;
}

// Contract addresses
const ADDRESSES = CONTRACTS.paseo;

// Helper to format amounts
const formatAmount = (amount: bigint, decimals: number = 18): string => {
  return ethers.formatUnits(amount, decimals);
};

const parseAmount = (amount: string, decimals: number = 18): bigint => {
  return ethers.parseUnits(amount, decimals);
};

// Hook for interacting with NeuroVault contract
export function useNeuroVaultContract() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [pasToken, setPasToken] = useState<ethers.Contract | null>(null);
  const [usdcToken, setUsdcToken] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Switch to the correct network
  const switchNetwork = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) return false;
    
    const chainIdHex = `0x${ADDRESSES.chainId.toString(16)}`;
    const networkParams = {
      chainId: chainIdHex,
      chainName: "Polkadot Hub TestNet (Paseo)",
      nativeCurrency: { name: "PAS", symbol: "PAS", decimals: 18 },
      rpcUrls: ["https://eth-rpc-testnet.polkadot.io/"],
      blockExplorerUrls: ["https://paseo.subscan.io/"],
    };
    
    try {
      // Try adding the chain first (this also switches to it)
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [networkParams],
      });
      window.location.reload();
      return true;
    } catch (addError: any) {
      console.error("Failed to add/switch network:", addError);
      // If add fails, try switch
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainIdHex }],
        });
        window.location.reload();
        return true;
      } catch (switchError) {
        console.error("Failed to switch network:", switchError);
        alert(`Please manually add this network to MetaMask:\n\nNetwork Name: Polkadot Hub TestNet\nRPC URL: https://eth-rpc-testnet.polkadot.io/\nChain ID: 420420417\nSymbol: PAS`);
        return false;
      }
    }
  }, []);

  // Initialize provider and contracts
  useEffect(() => {
    const init = async () => {
      if (typeof window === "undefined" || !window.ethereum) return;

      try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const network = await browserProvider.getNetwork();
        
        // Check if connected to Paseo testnet
        if (Number(network.chainId) !== ADDRESSES.chainId) {
          setNetworkError(
            `Wrong network! Please switch to Paseo testnet (chainId: ${ADDRESSES.chainId}). Currently on chainId: ${network.chainId}`
          );
          return;
        }
        
        setNetworkError(null);
        setError(null);
        const newSigner = await browserProvider.getSigner();
        
        const neuroVaultContract = new ethers.Contract(
          ADDRESSES.NeuroVault,
          NEUROVAULT_ABI,
          newSigner
        );

        const pasContract = new ethers.Contract(
          ADDRESSES.PAS,
          ERC20_ABI,
          newSigner
        );

        const usdcContract = new ethers.Contract(
          ADDRESSES.USDC,
          ERC20_ABI,
          newSigner
        );

        setProvider(browserProvider);
        setSigner(newSigner);
        setContract(neuroVaultContract);
        setPasToken(pasContract);
        setUsdcToken(usdcContract);
      } catch (err) {
        console.error("Failed to initialize contracts:", err);
        setError("Failed to initialize contracts");
      }
    };

    init();
    
    // Listen for network changes
    if (typeof window !== "undefined" && window.ethereum) {
      const handleChainChanged = () => window.location.reload();
      window.ethereum.on("chainChanged", handleChainChanged);
      return () => {
        window.ethereum?.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, []);

  // Get treasury state
  const getTreasuryState = useCallback(async (): Promise<TreasuryState | null> => {
    if (!contract) {
      if (networkError) setError(networkError);
      return null;
    }
    
    try {
      const state = await contract.getTreasuryState();
      return {
        totalValue: formatAmount(state.totalValue),
        dotBalance: formatAmount(state.dotBalance), // PAS balance
        usdcBalance: formatAmount(state.usdcBalance, 6),
        activeProposals: Number(state.activeProposals),
        apy: Number(state.apy) / 100, // Convert basis points to percentage
      };
    } catch (err) {
      console.error("Error fetching treasury state:", err);
      return null;
    }
  }, [contract]);

  // Get proposal details
  const getProposal = useCallback(async (id: number): Promise<Proposal | null> => {
    if (!contract) return null;
    
    try {
      const proposal = await contract.getProposal(id);
      return {
        id: Number(proposal.id),
        ipfsHash: proposal.ipfsHash,
        actionType: Number(proposal.actionType),
        description: proposal.description,
        amount: formatAmount(proposal.amount),
        token: proposal.token,
        targetToken: proposal.targetToken,
        confidence: Number(proposal.confidence),
        status: Number(proposal.status),
        votesFor: formatAmount(proposal.votesFor),
        votesAgainst: formatAmount(proposal.votesAgainst),
        snapshotTotalStaked: formatAmount(proposal.snapshotTotalStaked),
        createdAt: Number(proposal.createdAt) * 1000, // Convert to milliseconds
        votingDeadline: Number(proposal.votingDeadline) * 1000,
        outcome: proposal.outcome,
        proposer: proposal.proposer,
      };
    } catch (err) {
      console.error("Error fetching proposal:", err);
      return null;
    }
  }, [contract]);

  // Get recent proposals
  const getRecentProposals = useCallback(async (count: number): Promise<Proposal[]> => {
    if (!contract) {
      if (networkError) setError(networkError);
      return [];
    }
    
    try {
      const views = await contract.getRecentProposals(count);
      const proposals: Proposal[] = [];
      
      for (const view of views) {
        const fullProposal = await getProposal(Number(view.id));
        if (fullProposal) {
          proposals.push(fullProposal);
        }
      }
      
      return proposals;
    } catch (err) {
      console.error("Error fetching recent proposals:", err);
      return [];
    }
  }, [contract, getProposal]);

  // Get staker info
  const getStakerInfo = useCallback(async (address: string): Promise<StakerInfo | null> => {
    if (!contract) {
      if (networkError) setError(networkError);
      return null;
    }
    
    try {
      const info = await contract.getStakerInfo(address);
      return {
        staked: formatAmount(info.staked),
        votingPower: Number(info.votingPower) / 100, // Basis points to percentage
      };
    } catch (err) {
      console.error("Error fetching staker info:", err);
      return null;
    }
  }, [contract]);

  // Stake PAS tokens
  const stake = useCallback(async (amount: string): Promise<boolean> => {
    if (!contract || !pasToken) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const parsedAmount = parseAmount(amount);
      
      // First approve the contract to spend tokens
      const approveTx = await pasToken.approve(ADDRESSES.NeuroVault, parsedAmount);
      await approveTx.wait();
      
      // Then stake
      const stakeTx = await contract.stake(parsedAmount);
      await stakeTx.wait();
      
      return true;
    } catch (err: any) {
      console.error("Error staking:", err);
      setError(err.message || "Failed to stake");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contract, pasToken]);

  // Unstake PAS tokens
  const unstake = useCallback(async (amount: string): Promise<boolean> => {
    if (!contract) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const parsedAmount = parseAmount(amount);
      const tx = await contract.unstake(parsedAmount);
      await tx.wait();
      return true;
    } catch (err: any) {
      console.error("Error unstaking:", err);
      setError(err.message || "Failed to unstake");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contract]);

  // Vote on proposal
  const vote = useCallback(async (proposalId: number, support: boolean): Promise<boolean> => {
    if (!contract) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tx = await contract.vote(proposalId, support);
      await tx.wait();
      return true;
    } catch (err: any) {
      console.error("Error voting:", err);
      setError(err.message || "Failed to vote");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contract]);

  // Finalize proposal
  const finalizeProposal = useCallback(async (proposalId: number): Promise<boolean> => {
    if (!contract) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tx = await contract.finalizeProposal(proposalId);
      await tx.wait();
      return true;
    } catch (err: any) {
      console.error("Error finalizing proposal:", err);
      setError(err.message || "Failed to finalize proposal");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contract]);

  // Get token balances
  const getTokenBalances = useCallback(async (address: string): Promise<{ pas: string; usdc: string } | null> => {
    console.log("getTokenBalances called with address:", address);
    console.log("pasToken:", pasToken ? "initialized" : "null");
    console.log("usdcToken:", usdcToken ? "initialized" : "null");
    
    if (!pasToken || !usdcToken) {
      console.warn("Tokens not initialized");
      if (networkError) setError(networkError);
      return null;
    }
    
    try {
      console.log("Fetching balances for:", address);
      const [pasBalance, usdcBalance] = await Promise.all([
        pasToken.balanceOf(address),
        usdcToken.balanceOf(address),
      ]);
      
      console.log("Raw balances:", { pas: pasBalance.toString(), usdc: usdcBalance.toString() });
      
      const result = {
        pas: formatAmount(pasBalance),
        usdc: formatAmount(usdcBalance, 6),
      };
      
      console.log("Formatted balances:", result);
      return result;
    } catch (err) {
      console.error("Error fetching token balances:", err);
      return null;
    }
  }, [pasToken, usdcToken, networkError]);

  return {
    provider,
    signer,
    contract,
    isLoading,
    error,
    networkError,
    switchNetwork,
    getTreasuryState,
    getProposal,
    getRecentProposals,
    getStakerInfo,
    stake,
    unstake,
    vote,
    finalizeProposal,
    getTokenBalances,
  };
}
