import { ethers } from "hardhat";

async function main() {
  const vaultAddress = "0x195FAc0dc3AFaD9AA7dE057B786b8613742d3D8e";
  const NeuroVault = await ethers.getContractFactory("NeuroVault");
  const vault = NeuroVault.attach(vaultAddress);

  console.log("🔍 Checking specific proposals");
  console.log("==========================");

  // Check proposal #3 (the one from the logs)
  try {
    const proposal = await vault.getProposal(3);
    console.log("\nProposal #3:");
    console.log(proposal);
  } catch (error) {
    console.log("Error getting proposal #3:", error.message);
  }

  // Check proposal #1
  try {
    const proposal = await vault.getProposal(1);
    console.log("\nProposal #1:");
    console.log(proposal);
  } catch (error) {
    console.log("Error getting proposal #1:", error.message);
  }

  // Check contract functions
  console.log("\nContract functions:");
  const NeuroVaultWithTypes = await ethers.getContractFactory("NeuroVault");
  const vaultWithTypes = NeuroVaultWithTypes.attach(vaultAddress);
  
  console.log("Available functions:", Object.keys(vaultWithTypes.functions).filter(f => f.includes('proposal')));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
