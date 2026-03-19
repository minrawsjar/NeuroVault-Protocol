// (base) adityamane@Adityas-MacBook-Air-2 contracts % npm run deploy:testnet


// > neurovault-contracts@1.0.0 deploy:testnet
// > hardhat run scripts/deploy.ts --network paseo

// ============================================================
// NeuroVault Deployment
// ============================================================
// Deployer:   0xd5720Ed6e70a128C025D0C284874cd1e33B39688
// Network:    paseo
// Chain ID:   420420417
// Balance:    4999.99 ETH/WND

// Deployment parameters:
//   DOT token:       0x8caC5028A31bC2aF5f8A99A7555C62057eE7fEFE
//   USDC token:      0xc394f94c7B93AE269F7AABDeca736A7b7768a388
//   Hyperbridge:     0xbb26e04a71e7c12093e82b83ba310163eac186fa
//   Agent address:   0xd5720Ed6e70a128C025D0C284874cd1e33B39688
//   Bifrost dest:    0x504f4c4b41444f542d32303330

// Deploying NeuroVault...
// ✅ NeuroVault deployed at: 0x926aD18A9B3521f2BC9F102A97BD1a0056879C92

// Running post-deployment setup...
//   ✅ Goal added: "Maximize yield on DOT holdings via Bifrost vDOT li..."
//   ✅ Goal added: "Maintain minimum 20% USDC liquidity buffer for ope..."
//   ✅ Goal added: "Grow total treasury value by 15% over the next 90 ..."
//   ✅ Goal added: "Diversify across at least 2 yield strategies when ..."

// ============================================================
// Deployment complete!
// Contract address: 0x926aD18A9B3521f2BC9F102A97BD1a0056879C92
// Saved to:         /Users/adityamane/NeuroVault-Protocol/contracts/deployments/paseo.json
// ============================================================

// Next steps:
//   1. Update CONTRACT_ADDRESS in agent/.env to: 0x926aD18A9B3521f2BC9F102A97BD1a0056879C92
//   2. Update NEXT_PUBLIC_CONTRACT_ADDRESS in frontend/.env
//   3. Run: npm run seed -- to populate test data
//   4. Run: npm run verify -- to verify on block explorer

import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("NeuroVault Deployment");
  console.log("=".repeat(60));
  console.log(`Deployer:   ${deployer.address}`);
  console.log(`Network:    ${(await ethers.provider.getNetwork()).name}`);
  console.log(`Chain ID:   ${(await ethers.provider.getNetwork()).chainId}`);
  console.log(`Balance:    ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH/WND`);
  console.log("");

  // ── Read config from env ──────────────────────────────────────

  const dotTokenAddress = process.env.DOT_TOKEN_ADDRESS;
  const usdcTokenAddress = process.env.USDC_TOKEN_ADDRESS;
  const hyperbridgeAddress = process.env.HYPERBRIDGE_DISPATCH_ADDRESS;
  const agentAddress = process.env.AGENT_ADDRESS;
  const bifrostDestHex = process.env.BIFROST_DEST;
  const bifrostModuleHex = process.env.BIFROST_MODULE;

  if (!dotTokenAddress) throw new Error("DOT_TOKEN_ADDRESS not set in .env");
  if (!usdcTokenAddress) throw new Error("USDC_TOKEN_ADDRESS not set in .env");
  if (!agentAddress) throw new Error("AGENT_ADDRESS not set in .env");

  // Hyperbridge: use zero address if not set (disables cross-chain in demo mode)
  const hyperbridgeDispatch = hyperbridgeAddress || ethers.ZeroAddress;

  // Bifrost routing: encode as bytes. If not set, use empty bytes (cross-chain disabled)
  const bifrostDest = bifrostDestHex
    ? bifrostDestHex
    : ethers.toUtf8Bytes("POLKADOT-2030"); // Bifrost parachain ID
  const bifrostModule = bifrostModuleHex
    ? bifrostModuleHex
    : ethers.ZeroHash;

  console.log("Deployment parameters:");
  console.log(`  DOT token:       ${dotTokenAddress}`);
  console.log(`  USDC token:      ${usdcTokenAddress}`);
  console.log(`  Hyperbridge:     ${hyperbridgeDispatch}`);
  console.log(`  Agent address:   ${agentAddress}`);
  console.log(`  Bifrost dest:    ${ethers.hexlify(bifrostDest)}`);
  console.log("");

  // ── Deploy NeuroVault ─────────────────────────────────────────

  console.log("Deploying NeuroVault...");
  const NeuroVault = await ethers.getContractFactory("NeuroVault");
  const vault = await NeuroVault.deploy(
    dotTokenAddress,
    usdcTokenAddress,
    hyperbridgeDispatch,
    agentAddress,
    bifrostDest,
    bifrostModule,
  );

  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();

  console.log(`✅ NeuroVault deployed at: ${vaultAddress}`);
  console.log("");

  // ── Post-deployment setup ─────────────────────────────────────

  console.log("Running post-deployment setup...");

  // Add initial goals
  const goals = [
    "Maximize yield on DOT holdings via Bifrost vDOT liquid staking",
    "Maintain minimum 20% USDC liquidity buffer for operational needs",
    "Grow total treasury value by 15% over the next 90 days",
    "Diversify across at least 2 yield strategies when TVL exceeds 100k DOT",
  ];

  for (const goal of goals) {
    const tx = await vault.addGoal(goal);
    await tx.wait();
    console.log(`  ✅ Goal added: "${goal.substring(0, 50)}..."`);
  }

  // Approve vault itself as a target (already done in constructor, but confirm)
  // Add a placeholder DEX router as approved target if provided
  const dexRouter = process.env.DEX_ROUTER_ADDRESS;
  if (dexRouter) {
    const tx = await vault.setApprovedTarget(dexRouter, true);
    await tx.wait();
    console.log(`  ✅ DEX router approved: ${dexRouter}`);
  }

  // ── Save deployment artifacts ─────────────────────────────────

  const deployment = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployer: deployer.address,
    contracts: {
      NeuroVault: vaultAddress,
    },
    tokens: {
      DOT: dotTokenAddress,
      USDC: usdcTokenAddress,
    },
    config: {
      agentAddress,
      hyperbridgeDispatch,
    },
    deployedAt: new Date().toISOString(),
  };

  const artifactsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  const networkName = (await ethers.provider.getNetwork()).name;
  const filename = path.join(artifactsDir, `${networkName}.json`);
  fs.writeFileSync(filename, JSON.stringify(deployment, null, 2));

  console.log("");
  console.log("=".repeat(60));
  console.log("Deployment complete!");
  console.log(`Contract address: ${vaultAddress}`);
  console.log(`Saved to:         ${filename}`);
  console.log("=".repeat(60));
  console.log("");
  console.log("Next steps:");
  console.log(`  1. Update CONTRACT_ADDRESS in agent/.env to: ${vaultAddress}`);
  console.log(`  2. Update NEXT_PUBLIC_CONTRACT_ADDRESS in frontend/.env`);
  console.log(`  3. Run: npm run seed -- to populate test data`);
  console.log(`  4. Run: npm run verify -- to verify on block explorer`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
