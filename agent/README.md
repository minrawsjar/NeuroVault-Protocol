# NeuroVault AI Agent

Autonomous treasury management agent using Gemini API for reasoning and IPFS for verifiable on-chain storage.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     NEUROVAULT AGENT                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Gemini API   │  │ IPFS Storage │  │ Smart Contract       │  │
│  │ (Reasoning)  │  │ (Proof)      │  │ (Polkadot Hub)       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  Cycle Loop: Every 30 minutes                                   │
│  1. Read treasury state from chain                               │
│  2. Query Gemini for reasoning + proposed action                 │
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
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
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

NeuroVault follows a strict 7-stage cycle:

1. **Wake + deduplicate** (in-memory lock + cooldown gate)
2. **Context assembly** (treasury, goals, recent proposals, constraints, yields)
3. **LLM reasoning call** (Gemini structured JSON)
4. **Output validation** (action/amount/targets/confidence/reasoning checks)
5. **IPFS commitment** (reasoning blob → CID)
6. **On-chain proposal submission** (`propose(...)`)
7. **Completion** (release lock, update timestamps, emit result)

Triggers:
- Cron (`CYCLE_INTERVAL`)
- Manual (`POST /cycle`)
- External agent (`POST /propose`)

Dedup behaviour:
- If a cycle is in progress, new trigger is dropped
- If cooldown has not elapsed, new trigger is dropped

Authentication for external triggers:
- Wallet signature required
- ENS optional metadata only

## Files

- `src/gemini.ts` - Gemini API integration
- `src/ipfs.ts` - IPFS pinning via web3.storage
- `src/contract.ts` - EVM contract interaction (viem)
- `src/agent.ts` - Main agent loop with cron scheduling
- `src/index.ts` - Express API server
