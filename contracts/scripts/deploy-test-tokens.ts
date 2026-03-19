import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("Deploying Test Tokens");
  console.log("=".repeat(60));
  console.log(`Deployer: ${deployer.address}`);
  console.log("");

  // Deploy PAS token (18 decimals)
  console.log("Deploying PAS token...");
  const PAS = await ethers.getContractFactory("MockERC20");
  const initialPasSupply = ethers.parseEther("10000000"); // 10 million PAS
  const pas = await PAS.deploy("Paseo Token", "PAS", 18, initialPasSupply);
  await pas.waitForDeployment();
  const pasAddress = await pas.getAddress();
  console.log(`✅ PAS deployed at: ${pasAddress}`);
  console.log(`   Initial supply: ${ethers.formatEther(initialPasSupply)} PAS`);
  console.log("");

  // Deploy USDC token (6 decimals)
  console.log("Deploying USDC token...");
  const USDC = await ethers.getContractFactory("MockERC20");
  const initialUsdcSupply = ethers.parseUnits("10000000", 6); // 10 million USDC
  const usdc = await USDC.deploy("USD Coin", "USDC", 6, initialUsdcSupply);
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log(`✅ USDC deployed at: ${usdcAddress}`);
  console.log(`   Initial supply: ${ethers.formatUnits(initialUsdcSupply, 6)} USDC`);
  console.log("");

  console.log("=".repeat(60));
  console.log("Summary:");
  console.log(`PAS:  ${pasAddress}`);
  console.log(`USDC: ${usdcAddress}`);
  console.log("");
  console.log("Next steps:");
  console.log("1. Update contracts/deployments/paseo.json with new token addresses");
  console.log("2. Update frontend/src/lib/contracts.ts with new token addresses");
  console.log("3. Add tokens to MetaMask:");
  console.log(`   - PAS:  ${pasAddress}`);
  console.log(`   - USDC: ${usdcAddress}`);
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
