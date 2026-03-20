# NeuroVault Protocol — 5-Minute Demo Script

> **Total runtime:** ~5 minutes
> **Format:** Screen recording with voiceover
> **Sections:** Problem (45s) → Solution (45s) → Architecture (90s) → Live Demo (120s) → Close (20s)

---

## SECTION 1 — THE PROBLEM (0:00 – 0:45)

**[SCREEN: Landing page hero or title slide]**

> "DAO treasuries are still managed like spreadsheets with multisigs.
>
> Capital sits idle. Rebalancing is slow. Yield opportunities are missed. And by the time governance reacts, market conditions have already changed.
>
> The core problem is that treasury management is manual, fragmented, and too slow for live markets.
>
> NeuroVault is our answer: an AI-assisted treasury protocol where strategy generation, governance, and execution are all connected on-chain."

---

## SECTION 2 — THE SOLUTION (0:45 – 1:30)

**[SCREEN: Stay on landing page and scroll slightly]**

> "NeuroVault combines three layers.
>
> First, an AI agent monitors treasury state and proposes actions.
>
> Second, those actions become on-chain governance proposals that PAS stakers can approve or reject.
>
> Third, once approved, the vault contract can execute the action directly, including cross-chain stake dispatch through Hyperbridge.
>
> The result is a treasury that can reason faster, stay transparent, and still remain fully governed by token holders."

---

## SECTION 3 — ARCHITECTURE (1:30 – 3:00)

**[SCREEN: Navigate to `/app`]**

> "Here’s the live dashboard.
>
> The core contract lives on Polkadot Hub EVM on Paseo. It holds treasury assets, tracks stakers, manages proposals, and executes approved actions."

**[SCREEN: Point to treasury metrics]**

> "These treasury metrics are read from the configured contract and RPC. This is the live vault state the app is using."

**[SCREEN: Point to Agent panel]**

> "The external agent runs off-chain. It reads treasury state, produces a recommendation, pins reasoning to IPFS, and submits a proposal on-chain."

**[SCREEN: Point to Governance / proposal preview]**

> "Every AI recommendation becomes a governance object. Stakers vote, and the proposal metadata stays visible in the UI."

**[SCREEN: Point to Hyperbridge / cross-chain panel]**

> "Cross-chain actions are represented through the governance pipeline. The contract has a Hyperbridge dispatch path for stake execution, and the UI shows proposal-derived queue state."

**[SCREEN: Point to Bifrost card if visible]**

> "One important detail: Bifrost is part of the execution architecture, not a standalone live frontend integration here. The contract is wired to encode and dispatch a Bifrost staking call through Hyperbridge when an approved stake proposal is finalized."

---

## SECTION 4 — LIVE DEMO (3:00 – 5:00)

### Step 1 — Bot Console (3:00 – 3:35)

**[SCREEN: Scroll to bot console on `/app`]**

> "This is the treasury bot console. It gives a simple operator interface over the protocol."

**[TYPE and CLICK: `treasury status`]**

> "This reads the current vault state from the configured contract and RPC: treasury value, PAS versus USDC allocation, APY, and staking participation."

**[SCREEN: Wait for response and read it aloud]**

**[TYPE and CLICK: `agent status`]**

> "This shows whether the runtime agent is active and whether the on-chain identity and runtime integration are available."

**[SCREEN: Wait for response]**

**[TYPE and CLICK: `crosschain queue`]**

> "This shows the current cross-chain action queue derived from recent proposals and execution state."

**[SCREEN: Wait for response]**

**[TYPE and CLICK: `suggest rebalance plan`]**

> "This is the AI advisory path. The bot sends the current treasury snapshot to Gemini and asks for a live rebalance recommendation."

**[SCREEN: Wait for response and read it aloud]**

### Step 2 — Governance / Vote (3:35 – 4:15)

**[SCREEN: Navigate to `/app/vote`]**

> "Every AI recommendation becomes a governance proposal here. Stakers decide whether that action should execute."

**[SCREEN: Point to an active proposal card]**

> "This card shows the proposal description, confidence score, vote totals, and IPFS hash for the reasoning artifact.
>
> The metadata is on-chain. The reasoning document itself is referenced through IPFS."

> "Each proposal has a one-hour voting window. After the deadline, anyone can finalize it. If quorum is met, the vault executes the action."

**[SCREEN: Click 'Vote For' if wallet is connected]**

> "I’ll cast a vote on Paseo testnet so you can see the governance flow end to end."

**[SCREEN: Wait for confirmation]**

### Step 3 — Staking (4:15 – 4:45)

**[SCREEN: Navigate to `/app/stake`]**

> "Users stake PAS to earn yield and gain voting power. More stake means more influence over treasury decisions."

**[SCREEN: Enter amount and click Deposit]**

> "If the wallet needs token allowance first, the app asks for approval. Then it submits the staking transaction to the vault contract."

**[SCREEN: Show confirmation or success state]**

### Step 4 — Hyperbridge / Bifrost Explanation (4:45 – 5:00)

**[SCREEN: Switch to proposal page or contract snippet in editor/terminal]**

> "Here’s where Bifrost actually fits.
>
> The frontend is not calling Bifrost directly. Instead, an approved stake proposal is finalized on the vault contract, and the contract dispatches a cross-chain message through Hyperbridge.
>
> That dispatch is the functional integration point. Bifrost is the configured staking destination in the execution path."

**[OPTIONAL SCREEN: Show `_executeStake()` in contract]**

> "So the live architecture is: AI proposes, governance approves, and the contract is wired to dispatch the stake action cross-chain."

---

## CLOSE (5:00 – 5:20)

**[SCREEN: Back to landing page hero or dashboard overview]**

> "NeuroVault brings AI-assisted treasury management on-chain without removing governance control.
>
> The agent proposes. PAS stakers govern. The contract executes.
>
> Built on Polkadot Hub, with IPFS-backed proposal reasoning and a Hyperbridge-based cross-chain execution path."

---

## PRE-RECORDING CHECKLIST

- [ ] MetaMask connected to **Paseo testnet**
- [ ] Wallet has PAS test tokens
- [ ] Frontend running and loading `/app`
- [ ] Treasury metrics load successfully from the configured RPC/contract
- [ ] Bot console responds to `treasury status`
- [ ] Verify `suggest rebalance plan` returns a Gemini response before recording
- [ ] At least 1 recent or active proposal visible on `/app/vote`
- [ ] Wallet can sign a vote transaction on Paseo
- [ ] Wallet can sign a staking transaction on `/app/stake`
- [ ] Optional: editor or terminal ready to show the contract execution path

---

## KEY TALKING POINTS

| Claim | Accurate framing |
|---|---|
| AI agent creates proposals | The runtime agent generates recommendations and submits proposal transactions on-chain |
| Treasury is live | The dashboard reads treasury state from the configured contract and RPC |
| Governance protects the treasury | PAS stakers approve or reject AI-generated actions |
| IPFS is used | Proposal reasoning is referenced by IPFS hash |
| Hyperbridge is functional | Approved stake proposals can dispatch through Hyperbridge in the contract execution path |
| Bifrost is integrated | Bifrost is the configured staking destination in the cross-chain execution architecture, not a standalone live frontend integration |

---

## FALLBACK ONE-LINERS

- If Gemini fails: *"The Gemini advisory path is wired, but this deployment needs the correct API key available at runtime."*
- If there is no active proposal: *"The proposal list reflects recent on-chain governance activity; I’ll use that to show how the execution pipeline works."*
- If voting fails: *"The governance interaction is wired, but this wallet needs PAS testnet funds or allowance to complete the transaction."*
- If staking fails: *"The staking flow is connected to the vault contract, but this wallet needs the required token balance and allowance."*
- If asked whether Bifrost is directly visible in the UI: *"Not as a direct live Bifrost panel. Bifrost appears in the contract execution path behind Hyperbridge."*
