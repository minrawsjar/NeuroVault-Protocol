# NeuroVault AI Agent

The autonomous off-chain reasoning engine that powers NeuroVault. Reads treasury state from the blockchain, reasons about optimal strategy via **Gemini AI**, pins reasoning artifacts to **IPFS via Pinata**, encrypts secrets via **Lit Protocol (Naga Dev)**, and submits proposals on-chain to the NeuroVault smart contract.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     NEUROVAULT AGENT (:3001)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌──────────┐  │
│  │  Gemini   │   │   IPFS    │   │    Lit    │   │ Contract │  │
│  │  AI LLM   │   │  Pinata   │   │ Protocol  │   │  (viem + │  │
│  │           │   │           │   │ (Naga Dev)│   │ ethers)  │  │
│  └─────┬─────┘   └─────┬─────┘   └─────┬─────┘   └────┬─────┘  │
│        │               │               │              │          │
│  ┌─────▼───────────────▼───────────────▼──────────────▼─────┐   │
│  │              7-Stage Cycle Orchestrator                    │   │
│  │  Wake → Context → Reason → Validate → Commit → Propose   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Express API: /status  /cycle  /propose  /skill.md       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files

| File | Description |
|------|-------------|
| `src/index.ts` | Express API server, cron scheduler, startup logic, Lit Protocol initialization |
| `src/agent.ts` | `NeuroVaultAgent` class — 7-stage cycle orchestrator, validation, dedup/cooldown |
| `src/gemini.ts` | `GeminiAgent` class — Gemini 2.5 Flash API, prompt engineering, JSON extraction |
| `src/contract.ts` | `VaultContract` class — on-chain reads (viem), proposal submission (ethers.js), ENS |
| `src/ipfs.ts` | `commitReasoningBlob()` — pins JSON to Pinata REST API, deterministic CID fallback |
| `src/lit.ts` | `LitEncryption` class — Lit Protocol Naga Dev, encrypt/decrypt with access control |

---

## Gemini AI Integration

### Model Configuration

| Setting | Value | Why |
|---------|-------|-----|
| **Model** | `gemini-2.5-flash` | Fast, cheap, excellent structured output |
| **Temperature** | `0.2` | Low randomness — consistent treasury decisions |
| **Response MIME** | `application/json` | Forces valid JSON output (no markdown, no prose) |
| **Max Tokens** | `4096` | Enough for detailed reasoning without truncation |

### Prompt Engineering

The agent uses a **two-part prompt strategy**:

#### System Prompt (Invariant)

Defines the AI's role, constraints, and required output format:

```
You are NeuroVault AI Treasury Agent. You analyze treasury state and propose
EXACTLY ONE action. You MUST respond with a single JSON object containing:
- action: one of "stake", "swap", "rebalance", "transfer", "none"
- amount: number (token units, 18 decimals)
- token: address of the source token
- targetToken: address of the target token (or zero address)
- confidence: 0-100 integer
- reasoning: detailed explanation (minimum 80 characters)
```

The system prompt also lists available actions, Bifrost vDOT staking context, and governance rules.

#### User Prompt (Dynamic per-cycle)

Built fresh each cycle from live on-chain data:

```
Treasury State:
- Total value: $110,000 USD
- DOT balance: 10,000 tokens
- USDC balance: 10,000 tokens

Active Goals:
1. "Maximize yield via Bifrost vDOT liquid staking"

Recent Proposals: [last 5 with outcomes]

Governance Constraints:
- Spending limit: $50,000 USD per proposal
- Approved targets: [0x23CcE8..., 0x34b179..., 0x195FAc...]
- Minimum confidence: 50%

Bifrost Context:
- vDOT APY: ~12-15%
- Liquid staking — tokens remain transferable
```

### JSON Extraction

Gemini sometimes returns JSON wrapped in markdown fences or with extra text. The agent uses a **multi-strategy parser**:

1. **Direct parse** — try `JSON.parse()` on the raw response
2. **Strip fences** — remove ` ```json ... ``` ` wrappers
3. **Balanced brace extraction** — find the first `{` and match its closing `}` counting nesting depth
4. **Thinking block removal** — strip `<think>...</think>` blocks that Gemini sometimes includes

This handles every Gemini output format we've encountered in production.

### Example Gemini Output

```json
{
  "action": "stake",
  "amount": 5000000000000000000000,
  "token": "0x23CcE8797707c7b2Dd1354FCF4ef28256f98C00a",
  "targetToken": "0x0000000000000000000000000000000000000000",
  "confidence": 95,
  "reasoning": "The treasury holds 10,000 DOT tokens with an active goal to maximize yield via Bifrost liquid staking. vDOT currently offers ~12-15% APY with liquid staking benefits. Staking 5,000 DOT (50% of holdings) provides significant yield while maintaining liquidity reserves for other opportunities."
}
```

---

## IPFS Integration (Pinata)

### How It Works

Every reasoning cycle produces a **reasoning blob** that is pinned to IPFS before the on-chain proposal:

```
Agent Cycle → Gemini Output → Validation ✓ → Pin to IPFS → Get CID → Submit on-chain with CID
```

### Pinata REST API

The agent calls Pinata directly (no SDK dependency):

```
POST https://api.pinata.cloud/pinning/pinJSONToIPFS
Authorization: Bearer <PINATA_JWT>

{
  "pinataContent": {
    "source": "NeuroVault Agent",
    "timestamp": "2026-03-19T20:38:02.475Z",
    "content": {
      "action": "stake",
      "amount": 5000000000000000000000,
      "token": "0x23CcE8...",
      "confidence": 95,
      "reasoning": "..."
    }
  },
  "pinataMetadata": {
    "name": "neurovault-reasoning-1710880682"
  }
}
```

### Response

```json
{
  "IpfsHash": "QmSw6TEwXRiSZsUsmuhyPfbLcoNeGFQdebCQFKSVWUS1Sh",
  "PinSize": 1234,
  "Timestamp": "2026-03-19T20:38:02.475Z"
}
```

### Viewing Pinned Content

```
https://gateway.pinata.cloud/ipfs/QmSw6TEwXRiSZsUsmuhyPfbLcoNeGFQdebCQFKSVWUS1Sh
```

### Fallback

If Pinata is unreachable, the agent falls back to a **deterministic CID** computed from `SHA-256(JSON.stringify(blob))`. This ensures the cycle can complete even if the IPFS provider is temporarily down — the CID is still verifiable since anyone can recompute it from the same input.

---

## Lit Protocol Integration (Naga Dev)

### Purpose

The agent encrypts its Gemini API key via Lit Protocol so it's **never stored in plaintext at rest**. Only the agent's wallet address can decrypt it.

### SDK

```typescript
import { nagaDev } from "@lit-protocol/networks";
import { createLitClient } from "@lit-protocol/lit-client";

const litClient = await createLitClient({ network: nagaDev });
```

Uses the new Lit SDK v8+ with `@lit-protocol/lit-client` and `@lit-protocol/networks`.

### Encryption Flow

1. **On startup** (`ENABLE_LIT=true`):
   - Agent connects to Lit Protocol Naga Dev network
   - Encrypts the Gemini API key with an access control condition
   - Only the agent's wallet address can decrypt

2. **Access Control Condition**:
   ```json
   {
     "contractAddress": "",
     "standardContractType": "",
     "chain": "ethereum",
     "method": "",
     "parameters": [":userAddress"],
     "returnValueTest": {
       "comparator": "=",
       "value": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
     }
   }
   ```

3. **Result**: An encrypted blob (`ciphertext` + `dataToEncryptHash`) that can only be decrypted by the authorized wallet.

### Decryption

The `LitEncryption.decryptSecret()` method:
- Gets session signatures from the Lit network
- Presents the encrypted data + access control conditions
- Lit nodes verify the wallet address matches
- Returns the decrypted plaintext

### Non-Fatal

If Lit Protocol is unavailable (network down, timeout), the agent logs a warning and continues with the plaintext API key. This ensures the agent never halts due to Lit issues.

---

## On-Chain Contract Interaction

### Reading State (viem)

The agent reads treasury state using `viem` public client:

- `getTreasuryState()` → total value, DOT balance, USDC balance
- `getActiveGoals()` → current DAO strategy goals
- `getRecentProposals(n)` → last N proposals with status and outcomes
- `getGovernanceConstraints()` → spending limit, approved targets

### Submitting Proposals (ethers.js)

Proposal submission uses `ethers.js` instead of viem because ethers handles Paseo testnet gas estimation more reliably:

```typescript
const contract = new ethers.Contract(address, PROPOSE_ABI, signer);
const tx = await contract.propose(
  ipfsHash,        // "QmSw6TEwXRiSZsUsmuhyPfbLcoNeGFQdebCQFKSVWUS1Sh"
  actionType,      // 1 (stake)
  description,     // "Stake DOT via Bifrost for vDOT yield"
  amount,          // 5000000000000000000000n
  token,           // "0x23CcE8..."
  targetToken,     // "0x0000000000000000000000000000000000000000"
  confidence,      // 95n
  { gasPrice, gasLimit: 500000 }
);
```

### ENS Resolution

The agent can resolve ENS names registered in `NeuroVaultENS`:

```typescript
const address = await vault.resolveENS("neurovault.eth");
// → "0x195FAc0dc3AFaD9AA7dE057B786b8613742d3D8e"

const name = await vault.reverseENS("0x195FAc0dc3AFaD9AA7dE057B786b8613742d3D8e");
// → "neurovault.eth"
```

### Chain Configuration

The agent defines the Paseo testnet chain explicitly for viem:

```typescript
const paseoChain = defineChain({
  id: 420420417,
  name: "Polkadot Hub TestNet",
  nativeCurrency: { name: "PAS", symbol: "PAS", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://eth-rpc-testnet.polkadot.io/"] },
  },
});
```

---

## 7-Stage Cycle Deep Dive

### Stage 1: Wake + Deduplicate

- Acquire in-memory mutex lock
- Check if cooldown period has elapsed since last cycle
- If lock held or cooldown active → drop trigger, return early
- This prevents concurrent cycles from cron + manual + external triggers

### Stage 2: Context Assembly

- Call `getTreasuryState()` — total value, DOT/USDC balances
- Call `getActiveGoals()` — DAO strategy objectives
- Call `getRecentProposals(5)` — last 5 proposals with outcomes
- Call `getGovernanceConstraints()` — spending limit, approved targets
- Fetch external yield data (Bifrost APY) if configured

### Stage 3: Gemini Reasoning

- Build system prompt + user prompt from assembled context
- Call Gemini API with forced JSON output
- Parse response using multi-strategy JSON extractor
- Log raw response for debugging

### Stage 4: Validation

Six checks, ALL must pass:

| Check | Rule | Failure |
|-------|------|---------|
| Action allowlist | action ∈ {stake, swap, rebalance, transfer, none} | Reject |
| Amount sanity | amount > 0 (for non-none actions) | Reject |
| Spending limit | amount ≤ spendingLimitUsd | Reject |
| Target allowlist | target address ∈ approved targets | Reject |
| Confidence | confidence ≥ MIN_CONFIDENCE | Reject |
| Reasoning quality | reasoning.length ≥ 80 characters | Reject |

For `action: "none"`, target and amount checks are skipped.

### Stage 5: IPFS Commitment

- Serialize reasoning blob to JSON
- POST to Pinata REST API
- Receive CID (e.g., `QmSw6TEwXRiSZsUsmuhyPfbLcoNeGFQdebCQFKSVWUS1Sh`)
- If Pinata fails → compute deterministic SHA-256 CID

### Stage 6: On-Chain Proposal

- Call `propose()` on NeuroVault contract via ethers.js
- Include: IPFS CID, action type, description, amount, tokens, confidence
- Wait for transaction confirmation
- Log block number

### Stage 7: Completion

- Release mutex lock
- Update `lastCycleTime` timestamp
- Record cycle result (success/failure, action, CID, tx hash)
- Increment cycle counter

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/status` | GET | Agent status, cycle count, last result, uptime |
| `/cycle` | POST | Trigger manual reasoning cycle. Body: `{ "triggerType": "manual" }` |
| `/propose` | POST | External agent trigger with wallet signature auth |
| `/.well-known/skill.md` | GET | Capability manifest for agent discovery |

### POST `/cycle`

```bash
curl -X POST http://localhost:3001/cycle \
  -H "Content-Type: application/json" \
  -d '{"triggerType": "manual"}'
```

### POST `/propose` (External Agent)

```json
{
  "callerAddress": "0x...",
  "signature": "0x...",
  "timestamp": 1710000000000,
  "scenario": "Evaluate rebalance under volatility spike",
  "callerEns": "risk-agent.eth"
}
```

Requires valid wallet signature for authentication. ENS name is optional metadata.

### GET `/status`

```json
{
  "status": "running",
  "cycleCount": 5,
  "lastCycle": {
    "timestamp": "2026-03-19T20:38:02.475Z",
    "action": "stake",
    "confidence": 95,
    "ipfsCid": "QmSw6TEwXRiSZsUsmuhyPfbLcoNeGFQdebCQFKSVWUS1Sh",
    "txHash": "0xeb3e636075ce36f85a18035c732da3a692da61b9c72d261dddbb0d93562e17f6"
  }
}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | Yes | — | Google Gemini API key |
| `RPC_URL` | Yes | — | Polkadot Hub RPC endpoint |
| `CONTRACT_ADDRESS` | Yes | — | NeuroVault contract address |
| `AGENT_PRIVATE_KEY` | Yes | — | Wallet private key for signing proposals |
| `CYCLE_INTERVAL` | No | `*/30 * * * *` | Cron expression for auto-cycles |
| `MIN_CONFIDENCE` | No | `0.70` | Minimum AI confidence threshold (0-1) |
| `CYCLE_COOLDOWN_MS` | No | `60000` | Cooldown between cycles (ms) |
| `SPENDING_LIMIT_USD` | No | `0` | Max USD per proposal |
| `APPROVED_TARGETS` | No | — | Comma-separated allowed target addresses |
| `ENABLE_LIT` | No | `false` | Enable Lit Protocol key encryption |
| `ENS_ADDRESS` | No | — | NeuroVaultENS contract address |
| `PINATA_JWT` | No | — | Pinata JWT for IPFS pinning |
| `PINATA_API_KEY` | No | — | Pinata API key (alternative auth) |
| `PINATA_API_SECRET` | No | — | Pinata API secret (alternative auth) |
| `BIFROST_APY_URL` | No | — | External yield data endpoint |
| `PORT` | No | `3001` | API server port |

---

## Quick Start

```bash
# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your keys

# Run (development)
npm run dev

# Run (production)
npm run build && npm start
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@google/generative-ai` | latest | Gemini AI API client |
| `viem` | ^2.x | On-chain reads (public client) |
| `ethers` | ^6.x | On-chain writes (proposal submission) |
| `express` | ^4.x | API server |
| `node-cron` | ^3.x | Scheduled cycle triggers |
| `@lit-protocol/lit-client` | latest | Lit Protocol encryption |
| `@lit-protocol/networks` | latest | Lit network definitions (nagaDev) |
