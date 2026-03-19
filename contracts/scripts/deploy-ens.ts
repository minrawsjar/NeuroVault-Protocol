import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("============================================================");
  console.log("NeuroVault ENS Registry Deployment");
  console.log("============================================================");
  console.log(`Deployer: ${deployer.address}`);

  // Deploy ENS Registry
  const ENS = await ethers.getContractFactory("NeuroVaultENS");
  const ens = await ENS.deploy();
  await ens.waitForDeployment();
  const ensAddress = await ens.getAddress();
  console.log(`✅ NeuroVaultENS deployed at: ${ensAddress}`);

  // Load existing deployment config
  const deploymentPath = path.join(__dirname, "../deployments/paseo.json");
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));

  // Register core names
  const vaultAddress = deployment.contracts.NeuroVault;
  const agentAddress = deployment.config.agentAddress;
  const pasToken = deployment.tokens.PAS || deployment.tokens.DOT;
  const usdcToken = deployment.tokens.USDC;

  console.log("\nRegistering names...");

  const registrations = [
    {
      name: "neurovault.eth",
      addr: vaultAddress,
      role: "treasury",
      description: "NeuroVault AI Treasury DAO contract",
      endpoint: "",
    },
    {
      name: "agent.neurovault.eth",
      addr: agentAddress,
      role: "agent",
      description: "AI reasoning agent powered by Gemini",
      endpoint: "http://localhost:3001",
    },
    {
      name: "pas.neurovault.eth",
      addr: pasToken,
      role: "token",
      description: "PAS governance token",
      endpoint: "",
    },
    {
      name: "usdc.neurovault.eth",
      addr: usdcToken,
      role: "token",
      description: "USDC stablecoin",
      endpoint: "",
    },
  ];

  for (const reg of registrations) {
    try {
      const tx = await ens.register(
        reg.name,
        reg.addr,
        reg.role,
        reg.description,
        reg.endpoint
      );
      await tx.wait();
      console.log(`  ✅ ${reg.name} → ${reg.addr} (${reg.role})`);
    } catch (err: any) {
      console.error(`  ❌ Failed to register ${reg.name}:`, err.message);
    }
  }

  // Update deployment file
  deployment.contracts.NeuroVaultENS = ensAddress;
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log(`\n✅ Updated ${deploymentPath}`);

  console.log("\n============================================================");
  console.log(`ENS Registry: ${ensAddress}`);
  console.log("============================================================");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});
