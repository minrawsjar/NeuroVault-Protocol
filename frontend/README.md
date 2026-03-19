# NeuroVault Frontend

A **Next.js** dashboard for the NeuroVault Protocol. Provides staking UI, treasury overview, governance voting, bot console, and wallet integration via **Wagmi + Web3Modal** on the Polkadot Hub EVM (Paseo Testnet).

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js 14** | React framework with App Router |
| **TailwindCSS** | Utility-first styling |
| **Wagmi v2** | React hooks for Ethereum |
| **Web3Modal** | Wallet connection modal (MetaMask, WalletConnect, etc.) |
| **viem** | Low-level EVM interaction |
| **TypeScript** | Type safety throughout |

---

## Pages

### Public Pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Landing page — hero section, capabilities overview, architecture diagram, how it works, governance preview |
| `/stake` | `app/stake/page.tsx` | Standalone staking page — stake PAS tokens, deposit USDC, view balances and voting power |

### Dashboard Pages (App)

| Route | File | Description |
|-------|------|-------------|
| `/app` | `app/app/page.tsx` | Main dashboard — treasury overview, agent status, activity feed, bot console |
| `/app/treasury` | `app/app/treasury/page.tsx` | Detailed treasury breakdown — DOT/USDC balances, total value, allocation charts |
| `/app/vote` | `app/app/vote/page.tsx` | Governance voting — view proposals, vote for/against, see results |
| `/app/stake` | `app/app/stake/page.tsx` | In-app staking interface (same as `/stake` but within dashboard layout) |
| `/app/overview` | `app/app/overview/page.tsx` | Portfolio overview — user's staked amounts, voting power, deposit history |

### Admin

| Route | File | Description |
|-------|------|-------------|
| `/admin` | `app/admin/page.tsx` | Admin panel for contract owner operations |

---

## API Routes

Server-side Next.js API routes that proxy or aggregate data:

| Route | Method | File | Description |
|-------|--------|------|-------------|
| `/api/bot` | POST | `app/api/bot/route.ts` | Bot console command handler — parses commands like `treasury status`, `stake 100 DOT`, `governance queue` |
| `/api/vault/status` | GET | `app/api/vault/status/route.ts` | Treasury state — reads from chain or agent API |
| `/api/agents` | GET | `app/api/agents/route.ts` | Agent discovery — returns agent capabilities and status |
| `/api/crosschain` | GET | `app/api/crosschain/route.ts` | Cross-chain message queue — Hyperbridge dispatch status |
| `/api/ens` | GET | `app/api/ens/route.ts` | ENS name resolution — resolve names via NeuroVaultENS contract |

### Bot Console Commands

The `/api/bot` endpoint processes these commands from the dashboard console:

| Command | Description |
|---------|-------------|
| `treasury status` | Show treasury balances and total value |
| `stake <amount> <DOT\|USDC>` | Stake tokens or deposit USDC |
| `governance queue` | List pending proposals |
| `agent status` | Show AI agent status and last cycle |
| `crosschain queue` | Show pending Hyperbridge messages |
| `register ens <name>.eth` | Register a new ENS name |

---

## Components

### Core Components

| Component | File | Description |
|-----------|------|-------------|
| **SimpleWallet** | `components/SimpleWallet.tsx` | Wallet connection button — connects via Web3Modal, shows address, balance, chain |
| **AppNavbar** | `components/AppNavbar.tsx` | Dashboard navigation bar with page links and wallet status |
| **Navbar** | `components/Navbar.tsx` | Landing page navigation bar |
| **Logo** | `components/Logo.tsx` | NeuroVault brand logo |

### Landing Page Sections

| Component | File | Description |
|-----------|------|-------------|
| **HeroSection** | `components/HeroSection.tsx` | Hero with tagline, CTA buttons, animated background |
| **CapabilitiesSection** | `components/CapabilitiesSection.tsx` | Feature cards — AI reasoning, IPFS storage, Lit encryption, Hyperbridge |
| **HowItWorksSection** | `components/HowItWorksSection.tsx` | Step-by-step flow diagram — deposit → AI reasons → IPFS → vote → execute |
| **TreasurySection** | `components/TreasurySection.tsx` | Live treasury preview — DOT/USDC balances, total value |
| **GovernanceSection** | `components/GovernanceSection.tsx` | Governance preview — recent proposals, voting stats |

### Dashboard Components

| Component | File | Description |
|-----------|------|-------------|
| **ActivityFeed** | `components/ActivityFeed.tsx` | Real-time activity feed — proposals, votes, deposits, agent cycles |
| **GoalsPanel** | `components/GoalsPanel.tsx` | Active DAO goals display |

---

## Hooks

### `useNeuroVault` — Contract Interaction Hook

**File**: `hooks/useNeuroVault.ts`

The central hook for all on-chain interactions. Uses Wagmi's `useReadContract` and `useWriteContract` under the hood.

#### Read Operations

```typescript
const {
  treasuryState,     // { totalValueUsd, dotBalance, usdcBalance }
  stakerInfo,        // { stakedAmount, votingPower, usdcDeposited, lastStakeTime }
  activeGoals,       // string[]
  recentProposals,   // Proposal[]
  pasBalance,        // user's PAS token balance
  usdcBalance,       // user's USDC token balance
  pasAllowance,      // PAS allowance for vault contract
  usdcAllowance,     // USDC allowance for vault contract
} = useNeuroVault();
```

#### Write Operations

```typescript
const {
  stake,             // stake(amount) — stake PAS tokens
  unstake,           // unstake(amount) — withdraw PAS
  depositUsdc,       // depositUsdc(amount) — deposit USDC into treasury
  approvePas,        // approve PAS spending for vault
  approveUsdc,       // approve USDC spending for vault
  vote,              // vote(proposalId, support) — cast vote
} = useNeuroVault();
```

#### Usage Example

```tsx
const { stake, stakerInfo, pasBalance } = useNeuroVault();

// Stake 100 PAS tokens
await stake(parseEther("100"));

// Check voting power
console.log(stakerInfo.votingPower); // BigInt
```

---

## Library

### `contracts.ts` — ABIs & Addresses

**File**: `lib/contracts.ts`

Central configuration for all contract addresses and ABIs:

```typescript
// Contract addresses (Paseo testnet)
export const NEUROVAULT_ADDRESS = "0x195FAc0dc3AFaD9AA7dE057B786b8613742d3D8e";
export const ENS_ADDRESS = "0x3721472089bFe55c1E761c4Bb1776a731eca9817";
export const PAS_TOKEN = "0x23CcE8797707c7b2Dd1354FCF4ef28256f98C00a";
export const USDC_TOKEN = "0x34b179eCC554DE9bdBC9736E5E3E804e8318D8f3";

// ABIs
export const NEUROVAULT_ABI = [...];  // Full NeuroVault ABI
export const ENS_ABI = [...];          // NeuroVaultENS ABI
export const ERC20_ABI = [...];        // Standard ERC20 ABI
```

---

## Providers

### `Web3ModalProvider.tsx` — Wallet Configuration

**File**: `providers/Web3ModalProvider.tsx`

Configures Wagmi + Web3Modal with the Paseo testnet chain:

```typescript
const paseoChain = {
  id: 420420417,
  name: "Polkadot Hub TestNet",
  nativeCurrency: { name: "PAS", symbol: "PAS", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://eth-rpc-testnet.polkadot.io/"] },
  },
};
```

Supports MetaMask, WalletConnect, and other injected wallets via Web3Modal.

---

## Wallet Connection Flow

1. User clicks "Connect Wallet" (SimpleWallet component)
2. Web3Modal opens with wallet options
3. User selects MetaMask (or other wallet)
4. If not on Paseo testnet → prompt to switch network
5. Connected: address + PAS balance displayed in navbar
6. All contract interactions now available via `useNeuroVault` hook

### Adding Paseo to MetaMask

The app auto-prompts to add the chain, but manual config:

| Setting | Value |
|---------|-------|
| Network Name | Polkadot Hub TestNet |
| RPC URL | `https://eth-rpc-testnet.polkadot.io/` |
| Chain ID | `420420417` |
| Currency Symbol | PAS |

---

## Staking Flow (User Perspective)

### Stake PAS Tokens

```
1. Connect wallet
2. Navigate to /stake
3. Enter PAS amount
4. Click "Approve PAS" → MetaMask approval TX
5. Click "Stake" → MetaMask stake TX
6. Voting power updated immediately
```

### Deposit USDC

```
1. Connect wallet
2. Navigate to /stake
3. Switch to USDC tab
4. Enter USDC amount
5. Click "Approve USDC" → MetaMask approval TX
6. Click "Deposit" → MetaMask deposit TX
7. USDC deposited amount tracked per-user
```

### Vote on Proposal

```
1. Connect wallet (must have staked PAS)
2. Navigate to /app/vote
3. View proposal details + IPFS reasoning link
4. Click "Vote For" or "Vote Against"
5. MetaMask confirmation
6. Vote weight = staked PAS amount
```

---

## Environment Variables

```env
# Required for wallet connection
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Optional: Gemini API key for bot console AI responses
GEMINI_API_KEY=your_gemini_key

# Optional: Lit Protocol authorized addresses
LIT_AUTHORIZED_ADDRESSES=0xabc...,0xdef...

# Optional: Agent API URL
AGENT_API_URL=http://127.0.0.1:3001

# Optional: Vault data source
VAULT_DATA_SOURCE=onchain
VAULT_RPC_URL=https://eth-rpc-testnet.polkadot.io/
CONTRACT_ADDRESS=0x195FAc0dc3AFaD9AA7dE057B786b8613742d3D8e

# Optional: Cross-chain API
CROSSCHAIN_API_URL=https://your-crosschain-api.example.com/queue

# Keep false for production-like behavior
ALLOW_LOCAL_FALLBACK=false
```

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# → http://localhost:3000

# Build for production
npm run build
npm start
```

---

## Project Structure

```
frontend/src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout (providers, fonts)
│   ├── globals.css                 # TailwindCSS global styles
│   ├── stake/page.tsx              # Standalone staking page
│   ├── admin/page.tsx              # Admin panel
│   ├── app/                        # Dashboard pages
│   │   ├── page.tsx                # Main dashboard
│   │   ├── layout.tsx              # Dashboard layout (sidebar)
│   │   ├── treasury/page.tsx       # Treasury details
│   │   ├── vote/page.tsx           # Governance voting
│   │   ├── stake/page.tsx          # In-app staking
│   │   └── overview/page.tsx       # Portfolio overview
│   └── api/                        # Server-side API routes
│       ├── bot/route.ts            # Bot console handler
│       ├── vault/status/route.ts   # Treasury state
│       ├── agents/route.ts         # Agent discovery
│       ├── crosschain/route.ts     # Cross-chain queue
│       └── ens/route.ts            # ENS resolution
├── components/
│   ├── SimpleWallet.tsx            # Wallet connection
│   ├── AppNavbar.tsx               # Dashboard navbar
│   ├── Navbar.tsx                  # Landing navbar
│   ├── HeroSection.tsx             # Landing hero
│   ├── CapabilitiesSection.tsx     # Feature cards
│   ├── HowItWorksSection.tsx       # Flow diagram
│   ├── TreasurySection.tsx         # Treasury preview
│   ├── GovernanceSection.tsx       # Governance preview
│   ├── ActivityFeed.tsx            # Activity feed
│   ├── GoalsPanel.tsx              # Goals display
│   └── Logo.tsx                    # Brand logo
├── hooks/
│   └── useNeuroVault.ts            # Contract interaction hook
├── lib/
│   └── contracts.ts                # ABIs + addresses
└── providers/
    └── Web3ModalProvider.tsx        # Wagmi + Web3Modal config
```
