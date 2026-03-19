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

// Static read-only provider — always points to Polkadot Hub TestNet RPC
const RPC_URL = "https://eth-rpc-testnet.polkadot.io/";
const readProvider = new ethers.JsonRpcProvider(RPC_URL, {
  name: "Polkadot Hub TestNet",
  chainId: ADDRESSES.chainId,
});

// Read-only contract instances (no signer needed)
const readVault = new ethers.Contract(ADDRESSES.NeuroVault, NEUROVAULT_ABI, readProvider);
const readPas = new ethers.Contract(ADDRESSES.PAS, ERC20_ABI, readProvider);
const readUsdc = new ethers.Contract(ADDRESSES.USDC, ERC20_ABI, readProvider);

// Hook for interacting with NeuroVault contract
export function useNeuroVaultContract() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [writeContract, setWriteContract] = useState<ethers.Contract | null>(null);
  const [writePasToken, setWritePasToken] = useState<ethers.Contract | null>(null);
  const [writeUsdcToken, setWriteUsdcToken] = useState<ethers.Contract | null>(null);
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
        setWriteContract(neuroVaultContract);
        setWritePasToken(pasContract);
        setWriteUsdcToken(usdcContract);
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

  // Get treasury state (uses static read provider — no MetaMask needed)
  const getTreasuryState = useCallback(async (): Promise<TreasuryState | null> => {
    try {
      const state = await readVault.getTreasuryState();
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
  }, []);

  // Get proposal details (uses static read provider)
  const getProposal = useCallback(async (id: number): Promise<Proposal | null> => {
    try {
      const proposal = await readVault.getProposal(id);
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
  }, []);

  // Get recent proposals
  const getRecentProposals = useCallback(async (count: number): Promise<Proposal[]> => {
    try {
      const views = await readVault.getRecentProposals(count);
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
  }, [getProposal]);

  // Get staker info (uses static read provider)
  const getStakerInfo = useCallback(async (address: string): Promise<StakerInfo | null> => {
    try {
      const info = await readVault.getStakerInfo(address);
      return {
        staked: formatAmount(info.staked),
        votingPower: Number(info.votingPower) / 100, // Basis points to percentage
      };
    } catch (err) {
      console.error("Error fetching staker info:", err);
      return null;
    }
  }, []);

  // Stake PAS tokens (write — needs signer)
  const stake = useCallback(async (amount: string): Promise<boolean> => {
    if (!writeContract || !writePasToken || !provider) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const parsedAmount = parseAmount(amount);
      
      // Get current gas price from network
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits("1", "gwei");
      
      console.log("Using gas price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");
      
      // First approve the contract to spend tokens with explicit gas settings
      console.log("Approving token spending...");
      const approveTx = await writePasToken.approve(ADDRESSES.NeuroVault, parsedAmount, {
        gasPrice: gasPrice,
        gasLimit: 100000, // Explicit gas limit for approve
      });
      console.log("Approve tx sent:", approveTx.hash);
      const approveReceipt = await approveTx.wait();
      console.log("Approve tx confirmed:", approveReceipt?.hash);
      
      // Then stake with explicit gas settings
      console.log("Staking tokens...");
      const stakeTx = await writeContract.stake(parsedAmount, {
        gasPrice: gasPrice,
        gasLimit: 200000, // Explicit gas limit for stake
      });
      console.log("Stake tx sent:", stakeTx.hash);
      const stakeReceipt = await stakeTx.wait();
      console.log("Stake tx confirmed:", stakeReceipt?.hash);
      
      return true;
    } catch (err: any) {
      console.error("Error staking:", err);
      setError(err.message || "Failed to stake");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [writeContract, writePasToken, provider]);

  // Deposit USDC tokens (write — needs signer)
  const depositUsdc = useCallback(async (amount: string): Promise<boolean> => {
    if (!writeContract || !writeUsdcToken || !provider) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const parsedAmount = parseAmount(amount, 6); // USDC has 6 decimals
      
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits("1", "gwei");
      
      // Approve USDC spending
      const approveTx = await writeUsdcToken.approve(ADDRESSES.NeuroVault, parsedAmount, {
        gasPrice,
        gasLimit: 100000,
      });
      await approveTx.wait();
      
      // Deposit USDC into vault
      const depositTx = await writeContract.depositUsdc(parsedAmount, {
        gasPrice,
        gasLimit: 200000,
      });
      await depositTx.wait();
      
      return true;
    } catch (err: any) {
      console.error("Error depositing USDC:", err);
      setError(err.message || "Failed to deposit USDC");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [writeContract, writeUsdcToken, provider]);

  // Unstake PAS tokens (write — needs signer)
  const unstake = useCallback(async (amount: string): Promise<boolean> => {
    if (!writeContract) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const parsedAmount = parseAmount(amount);
      const tx = await writeContract.unstake(parsedAmount);
      await tx.wait();
      return true;
    } catch (err: any) {
      console.error("Error unstaking:", err);
      setError(err.message || "Failed to unstake");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [writeContract]);

  // Vote on proposal (write — needs signer)
  const vote = useCallback(async (proposalId: number, support: boolean): Promise<boolean> => {
    if (!writeContract) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tx = await writeContract.vote(proposalId, support);
      await tx.wait();
      return true;
    } catch (err: any) {
      console.error("Error voting:", err);
      setError(err.message || "Failed to vote");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [writeContract]);

  // Finalize proposal (write — needs signer)
  const finalizeProposal = useCallback(async (proposalId: number): Promise<boolean> => {
    if (!writeContract) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tx = await writeContract.finalizeProposal(proposalId);
      await tx.wait();
      return true;
    } catch (err: any) {
      console.error("Error finalizing proposal:", err);
      setError(err.message || "Failed to finalize proposal");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [writeContract]);

  // Get token balances (uses static read provider — no MetaMask needed)
  const getTokenBalances = useCallback(async (address: string): Promise<{ pas: string; usdc: string } | null> => {
    try {
      const [pasBalance, usdcBalance] = await Promise.all([
        readPas.balanceOf(address),
        readUsdc.balanceOf(address),
      ]);
      
      return {
        pas: formatAmount(pasBalance),
        usdc: formatAmount(usdcBalance, 6),
      };
    } catch (err) {
      console.error("Error fetching token balances:", err);
      return null;
    }
  }, []);

  return {
    provider,
    signer,
    contract: writeContract,
    isLoading,
    error,
    networkError,
    switchNetwork,
    getTreasuryState,
    getProposal,
    getRecentProposals,
    getStakerInfo,
    stake,
    depositUsdc,
    unstake,
    vote,
    finalizeProposal,
    getTokenBalances,
  };
}
