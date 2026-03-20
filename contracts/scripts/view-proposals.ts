import { ethers } from "hardhat";

async function main() {
  const vaultAddress = "0x195FAc0dc3AFaD9AA7dE057B786b8613742d3D8e";
  const NeuroVault = await ethers.getContractFactory("NeuroVault");
  const vault = NeuroVault.attach(vaultAddress);

  console.log("📋 NeuroVault Proposals");
  console.log("======================");

  const proposalCount = await vault.proposalCount();
  console.log(`Total proposals: ${proposalCount}`);

  const NeuroVaultWithTypes = await ethers.getContractFactory("NeuroVault");
  const vaultWithTypes = NeuroVaultWithTypes.attach(vaultAddress);
  
  const recentProposals = await vaultWithTypes.getRecentProposals(5);
  
  console.log("\nRecent proposals:");
  recentProposals.forEach((p: any, i: number) => {
    const statusNames = ["Pending", "Approved", "Rejected", "Executed", "Expired"];
    const actionNames = ["Swap", "Stake", "Transfer", "Rebalance", "None"];
    
    console.log(`\n#${p.id}: ${p.description || 'No description'}`);
    console.log(`  Action: ${actionNames[p.actionType] || 'Unknown'}`);
    console.log(`  Amount: ${p.amount ? ethers.formatEther(p.amount) : '0'} tokens`);
    console.log(`  Status: ${statusNames[p.status] || 'Unknown'} (${p.status})`);
    console.log(`  Votes: ${p.votesFor || 0} for / ${p.votesAgainst || 0} against`);
    console.log(`  Confidence: ${p.confidence || 0}%`);
    console.log(`  Created: ${p.createdAt ? new Date(Number(p.createdAt) * 1000).toLocaleString() : 'Unknown'}`);
    console.log(`  Deadline: ${p.votingDeadline ? new Date(Number(p.votingDeadline) * 1000).toLocaleString() : 'Unknown'}`);
    console.log(`  Proposer: ${p.proposer || 'Unknown'}`);
    console.log(`  IPFS: ${p.ipfsHash || 'No IPFS hash'}`);
    
    if (Number(p.votingDeadline) < Date.now() / 1000) {
      console.log(`  ⚠️  Voting deadline passed!`);
    }
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
