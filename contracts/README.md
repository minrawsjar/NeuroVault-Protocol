# NeuroVault Smart Contracts

Solidity smart contracts deployed on **Polkadot Hub EVM (Paseo Testnet)** via Hardhat. Includes the main treasury/governance contract, an on-chain ENS-style name registry, Hyperbridge cross-chain interfaces, and Bifrost vDOT liquid staking interfaces.

---

## Deployed Contracts

**Network**: Polkadot Hub TestNet (Paseo)
**Chain ID**: `420420417`
**RPC**: `https://eth-rpc-testnet.polkadot.io/`
**Deployer**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

| Contract | Address | Solidity |
|----------|---------|----------|
| **NeuroVault** | `0x195FAc0dc3AFaD9AA7dE057B786b8613742d3D8e` | `contracts/NeuroVault.sol` |
| **NeuroVaultENS** | `0x3721472089bFe55c1E761c4Bb1776a731eca9817` | `contracts/NeuroVaultENS.sol` |
| **PAS Token** | `0x23CcE8797707c7b2Dd1354FCF4ef28256f98C00a` | `contracts/MockERC20.sol` |
| **USDC Token** | `0x34b179eCC554DE9bdBC9736E5E3E804e8318D8f3` | `contracts/MockERC20.sol` |
| **Hyperbridge Dispatch** | `0xbb26e04a71e7c12093e82b83ba310163eac186fa` | External |

All addresses are stored in `deployments/paseo.json`.

---

## Contract Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     NeuroVault.sol                             │
│                                                                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐              │
│  │  Staking   │  │ Proposals  │  │  Voting    │              │
│  │  (PAS +    │  │ (Agent     │  │ (Staker    │              │
│  │   USDC)    │  │  submits)  │  │  weighted) │              │
│  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘              │
│         │               │               │                      │
│  ┌──────▼───────────────▼───────────────▼─────────────────┐   │
│  │                   Execution Engine                      │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │ Token Swap  │  │ Bifrost Stake│  │  Transfer    │  │   │
│  │  │ (internal)  │  │ (Hyperbridge)│  │  (ERC20)     │  │   │
│  │  └─────────────┘  └──────────────┘  └──────────────┘  │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌────────────┐  ┌────────────┐                               │
│  │   Goals    │  │  Access    │                               │
│  │ (DAO sets  │  │  Control   │                               │
│  │  strategy) │  │ (owner +   │                               │
│  └────────────┘  │  agent)    │                               │
│                  └────────────┘                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────┐    ┌──────────────────────────────────┐
│  NeuroVaultENS.sol   │    │  Interfaces                      │
│  (Name Registry)     │    │  ├─ IHyperbridge.sol (ISMP)      │
│  neurovault.eth →    │    │  └─ IBifrost.sol (vDOT staking)  │
│    0x195FAc...       │    └──────────────────────────────────┘
└──────────────────────┘
```

---

## NeuroVault.sol — Main Treasury Contract

The core contract (~800 lines) managing staking, treasury deposits, AI proposals, voting, and cross-chain execution.

### Staking

Users stake PAS tokens to gain voting power in the DAO:

```solidity
// Stake PAS tokens — grants voting power
function stake(uint256 amount) external

// Deposit USDC into treasury (tracked per-user)
function depositUsdc(uint256 amount) external

// Unstake PAS tokens
function unstake(uint256 amount) external

// Get staker details: staked amount, voting power, USDC deposited
function getStakerInfo(address staker) external view returns (
    uint256 stakedAmount,
    uint256 votingPower,
    uint256 usdcDeposited,
    uint256 lastStakeTime
)
```

**Voting power** is proportional to staked PAS amount. Users must approve the PAS/USDC token before staking/depositing.

### Proposals

Only the registered agent wallet can submit proposals:

```solidity
function propose(
    string calldata ipfsHash,       // IPFS CID of reasoning blob
    uint8 actionType,               // 0=none, 1=stake, 2=swap, 3=transfer, 4=rebalance
    string calldata description,    // Human-readable summary
    uint256 amount,                 // Token amount (18 decimals)
    address token,                  // Source token address
    address targetToken,            // Target token address (or zero)
    uint256 confidence              // Agent confidence (0-100)
) external returns (uint256 proposalId)
```

**Action Types:**

| Value | Name | Description |
|-------|------|-------------|
| 0 | `none` | No action — monitoring only |
| 1 | `stake` | Stake tokens via Bifrost for vDOT yield |
| 2 | `swap` | Swap between DOT and USDC |
| 3 | `transfer` | Transfer tokens to approved address |
| 4 | `rebalance` | Adjust portfolio allocations |

**Events:**

```solidity
event ProposalCreated(
    uint256 indexed proposalId,
    string ipfsHash,
    uint8 actionType,
    uint256 amount,
    uint256 confidence
);
```

### Voting

Stakers vote on proposals, weighted by their staked PAS amount:

```solidity
// Vote on a proposal (true = support, false = against)
function vote(uint256 proposalId, bool support) external

// Get proposal details
function getProposal(uint256 proposalId) external view returns (
    string ipfsHash,
    uint8 actionType,
    string description,
    uint256 amount,
    address token,
    address targetToken,
    uint256 confidence,
    uint256 forVotes,
    uint256 againstVotes,
    uint8 status
)
```

**Proposal Lifecycle:**

```
Pending → Voting → Approved/Rejected → Executed (if approved)
```

### Treasury Reads

```solidity
// Get full treasury state
function getTreasuryState() external view returns (
    uint256 totalValueUsd,
    uint256 dotBalance,
    uint256 usdcBalance
)

// Get active DAO goals
function getActiveGoals() external view returns (string[] memory)

// Get recent proposals
function getRecentProposals(uint256 count) external view returns (Proposal[] memory)

// Get governance constraints
function spendingLimitUsd() external view returns (uint256)
function getApprovedTargets() external view returns (address[] memory)
```

### Admin Functions

```solidity
// Update the agent wallet address (owner only)
function setAgentAddress(address newAgent) external onlyOwner

// Set a new treasury goal (owner only)
function setGoal(string calldata text) external onlyOwner
```

### Cross-Chain Execution (Hyperbridge)

The contract can dispatch cross-chain staking calls to Bifrost via Hyperbridge ISMP:

```solidity
// Internal: encode and dispatch a Bifrost staking call
function _executeBifrostStake(uint256 amount) internal
```

This encodes a `BifrostStakeCall` struct and dispatches it via `IIsmpDispatch.dispatch()` to the Bifrost parachain, where DOT is converted to vDOT (liquid staking derivative).

---

## NeuroVaultENS.sol — On-Chain Name Registry

A lightweight ENS-style registry purpose-built for NeuroVault. Maps human-readable names to addresses with metadata.

### Data Structure

```solidity
struct Record {
    address addr;           // Resolved address
    string name;            // Human-readable name
    string role;            // Role description (e.g., "treasury", "agent")
    string description;     // Extended description
    string endpoint;        // Optional API/RPC endpoint URL
    uint256 registeredAt;   // Block timestamp of registration
    bool active;            // Is this record active?
}
```

### Functions

```solidity
// Register a new name (owner only)
function register(
    string calldata name,
    address addr,
    string calldata role,
    string calldata description,
    string calldata endpoint
) external onlyOwner

// Resolve name → address
function resolve(string calldata name) external view returns (address)

// Reverse lookup: address → name
function reverseName(address addr) external view returns (string memory)

// Get full record for a name
function getRecord(string calldata name) external view returns (Record memory)

// Get all active records
function getAllActiveRecords() external view returns (Record[] memory)

// Update the address for an existing name
function updateAddress(string calldata name, address newAddr) external onlyOwner

// Deactivate a name
function deactivate(string calldata name) external onlyOwner
```

### Name Hashing

Names are stored using `keccak256(bytes(name))` as the mapping key for gas-efficient lookups. The original name string is stored in the Record struct for display.

### Registered Names

| Name | Address | Role |
|------|---------|------|
| `neurovault.eth` | `0x195FAc0dc3AFaD9AA7dE057B786b8613742d3D8e` | Treasury contract |
| `agent.neurovault.eth` | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | AI reasoning agent |
| `pas.neurovault.eth` | `0x23CcE8797707c7b2Dd1354FCF4ef28256f98C00a` | PAS governance token |
| `usdc.neurovault.eth` | `0x34b179eCC554DE9bdBC9736E5E3E804e8318D8f3` | USDC stablecoin |

---

## IHyperbridge.sol — Cross-Chain Interfaces

Interfaces for **Hyperbridge ISMP** (Interoperable State Machine Protocol) — the cross-chain messaging layer used to communicate with other Polkadot parachains.

### Key Interfaces

**`IIsmpDispatch`** — Send cross-chain requests:

```solidity
interface IIsmpDispatch {
    // Send a POST request to another parachain
    function dispatch(DispatchPost calldata request) external payable returns (bytes32);

    // Send a GET request to another parachain
    function dispatch(DispatchGet calldata request) external payable returns (bytes32);
}
```

**`IIsmpModule`** — Receive inbound cross-chain messages:

```solidity
interface IIsmpModule {
    function onAccept(IncomingPostRequest calldata request) external;
    function onPostRequestTimeout(PostRequest calldata request) external;
    function onPostResponse(IncomingPostResponse calldata response) external;
    function onGetResponse(IncomingGetResponse calldata response) external;
}
```

### Request Structs

```solidity
struct DispatchPost {
    bytes dest;           // Destination parachain state machine ID
    bytes to;             // Destination module address
    bytes body;           // Encoded call data (e.g., BifrostStakeCall)
    uint64 timeout;       // Timeout in seconds
    uint256 fee;          // Relayer fee
    address payer;        // Fee payer address
}
```

### Dispatcher Address

The Hyperbridge dispatcher on Paseo is at: `0xbb26e04a71e7c12093e82b83ba310163eac186fa`

---

## IBifrost.sol — Bifrost vDOT Liquid Staking

Interfaces for encoding Bifrost liquid staking calls that are dispatched via Hyperbridge.

### BifrostStakeCall

```solidity
struct BifrostStakeCall {
    BifrostAction action;    // Stake, Unstake, or Redeem
    uint256 amount;          // Token amount (18 decimals)
    address recipient;       // Who receives the vDOT
    uint256 nonce;           // Replay protection
}

enum BifrostAction {
    Stake,      // DOT → vDOT
    Unstake,    // vDOT → DOT (unbonding period)
    Redeem      // Claim unbonded DOT
}
```

### BifrostCallEncoder

Helper library to ABI-encode staking calls for the Hyperbridge dispatch body:

```solidity
library BifrostCallEncoder {
    function encode(BifrostStakeCall memory call) internal pure returns (bytes memory);
}
```

### IBifrostVToken

ERC20-like interface for the vDOT liquid staking token:

```solidity
interface IBifrostVToken {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function getExchangeRate() external view returns (uint256);
}
```

The exchange rate represents how much DOT one vDOT is worth — increases over time as staking rewards accrue.

---

## Deployment Scripts

All scripts are in `scripts/` and run via Hardhat:

| Script | Command | Description |
|--------|---------|-------------|
| `deploy.ts` | `npx hardhat run scripts/deploy.ts --network paseo` | Deploy NeuroVault + mock tokens. Seeds initial state. |
| `deploy-ens.ts` | `npx hardhat run scripts/deploy-ens.ts --network paseo` | Deploy NeuroVaultENS + register 4 names. |
| `set-agent.ts` | `npx hardhat run scripts/set-agent.ts --network paseo` | Update agent address on NeuroVault contract. |
| `deploy-test-tokens.ts` | `npx hardhat run scripts/deploy-test-tokens.ts --network paseo` | Deploy standalone PAS/USDC mock tokens. |
| `seed.ts` | `npx hardhat run scripts/seed.ts --network paseo` | Populate demo stakers, goals, balances. |
| `verify-deployment.ts` | `npx hardhat run scripts/verify-deployment.ts --network paseo` | Read and verify all deployed contract state. |
| `check-balances.ts` | `npx hardhat run scripts/check-balances.ts --network paseo` | Check PAS/USDC/native balances for addresses. |

### Deploy Flow

```bash
# 1. Deploy main contract + tokens
npx hardhat run scripts/deploy.ts --network paseo
# → Deploys NeuroVault, MockERC20 (PAS), MockERC20 (USDC)
# → Sets agent address, mints initial tokens, creates goals
# → Writes addresses to deployments/paseo.json

# 2. Deploy ENS registry
npx hardhat run scripts/deploy-ens.ts --network paseo
# → Deploys NeuroVaultENS
# → Registers neurovault.eth, agent, pas, usdc names

# 3. (If needed) Update agent address
npx hardhat run scripts/set-agent.ts --network paseo
# → Calls setAgentAddress() to update the authorized agent wallet
```

---

## Environment Variables

```env
# Required for deployment
DEPLOYER_PRIVATE_KEY=0x...
PASEO_RPC_URL=https://eth-rpc-testnet.polkadot.io/

# Optional: existing token addresses (skip token deployment)
DOT_TOKEN_ADDRESS=0x23CcE8797707c7b2Dd1354FCF4ef28256f98C00a
USDC_TOKEN_ADDRESS=0x34b179eCC554DE9bdBC9736E5E3E804e8318D8f3

# Optional: existing contract addresses
NEUROVAULT_ADDRESS=0x195FAc0dc3AFaD9AA7dE057B786b8613742d3D8e
ENS_ADDRESS=0x3721472089bFe55c1E761c4Bb1776a731eca9817
```

---

## Hardhat Configuration

The project uses Hardhat with TypeScript and typechain:

```typescript
// hardhat.config.ts
networks: {
  paseo: {
    url: "https://eth-rpc-testnet.polkadot.io/",
    accounts: [DEPLOYER_PRIVATE_KEY],
    chainId: 420420417,
  }
}
```

### Typechain

Auto-generated TypeScript types for all contracts are in `typechain-types/`. These provide type-safe contract interaction in scripts and tests.

---

## Quick Start

```bash
# Install
npm install

# Compile contracts
npx hardhat compile

# Deploy to Paseo testnet
npx hardhat run scripts/deploy.ts --network paseo

# Verify deployment
npx hardhat run scripts/verify-deployment.ts --network paseo
```
