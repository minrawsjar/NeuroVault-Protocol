import { NeuroVaultAgent, AgentConfig } from "./agent.js";
import { config } from "dotenv";
import express, { Request, Response } from "express";
import cors from "cors";
import { verifyMessage } from "ethers";

config();

const app = express();
app.use(cors());
app.use(express.json());

// Validate env
const requiredEnv = [
  "GEMINI_API_KEY",
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
  geminiApiKey: process.env.GEMINI_API_KEY!,
  rpcUrl: process.env.RPC_URL!,
  contractAddress: process.env.CONTRACT_ADDRESS!,
  agentPrivateKey: process.env.AGENT_PRIVATE_KEY, // Optional - for submitting proposals
  cycleInterval: process.env.CYCLE_INTERVAL || "*/30 * * * *",
  minConfidence: Number(process.env.MIN_CONFIDENCE || "0.70"),
  cooldownMs: Number(process.env.CYCLE_COOLDOWN_MS || "60000"),
  bifrostApyUrl: process.env.BIFROST_APY_URL,
  acalaApyUrl: process.env.ACALA_APY_URL,
  spendingLimitUsd: Number(process.env.SPENDING_LIMIT_USD || "0"),
  approvedTargets: (process.env.APPROVED_TARGETS || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean),
  web3StorageToken: process.env.WEB3_STORAGE_TOKEN,
  enableLit: process.env.ENABLE_LIT === "true",
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
    const triggerType = String(req.body?.triggerType || "manual") as
      | "manual"
      | "goal_updated"
      | "large_deposit"
      | "proposal_resolved";

    const result = await agent.requestCycle(triggerType);
    res.json({ status: "ok", result });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// External agent trigger endpoint (ENS optional, signature required)
app.post("/propose", async (req, res) => {
  try {
    const callerAddress = String(req.body?.callerAddress || "").toLowerCase();
    const signature = String(req.body?.signature || "");
    const timestamp = Number(req.body?.timestamp || 0);
    const scenario = String(req.body?.scenario || "external request");
    const callerEns = String(req.body?.callerEns || "");

    if (!callerAddress || !signature || !timestamp) {
      return res.status(400).json({
        error: "Missing callerAddress/signature/timestamp",
      });
    }

    const now = Date.now();
    if (Math.abs(now - timestamp) > 5 * 60 * 1000) {
      return res.status(401).json({ error: "Signature timestamp expired" });
    }

    const message = `NeuroVault external trigger\nscenario:${scenario}\ntimestamp:${timestamp}`;
    const recovered = verifyMessage(message, signature).toLowerCase();
    if (recovered !== callerAddress) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    const result = await agent.requestCycle("external_agent");

    return res.json({
      status: "accepted",
      callerAddress,
      callerEns: callerEns || null,
      scenario,
      result,
      auth: {
        mode: "wallet_signature",
        ensRequired: false,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: String(error) });
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
Trigger a full reasoning cycle from another agent.

Authentication: wallet signature required, ENS optional.

**Request:**
\`\`\`json
{
  "callerAddress": "0x...",
  "signature": "0x...",
  "timestamp": 1710000000000,
  "scenario": "Evaluate rebalance under volatility spike",
  "callerEns": "risk-agent.eth"
}
\`\`\`

**Response:**
\`\`\`json
{
  "status": "accepted",
  "result": {
    "cycleNumber": 25,
    "triggerType": "external_agent",
    "action": "rebalance"
  }
}
\`\`\`

## ENS
neurovault.eth

ENS is identity metadata only and not required for access.

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
