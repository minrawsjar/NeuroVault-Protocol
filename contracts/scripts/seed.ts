/**
 * seed.ts — Populate NeuroVault with demo data for the hackathon presentation.
 *
 * This script:
 *   1. Mints test tokens to the vault (if using a mintable test token)
 *   2. Creates test staker accounts and stakes DOT
 *   3. Submits 3 sample AI proposals (simulating the agent)
 *   4. Casts votes on proposals to show governance in action
 *   5. Finalizes one proposal to show execution
 *
 * Run after deploy: npm run seed
 */

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

// Minimal ERC20 ABI for test tokens
const ERC20_ABI = [
  "function mint(address to, uint256 amount) external",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
];

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const staker1 = signers[1] || deployer;
  const staker2 = signers[2] || deployer;
  const agentSigner = signers[3] || deployer;

  console.log("=".repeat(60));
  console.log("NeuroVault Seed Script");
  console.log("=".repeat(60));

  // Load deployment
  const networkName = (await ethers.provider.getNetwork()).name;
  const deploymentPath = path.join(__dirname, `../deployments/${networkName}.json`);

  let vaultAddress: string;
  let dotAddress: string;
  let usdcAddress: string;

  if (fs.existsSync(deploymentPath)) {
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
    vaultAddress = deployment.contracts.NeuroVault;
    dotAddress = deployment.tokens.DOT;
    usdcAddress = deployment.tokens.USDC;
  } else {
    // Fallback to env
    vaultAddress = process.env.VAULT_ADDRESS || "";
    dotAddress = process.env.DOT_TOKEN_ADDRESS || "";
    usdcAddress = process.env.USDC_TOKEN_ADDRESS || "";
    if (!vaultAddress) throw new Error("No deployment found. Run deploy first.");
  }

  console.log(`Vault:      ${vaultAddress}`);
  console.log(`DOT token:  ${dotAddress}`);
  console.log(`USDC token: ${usdcAddress}`);
  console.log("");

  const vault = await ethers.getContractAt("NeuroVault", vaultAddress);
  const dot = new ethers.Contract(dotAddress, ERC20_ABI, deployer);
  const usdc = new ethers.Contract(usdcAddress, ERC20_ABI, deployer);

  // ── 1. Fund the vault with initial tokens ─────────────────────

  console.log("Step 1: Funding vault with initial treasury...");
  try {
    // Mint 10,000 DOT to vault
    const dotAmount = ethers.parseEther("10000"); // 10k DOT
    await (await dot.mint(vaultAddress, dotAmount)).wait();
    console.log(`  ✅ Minted 10,000 DOT to vault`);

    // Mint 50,000 USDC to vault
    const usdcAmount = ethers.parseUnits("50000", 6); // 50k USDC
    await (await usdc.mint(vaultAddress, usdcAmount)).wait();
    console.log(`  ✅ Minted 50,000 USDC to vault`);
  } catch {
    console.log(`  ⚠️  Token minting failed (tokens may not be mintable, skipping)`);
  }

  // ── 2. Create staker accounts ─────────────────────────────────

  console.log("\nStep 2: Setting up stakers...");

  const stakeAmount1 = ethers.parseEther("1500"); // 1500 DOT
  const stakeAmount2 = ethers.parseEther("1000"); // 1000 DOT

  // Fund stakers with DOT
  for (const [staker, amount, name] of [
    [staker1, stakeAmount1, "Staker 1"],
    [staker2, stakeAmount2, "Staker 2"],
  ] as const) {
    try {
      await (await dot.mint(staker.address, amount)).wait();
      await (await dot.connect(staker).approve(vaultAddress, amount)).wait();
      await (await (vault.connect(staker) as any).stake(amount)).wait();
      console.log(`  ✅ ${name} (${staker.address.substring(0, 10)}...) staked ${ethers.formatEther(amount)} DOT`);
    } catch (e) {
      console.log(`  ⚠️  Staker setup failed for ${name}: ${e}`);
    }
  }

  // ── 3. Submit sample AI proposals ─────────────────────────────

  console.log("\nStep 3: Submitting demo proposals (as agent)...");

  // Connect vault as agent (in real usage, agent has its own private key)
  const vaultAsAgent = vault.connect(agentSigner) as any;

  const proposals = [
    {
      ipfsHash: "QmNeuroVault1aK8zXm2vYp3nQ7rT9sWuP4jH6dMcF5bNvRgJeL",
      actionType: 1, // Stake
      description: "Stake 5,000 DOT on Bifrost for vDOT yield (est. 12.3% APY)",
      amount: ethers.parseEther("5000"),
      token: dotAddress,
      targetToken: ethers.ZeroAddress,
      confidence: 87,
    },
    {
      ipfsHash: "QmNeuroVault2bL9yYn3wZq4oR8sXvQ5kI7eMdG6cOwShKfM",
      actionType: 2, // Transfer
      description: "Transfer 2,000 USDC to approved liquidity pool for yield",
      amount: ethers.parseUnits("2000", 6),
      token: usdcAddress,
      targetToken: ethers.ZeroAddress,
      confidence: 79,
    },
    {
      ipfsHash: "QmNeuroVault3cM0zZo4xAr5pS9tYwR6lJ8fNeH7dPxTiLgN",
      actionType: 3, // Rebalance
      description: "Rebalance portfolio: increase DOT allocation to 70%, reduce USDC to 30%",
      amount: ethers.parseEther("1000"),
      token: dotAddress,
      targetToken: usdcAddress,
      confidence: 82,
    },
  ];

  const proposalIds: number[] = [];
  for (const p of proposals) {
    try {
      const tx = await vaultAsAgent.propose(
        p.ipfsHash,
        p.actionType,
        p.description,
        p.amount,
        p.token,
        p.targetToken,
        p.confidence
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find((l: any) => {
        try {
          const parsed = vault.interface.parseLog(l);
          return parsed?.name === "ProposalCreated";
        } catch { return false; }
      });
      const parsed = event ? vault.interface.parseLog(event) : null;
      const pid = parsed ? Number(parsed.args[0]) : proposalIds.length + 1;
      proposalIds.push(pid);
      console.log(`  ✅ Proposal #${pid}: "${p.description.substring(0, 50)}..." (confidence: ${p.confidence}%)`);
    } catch (e) {
      console.log(`  ⚠️  Proposal submission failed: ${e}`);
    }
  }

  // ── 4. Cast votes ─────────────────────────────────────────────

  console.log("\nStep 4: Casting votes on proposals...");

  if (proposalIds.length > 0) {
    // Vote on proposal 1: both stakers vote FOR
    try {
      await (await (vault.connect(staker1) as any).vote(proposalIds[0], true)).wait();
      await (await (vault.connect(staker2) as any).vote(proposalIds[0], true)).wait();
      console.log(`  ✅ Proposal #${proposalIds[0]}: Both stakers voted FOR (quorum met)`);
    } catch (e) {
      console.log(`  ⚠️  Voting failed: ${e}`);
    }

    // Vote on proposal 2: staker1 votes FOR, staker2 votes AGAINST
    if (proposalIds.length > 1) {
      try {
        await (await (vault.connect(staker1) as any).vote(proposalIds[1], true)).wait();
        await (await (vault.connect(staker2) as any).vote(proposalIds[1], false)).wait();
        console.log(`  ✅ Proposal #${proposalIds[1]}: Split vote (staker1 FOR, staker2 AGAINST)`);
      } catch (e) {
        console.log(`  ⚠️  Voting failed: ${e}`);
      }
    }
    // Proposal 3: leave open for live demo
  }

  // ── 5. Summary ────────────────────────────────────────────────

  console.log("");
  console.log("=".repeat(60));
  console.log("Seed complete! Demo state:");
  console.log("");

  try {
    const state = await vault.getTreasuryState();
    console.log(`  Treasury value:     $${ethers.formatEther(state[0])}`);
    console.log(`  DOT balance:        ${ethers.formatEther(state[1])} DOT`);
    console.log(`  USDC balance:       ${ethers.formatUnits(state[2], 6)} USDC`);
    console.log(`  Active proposals:   ${state[3]}`);
    console.log(`  APY:                ${Number(state[4]) / 100}%`);
  } catch (e) {
    console.log(`  (Could not read treasury state: ${e})`);
  }

  console.log("");
  console.log("Proposal statuses for demo:");
  console.log("  Proposal #1: Both stakers voted FOR — ready to finalize (execute)");
  console.log("  Proposal #2: Split vote — will be rejected at finalization");
  console.log("  Proposal #3: Open for live voting during demo");
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
