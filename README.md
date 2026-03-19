<p align="center">
  <h1 align="center">NeuroVault Protocol</h1>
  <p align="center"><strong>Autonomous AI Treasury DAO with Verifiable On-Chain Memory</strong></p>
  <p align="center">
    Built on Polkadot Hub | Gemini AI | IPFS | Lit Protocol | Hyperbridge | ENS
  </p>
</p>

<p align="center">
  <a href="#why-neurovault">Why NeuroVault</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#live-deployment">Live Deployment</a> •
  <a href="#the-7-stage-reasoning-cycle">Reasoning Cycle</a> •
  <a href="#security--trust-model">Security</a> •
  <a href="#getting-started">Get Started</a>
</p>

---

## Why NeuroVault?

### The Problem with DAO Treasuries

DAO treasuries hold billions, yet they suffer from two fundamental failures:

1. **Human bottlenecks** — Multisig signers are slow, inconsistent, and unavailable. Proposals sit in queues for weeks. Yield opportunities expire before anyone votes.

2. **Black-box bots** — Automated vaults execute strategies silently. There's no reasoning trail, no explainability, no way for stakeholders to audit *why* a decision was made.

The result: **Funds are either stuck or managed without accountability.**

### The NeuroVault Solution

NeuroVault eliminates both problems by introducing an **AI agent that thinks in public**:

> Every proposal comes with a full reasoning artifact — permanently stored on IPFS, linked to the on-chain proposal, and auditable by anyone.

**What makes NeuroVault different:**

- **AI that explains itself** — Gemini generates structured reasoning with confidence scores. No black-box decisions. Every action has a "why" pinned to IPFS.

- **Governance-constrained AI** — The agent can't spend more than the DAO allows. It can't touch unapproved tokens. It can't act below a confidence threshold. The DAO sets the rules, the AI operates within them.

- **Stakers have final say** — The AI proposes, humans approve. Proposals go through on-chain voting weighted by stake. Nothing executes without consensus.

- **Verifiable memory** — Every reasoning cycle produces an immutable IPFS artifact. Anyone can verify *what the AI saw*, *what it decided*, and *why* — after the fact.

- **Cross-chain native** — Built on Polkadot Hub with Hyperbridge ISMP for cross-chain staking on Bifrost. The treasury isn't locked to one chain.

- **Encrypted key management** — Lit Protocol encrypts the AI's API keys so only the authorized agent wallet can decrypt them. No plaintext secrets.

- **Human-readable identity** — An on-chain ENS registry maps addresses to names (`neurovault.eth`, `agent.neurovault.eth`). Makes governance transparent and auditable.

### Why NeuroVault Wins

| | Traditional DAO Treasury | Automated Vault Bot | NeuroVault |
|---|--------------------------|--------------------:|:----------:|
| **Speed** | Slow decisions | Fast | Fast |
| **Transparency** | Transparent voting | No transparency | Full transparency |
| **Oversight** | Human oversight | No oversight | AI proposes, humans approve |
| **Reasoning** | No reasoning trail | No reasoning trail | IPFS reasoning artifacts |
| **Multi-chain** | Single chain | Single chain | Cross-chain via Hyperbridge |
| **Key mgmt** | Manual key mgmt | Hardcoded keys | Lit Protocol encrypted keys |
| **Identity** | No identity layer | No identity layer | On-chain ENS registry |

---

## How It Works

### The Big Picture

```
  Stakers deposit PAS/USDC → Set treasury goals → AI agent runs reasoning cycles
        → Proposes actions with IPFS proof → Stakers vote → Approved actions execute
```

### Step by Step

**1. Stakers Fund the Treasury**
Users connect MetaMask, stake PAS governance tokens or deposit USDC. Staking grants voting power proportional to stake size.

**2. DAO Sets Goals**
The DAO owner sets strategic goals like *"Maximize yield on DOT holdings via Bifrost liquid staking"*. The AI uses these goals as its north star.

**3. AI Agent Runs Reasoning Cycles**
Every 30 minutes (or on-demand), the agent wakes up and:
- Reads the full treasury state from the blockchain (balances, goals, past proposals)
- Sends everything to Gemini AI with a structured system prompt
- Gemini returns a JSON action with reasoning, confidence, and amounts
- The agent validates the output against governance guardrails

**4. Reasoning is Pinned to IPFS**
Before any proposal goes on-chain, the full reasoning blob — including what the AI saw, what it decided, and why — is pinned to IPFS via Pinata. This creates a permanent, tamper-proof record.

**5. Proposal Submitted On-Chain**
The agent calls `propose()` on the NeuroVault smart contract with:
- The IPFS CID (linking to the reasoning)
- The action type (stake, swap, rebalance, transfer)
- The amount, tokens involved, and AI confidence score

**6. Stakers Vote**
Token holders vote on proposals. Voting power is weighted by stake. Only proposals that pass the vote threshold are approved.

**7. Execution**
Approved proposals can be executed — swapping tokens, staking DOT via Bifrost through Hyperbridge, or rebalancing the portfolio.

### What the AI Can Do

| Action | What Happens | Example |
|--------|-------------|---------|
| **Stake** | Stake DOT via Bifrost for vDOT with ~12-15% APY | *"Stake 5000 DOT for vDOT yield"* |
| **Swap** | Swap between DOT and USDC to rebalance | *"Sell 2000 USDC for DOT at current price"* |
| **Rebalance** | Adjust portfolio allocations | *"Rebalance to 60% DOT / 40% USDC"* |
| **Transfer** | Send tokens to approved addresses | *"Transfer 1000 DOT to ops multisig"* |
| **None** | No action needed — explains why | *"Market conditions stable, no action required"* |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NeuroVault Protocol                          │
│                                                                     │
│  ┌──────────┐    ┌──────────────┐    ┌───────────┐    ┌──────────┐  │
│  │ Frontend │───►│  Agent API   │───►│  Gemini   │    │   Lit    │  │
│  │ (Next.js)│    │ (Express.js) │    │ (AI LLM)  │    │ Protocol │  │  
│  │ :3000    │    │ :3001        │    └─────┬─────┘    │(Naga Dev)│  │
│  └────┬─────┘    └──────┬───────┘          │          └────┬─────┘  │
│       │                 │            ┌─────▼─────┐         │        │
│       │                 │            │  Validate  │    Encrypt/     │
│       │                 │            │  Output    │    Decrypt      │
│       │                 │            └─────┬─────┘    API Keys      │
│       │                 │                  │                        │
│       │          ┌──────▼───────┐   ┌──────▼───────┐                │
│       │          │ IPFS Pinata  │   │  On-Chain    │                │
│       │          │ (Pin JSON)   │   │  propose()   │                │
│       │          └──────┬───────┘   └──────┬───────┘                │
│       │                 │                  │                        │
│  ┌────▼─────────────────▼──────────────────▼────────────────────┐   │
│  │              Polkadot Hub EVM (Paseo Testnet)                │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐   │   │
│  │  │ NeuroVault  │  │NeuroVaultENS │  │ Hyperbridge ISMP   │   │   │
│  │  │ (Treasury)  │  │(Name Registry│  │ (Cross-chain to    │   │   │
│  │  │             │  │             )│  │  Bifrost/vDOT)     │   │   │
│  │  └─────────────┘  └──────────────┘  └────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Why We Chose It |
|-------|-----------|-----------------|
| **AI Reasoning** | Google Gemini 2.5 Flash | Fast structured JSON output, low hallucination, forced JSON mode |
| **Blockchain** | Polkadot Hub EVM (Paseo) | Low gas, EVM-compatible, native Hyperbridge cross-chain |
| **Verifiable Storage** | IPFS via Pinata | Permanent, content-addressed, tamper-proof reasoning artifacts |
| **Key Encryption** | Lit Protocol (Naga Dev) | Decentralized access control — no centralized key server |
| **Identity** | NeuroVaultENS (custom) | On-chain name resolution, human-readable protocol addresses |
| **Cross-chain** | Hyperbridge ISMP | Native Polkadot cross-chain messaging to Bifrost for vDOT staking |
| **Frontend** | Next.js + TailwindCSS + Wagmi | Modern React dashboard with native wallet integration |
| **Agent Runtime** | TypeScript + Express + ethers.js | Lightweight, battle-tested, easy to extend |

---

## Live Deployment

**Network**: Polkadot Hub TestNet (Paseo)  
**Chain ID**: `420420417`  
**RPC**: `https://eth-rpc-testnet.polkadot.io/`

| Contract | Address | Purpose |
|----------|---------|---------|
| **NeuroVault** | `0x195FAc0dc3AFaD9AA7dE057B786b8613742d3D8e` | Treasury, staking, governance, proposals |
| **NeuroVaultENS** | `0x3721472089bFe55c1E761c4Bb1776a731eca9817` | On-chain name registry |
| **PAS Token** | `0x23CcE8797707c7b2Dd1354FCF4ef28256f98C00a` | Governance token (ERC20) |
| **USDC Token** | `0x34b179eCC554DE9bdBC9736E5E3E804e8318D8f3` | Stablecoin (ERC20) |
| **Hyperbridge** | `0xbb26e04a71e7c12093e82b83ba310163eac186fa` | ISMP cross-chain dispatcher |

### Registered ENS Names

| Name | Resolves To | Role |
|------|------------|------|
| `neurovault.eth` | `0x195FAc...3D8e` | Treasury contract |
| `agent.neurovault.eth` | `0xf39Fd6...2266` | AI agent wallet |
| `pas.neurovault.eth` | `0x23CcE8...C00a` | PAS governance token |
| `usdc.neurovault.eth` | `0x34b179...D8f3` | USDC stablecoin |

---

## The 7-Stage Reasoning Cycle

Every agent cycle follows a strict, deterministic pipeline:

```
┌─ Stage 1: WAKE ─────────────────────────────────────────────────────┐
│  Acquire in-memory lock. Check cooldown. Drop duplicate triggers.   │
├─ Stage 2: CONTEXT ──────────────────────────────────────────────────┤
│  Read from chain: treasury balances, active goals, recent           │
│  proposals, governance constraints (spending limit, approved        │
│  targets, confidence threshold).                                    │
├─ Stage 3: REASON ───────────────────────────────────────────────────┤
│  Send structured prompt to Gemini AI. System prompt defines rules   │
│  and JSON schema. User prompt includes live treasury context.       │
│  Gemini returns: action, amount, token, confidence, reasoning.      │
├─ Stage 4: VALIDATE ─────────────────────────────────────────────────┤
│  Action in allowlist?  Amount ≤ treasury balance?                   │
│  Amount ≤ spending limit?  Target in approved list?                 │
│  Confidence ≥ threshold?  Reasoning ≥ 80 characters?                │
│  If ANY check fails → cycle ends, no proposal submitted.            │
├─ Stage 5: COMMIT ───────────────────────────────────────────────────┤
│  Pin full reasoning blob to IPFS via Pinata. Returns real CID.      │
│  Reasoning includes: what the AI saw, what it decided, why.         │
├─ Stage 6: PROPOSE ──────────────────────────────────────────────────┤
│  Call propose() on NeuroVault contract with IPFS CID + params.      │
│  Transaction confirmed on Polkadot Hub EVM.                         │
├─ Stage 7: COMPLETE ─────────────────────────────────────────────────┤
│  Release lock. Update cycle timestamps. Log result.                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Trigger Sources

| Trigger | How | When |
|---------|-----|------|
| **Cron** | Automatic | Every 30 minutes (configurable) |
| **Manual** | `POST /cycle` | On demand |
| **External agent** | `POST /propose` with wallet signature | Cross-protocol collaboration |
| **Event-driven** | `goal_updated`, `large_deposit` | Reactive (endpoint-ready) |

---

## Security & Trust Model

### Three Layers of Defense

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: AI GUARDRAILS (off-chain, before proposal)            │
│  ├─ Spending limit enforcement (max USD per proposal)           │
│  ├─ Approved target allowlist (only whitelisted tokens)         │
│  ├─ Confidence threshold (AI must be ≥50% sure)                 │
│  ├─ Amount sanity checks (can't exceed treasury balance)        │
│  └─ Reasoning quality gate (must explain in ≥80 characters)     │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2: SMART CONTRACT (on-chain, enforced by code)           │
│  ├─ Only the registered agent wallet can call propose()         │
│  ├─ Proposal lifecycle management (pending → voting → executed) │
│  ├─ Staker voting requirement (weighted by stake)               │
│  └─ Execution guards (only approved proposals can run)          │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3: HUMAN GOVERNANCE (final authority)                    │
│  ├─ Staker voting on every proposal                             │
│  ├─ Goal setting by DAO owner                                   │
│  ├─ Agent address rotation (owner can change agent wallet)      │
│  └─ Emergency: owner can pause or update constraints            │
└─────────────────────────────────────────────────────────────────┘
```

### Key Management via Lit Protocol

The agent's Gemini API key is **never stored in plaintext at rest** (when Lit is enabled):

1. On startup, the agent connects to **Lit Protocol (Naga Dev network)**
2. The API key is encrypted with an **access control condition**: only the agent's wallet address can decrypt
3. The encrypted blob is held in memory
4. Before each Gemini call, the key is decrypted on-the-fly
5. If Lit is unavailable, the agent falls back gracefully (non-fatal, logged)

### Auditability

Every proposal creates a permanent audit trail:

- **IPFS CID** → links to the full reasoning blob (what the AI saw, decided, and why)
- **On-chain event** → `ProposalCreated(proposalId, ipfsHash, actionType, confidence)`
- **Block timestamp** → exact time of submission
- **Vote record** → who voted, how they voted, final outcome

Anyone who staked can reconstruct the AI's decision by reading the IPFS blob and the on-chain state at that block.

---

## Project Structure

```
NeuroVault-Protocol/
├── agent/          → AI reasoning engine (Gemini, Lit, IPFS, cycle orchestration)
├── contracts/      → Solidity smart contracts (NeuroVault, ENS, Hyperbridge, Bifrost)
├── frontend/       → Next.js dashboard (staking, voting, treasury, bot console)
├── ipfs/           → Standalone IPFS upload server (Pinata)
├── README.md       → You are here
└── LICENSE
```

**Each folder has its own detailed README** with full integration docs, environment variables, API references, and code walkthroughs:

- **[`agent/README.md`](agent/README.md)** — Gemini AI prompt engineering, Lit Protocol Naga Dev encryption, IPFS Pinata pinning, 7-stage cycle orchestration, all env vars and API endpoints
- **[`contracts/README.md`](contracts/README.md)** — NeuroVault treasury contract, NeuroVaultENS registry, Hyperbridge ISMP interfaces, Bifrost vDOT staking, deployment scripts, all contract functions
- **[`frontend/README.md`](frontend/README.md)** — Dashboard pages, wallet integration with Wagmi, React hooks, API routes, component architecture
- **[`ipfs/README.md`](ipfs/README.md)** — Pinata REST API integration, standalone upload server, test scripts

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** 9+
- **MetaMask** (or any EVM wallet)
- PAS testnet tokens from Paseo faucet

### Quick Start

```bash
# 1. Clone
git clone https://github.com/minrawsjar/NeuroVault-Protocol.git
cd NeuroVault-Protocol

# 2. Start the AI agent
cd agent
npm install
cp .env.example .env    # Fill in your Gemini API key + private key
npm run dev              # → http://localhost:3001

# 3. Start the frontend
cd ../frontend
npm install
npm run dev              # → http://localhost:3000

# 4. (Optional) Deploy your own contracts
cd ../contracts
npm install
npx hardhat run scripts/deploy.ts --network paseo
npx hardhat run scripts/deploy-ens.ts --network paseo
```

### Add Paseo Testnet to MetaMask

| Setting | Value |
|---------|-------|
| Network Name | Polkadot Hub TestNet |
| RPC URL | `https://eth-rpc-testnet.polkadot.io/` |
| Chain ID | `420420417` |
| Currency Symbol | PAS |

---

## Verified End-to-End Flow

The complete pipeline has been tested and confirmed working on Paseo testnet:

```
✅ Gemini AI reasoning     → 95% confidence, "stake 5000 DOT via Bifrost for vDOT yield"
✅ IPFS Pinata pinning     → CID: QmSw6TEwXRiSZsUsmuhyPfbLcoNeGFQdebCQFKSVWUS1Sh
✅ On-chain proposal       → TX confirmed in block 6591450
✅ Lit Protocol (Naga Dev) → API key encrypted, access restricted to agent wallet
✅ ENS Registry            → 4 names registered and resolvable on-chain
✅ Staking (PAS + USDC)    → Deposit, per-user tracking, voting power working
✅ Frontend dashboard      → Live wallet connection, staking UI, treasury overview
```

---

## Deployment

### Frontend → Vercel

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy from frontend directory
cd frontend
vercel

# 3. Set environment variables in Vercel dashboard:
#    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = your_project_id
#    NEXT_PUBLIC_AGENT_API_URL = https://your-ec2-ip:3001
```

Or connect the GitHub repo directly at [vercel.com/new](https://vercel.com/new) → select `frontend/` as root directory.

### Agent → Docker + AWS EC2

```bash
# On your EC2 instance:

# 1. Clone the repo
git clone https://github.com/minrawsjar/NeuroVault-Protocol.git
cd NeuroVault-Protocol

# 2. Configure agent environment
cp agent/.env.example agent/.env
nano agent/.env   # Fill in your API keys

# 3. Deploy with one command
bash deploy-aws.sh

# Agent will be running at http://<your-ec2-ip>:3001
```

**EC2 Security Group**: Open inbound port **3001** (TCP) for agent API access.

**Useful Docker commands:**
```bash
docker compose logs -f          # View live logs
docker compose restart          # Restart agent
docker compose down             # Stop agent
docker compose up -d --build    # Rebuild and restart
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m "Add feature"`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a pull request

---

## License

MIT — see [LICENSE](LICENSE).

---

<p align="center">
  <strong>NeuroVault Protocol</strong><br/>
  AI treasury intelligence with verifiable reasoning on Polkadot Hub.<br/><br/>
  <em>The AI proposes. The DAO decides. The chain remembers.</em>
</p>
