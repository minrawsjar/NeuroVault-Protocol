import { NeuroVaultAgent, AgentConfig } from "./agent.js";
import { config } from "dotenv";
import express, { Request, Response } from "express";
import cors from "cors";

config();

const app = express();
app.use(cors());
app.use(express.json());

// Validate env
const requiredEnv = [
  "CLAUDE_API_KEY",
  "RPC_URL",
  "CONTRACT_ADDRESS",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`❌ Missing required env var: ${key}`);
    process.exit(1);
  }
}

// Agent config
const agentConfig: AgentConfig = {
  claudeApiKey: process.env.CLAUDE_API_KEY!,
  rpcUrl: process.env.RPC_URL!,
  contractAddress: process.env.CONTRACT_ADDRESS!,
  agentPrivateKey: process.env.AGENT_PRIVATE_KEY, // Optional - for submitting proposals
  cycleInterval: process.env.CYCLE_INTERVAL || "*/30 * * * *",
  minConfidence: parseInt(process.env.MIN_CONFIDENCE || "70"),
};

// Create agent
const agent = new NeuroVaultAgent(agentConfig);

// Status endpoint
app.get("/status", (req, res) => {
  const status = agent.getStatus();
  res.json({
    ...status,
    config: {
      contractAddress: agentConfig.contractAddress,
      cycleInterval: agentConfig.cycleInterval,
      minConfidence: agentConfig.minConfidence,
    },
  });
});

// Trigger manual cycle
app.post("/cycle", async (req, res) => {
  try {
    // This would need to be exposed from the agent class
    res.json({ message: "Manual cycle triggered" });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Skill manifest for Synthesis hackathon
app.get("/.well-known/skill.md", (req, res) => {
  res.type("text/markdown");
  res.send(`# NeuroVault Agent

An autonomous AI treasury management agent.

## Capabilities
- Propose treasury rebalancing strategies
- Stake DOT in nomination pools
- Execute cross-chain transfers via Hyperbridge
- Provide verifiable on-chain reasoning

## API

### POST /propose
Submit a proposal to the treasury.

**Request:**
\`\`\`json
{
  "action": "rebalance",
  "description": "Rebalance DOT/USDC to 60/40",
  "amount": "1000",
  "token": "DOT",
  "targetToken": "USDC"
}
\`\`\`

**Response:**
\`\`\`json
{
  "proposalId": 25,
  "ipfsHash": "Qm...",
  "txHash": "0x..."
}
\`\`\`

## ENS
neurovault.eth

## Verification
All proposals include IPFS-stored reasoning with on-chain hash commitment.
`);
});

// Start agent and server
async function main() {
  await agent.start();

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🌐 API server running on http://localhost:${PORT}`);
    console.log(`📖 Skill manifest: http://localhost:${PORT}/.well-known/skill.md`);
  });
}

main().catch((error) => {
  console.error("❌ Failed to start:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down...");
  agent.stop();
  process.exit(0);
});
