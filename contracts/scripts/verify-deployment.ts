import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("=".repeat(60));
  console.log("Verifying NeuroVault Deployment");
  console.log("=".repeat(60));

  const network = await ethers.provider.getNetwork();
  console.log(`Network:    ${network.name}`);
  console.log(`Chain ID:   ${network.chainId}`);
  console.log("");

  // Load deployment file
  const deploymentPath = path.join(__dirname, "../deployments/paseo.json");
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ No deployment file found at:", deploymentPath);
    console.log("Run: npm run deploy:paseo first");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
  
  console.log("Checking deployed contracts...");
  console.log("");

  // Check NeuroVault contract
  const vaultAddress = deployment.contracts.NeuroVault;
  console.log(`NeuroVault: ${vaultAddress}`);
  const vaultCode = await ethers.provider.getCode(vaultAddress);
  if (vaultCode === "0x") {
    console.log("  ❌ No contract code found - NOT DEPLOYED");
  } else {
    console.log(`  ✅ Contract exists (${vaultCode.length} bytes)`);
    
    // Try to call a view function
    try {
      const vault = await ethers.getContractAt("NeuroVault", vaultAddress);
      const state = await vault.getTreasuryState();
      console.log(`  ✅ getTreasuryState() works`);
      console.log(`     Total Value: ${ethers.formatEther(state.totalValue)}`);
      console.log(`     PAS Balance: ${ethers.formatEther(state.dotBalance)}`);
      console.log(`     USDC Balance: ${ethers.formatUnits(state.usdcBalance, 6)}`);
    } catch (err: any) {
      console.log(`  ⚠️  getTreasuryState() failed: ${err.message}`);
    }
  }
  console.log("");

  // Check PAS token
  const pasAddress = deployment.tokens.PAS;
  console.log(`PAS Token: ${pasAddress}`);
  const pasCode = await ethers.provider.getCode(pasAddress);
  if (pasCode === "0x") {
    console.log("  ❌ No contract code found - NOT DEPLOYED");
  } else {
    console.log(`  ✅ Contract exists (${pasCode.length} bytes)`);
    
    // Try to get token info
    try {
      const pas = await ethers.getContractAt("IERC20", pasAddress);
      const [deployer] = await ethers.getSigners();
      const balance = await pas.balanceOf(deployer.address);
      console.log(`  ✅ balanceOf() works`);
      console.log(`     Deployer balance: ${ethers.formatEther(balance)} PAS`);
    } catch (err: any) {
      console.log(`  ⚠️  balanceOf() failed: ${err.message}`);
    }
  }
  console.log("");

  // Check USDC token
  const usdcAddress = deployment.tokens.USDC;
  console.log(`USDC Token: ${usdcAddress}`);
  const usdcCode = await ethers.provider.getCode(usdcAddress);
  if (usdcCode === "0x") {
    console.log("  ❌ No contract code found - NOT DEPLOYED");
  } else {
    console.log(`  ✅ Contract exists (${usdcCode.length} bytes)`);
  }
  console.log("");

  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
