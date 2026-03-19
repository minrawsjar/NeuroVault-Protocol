import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deploymentPath = path.join(__dirname, "../deployments/paseo.json");
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));

  const vault = await ethers.getContractAt("NeuroVault", deployment.contracts.NeuroVault);

  const currentAgent = await vault.agentAddress();
  console.log(`Current agent: ${currentAgent}`);
  console.log(`Deployer (new agent): ${deployer.address}`);

  if (currentAgent.toLowerCase() === deployer.address.toLowerCase()) {
    console.log("✅ Agent address already matches deployer");
    return;
  }

  const tx = await vault.setAgentAddress(deployer.address);
  await tx.wait();
  console.log(`✅ Agent address updated to ${deployer.address}`);

  // Update deployment file
  deployment.config.agentAddress = deployer.address;
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log("✅ Updated paseo.json");
}

main().catch((error) => {
  console.error("❌ Failed:", error);
  process.exit(1);
});
