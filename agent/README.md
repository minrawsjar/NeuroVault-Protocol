# NeuroVault AI Agent

Autonomous treasury management agent using Claude API for reasoning and IPFS for verifiable on-chain storage.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     NEUROVAULT AGENT                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Claude API   │  │ IPFS Storage │  │ Smart Contract       │  │
│  │ (Reasoning)  │  │ (Proof)      │  │ (Polkadot Hub)       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  Cycle Loop: Every 30 minutes                                   │
│  1. Read treasury state from chain                               │
│  2. Query Claude for reasoning + proposed action                 │
│  3. Store reasoning blob to IPFS                                 │
│  4. Submit proposal with IPFS hash to contract                 │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Copy env and fill in your keys
cp .env.example .env

# Install dependencies (already done)
npm install

# Run agent in dev mode
npm run dev

# Or build and run
npm run build
npm start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CLAUDE_API_KEY` | Yes | Anthropic API key |
| `WEB3_STORAGE_TOKEN` | Yes | web3.storage token for IPFS |
| `RPC_URL` | Yes | Polkadot Hub RPC endpoint |
| `CONTRACT_ADDRESS` | Yes | Vault contract address |
| `AGENT_PRIVATE_KEY` | No | For submitting proposals on-chain |
| `CYCLE_INTERVAL` | No | Cron expression (default: `*/30 * * * *`) |
| `MIN_CONFIDENCE` | No | Minimum confidence % (default: 70) |
| `PORT` | No | API server port (default: 3001) |

## API Endpoints

- `GET /status` - Agent status and config
- `POST /cycle` - Trigger manual cycle
- `GET /.well-known/skill.md` - Synthesis hackathon skill manifest

## Cycle Flow

1. **Read State** → Get treasury balances, active goals, recent proposals
2. **Reason** → Claude analyzes and proposes action with confidence score
3. **Store** → Full reasoning JSON → IPFS, get CID
4. **Submit** → Proposal with IPFS hash committed on-chain
5. **Vote** → Stakers review and approve/reject

## Files

- `src/claude.ts` - Claude API integration
- `src/ipfs.ts` - IPFS pinning via web3.storage
- `src/contract.ts` - EVM contract interaction (viem)
- `src/agent.ts` - Main agent loop with cron scheduling
- `src/index.ts` - Express API server
