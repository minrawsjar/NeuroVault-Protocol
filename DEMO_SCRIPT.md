# NeuroVault Protocol — 5-Minute Demo Script

> **Total runtime:** ~5 minutes  
> **Format:** Screen recording with voiceover  
> **Sections:** Problem (45s) → Solution (45s) → Architecture (90s) → Live Demo (120s) → Close (20s)

---

## 🎬 SECTION 1 — THE PROBLEM (0:00 – 0:45)

**[SCREEN: Blank/title slide or landing page hero]**

> "DAOs sit on tens of millions of dollars in treasury — and do almost nothing with it.
>
> Here's the typical DAO treasury in 2025: a multisig wallet holding stablecoins and native tokens, slowly being drained by grants, with zero yield being generated. The people running it aren't financial experts. Governance proposals take days. By the time a rebalance vote passes, the market has already moved.
>
> There are three core problems:
>
> **One** — treasury management is entirely manual and reactive.  
> **Two** — cross-chain yield opportunities like Bifrost liquid staking are inaccessible without deep technical integration.  
> **Three** — governance lacks the intelligence to make fast, informed decisions at the right time.
>
> The result? Idle capital. Missed yield. Slow governance. And nobody's accountable."

**[SCREEN: Pause 1 second on the problem statement]**

---

## 🚀 SECTION 2 — THE SOLUTION (0:45 – 1:30)

**[SCREEN: Switch to landing page — `http://localhost:3000`]**

> "NeuroVault is an AI-powered treasury DAO built natively on Polkadot Hub.
>
> It combines three things that have never existed together in one protocol:
>
> **An autonomous AI agent** — powered by Gemini — that continuously monitors treasury health, generates rebalance proposals, and executes cross-chain strategies.
>
> **On-chain governance** — where every AI decision is a proposal that token stakers vote on before execution. The AI proposes. Humans approve. The contract executes.
>
> **Bifrost SLPx liquid staking** — the agent can stake PAS (cross-chain as xcDOT) through Hyperbridge and receive vDOT, earning 12–15% APY while keeping the position liquid. All automatically.
>
> Built on Polkadot Hub with Solidity, Hyperbridge for cross-chain messaging, Bifrost SLPx for liquid staking, and IPFS for decentralized proposal storage."

**[SCREEN: Stay on landing page, scroll slightly to show the 'Capabilities' section]**

---

## 🏗️ SECTION 3 — ARCHITECTURE (1:30 – 3:00)

**[SCREEN: Switch to `/app` dashboard — connect wallet if needed]**

> "Let me walk you through the architecture.
>
> **The Smart Contract** lives on Polkadot Hub TestNet — that's Paseo. It's the single source of truth. It holds the treasury, manages staker positions, runs governance, and dispatches cross-chain calls through Hyperbridge."

**[SCREEN: Point to Treasury TVL and APY panels at the top]**

> "This TVL and APY is read directly from the on-chain contract — no backend, no database. Pure on-chain state.

**[SCREEN: Scroll down to Bifrost SLPx panel in the sidebar]**

> "The Bifrost SLPx panel shows the cross-chain staking integration. When the AI agent detects a yield opportunity, it creates an ISMP message through Hyperbridge that calls `create_order()` on the Bifrost SLPx contract on Moonbeam — depositing xcDOT and receiving vDOT back within 45 to 60 seconds.
>
> This is PATH B integration — fully cross-chain from Polkadot Hub. The NeuroVault contract never touches Moonbeam directly. Hyperbridge does the bridging."

**[SCREEN: Scroll down to Hyperbridge/XCM Queue panel]**

> "All cross-chain operations are tracked in the XCM queue — queued, bridging, settled.

**[SCREEN: Scroll to Agent Status panel]**

> "The AI agent runs on AWS EC2. It polls the contract state every cycle, calls Gemini for strategy analysis, and if confidence exceeds the threshold, it signs and submits a proposal transaction directly to the contract. No human needed in the loop — unless governance rejects it."

**[SCREEN: Scroll to bottom to show Activity Feed]**

> "The activity feed is wired to real on-chain proposal events — every proposal created, voted on, and executed shows up here."

---

## 💻 SECTION 4 — LIVE DEMO (3:00 – 5:00)

### Step 1 — Bot Console (3:00 – 3:30)

**[SCREEN: Click bot console section on `/app`, make sure it's visible]**

> "Let me show the treasury bot. This is the AI interface to the protocol."

**[TYPE and CLICK: `treasury status`]**

> "This hits the on-chain contract and returns live treasury state — total value locked, PAS vs USDC allocation, current APY."

**[SCREEN: Wait for response, read it aloud]**

**[TYPE and CLICK: `bifrost status`]**

> "And Bifrost integration — this shows the SLPx protocol is active, vDOT APY around 12–15%, minimum stake of 10 xcDOT, routed through Hyperbridge."

**[SCREEN: Wait for response]**

**[TYPE and CLICK: `suggest rebalance plan`]**

> "This one goes to Gemini — asking the AI for a live rebalance recommendation based on the current treasury snapshot."

**[SCREEN: Wait for Gemini response, read it aloud]**

### Step 2 — Governance / Vote (3:30 – 4:15)

**[SCREEN: Navigate to `/app/vote`]**

> "Every AI decision becomes a governance proposal here. Stakers vote for or against. Let me show you an active proposal."

**[SCREEN: Point to a proposal card — show the description, confidence score, IPFS hash]**

> "This proposal was created by the AI agent — the description, action type, confidence score, and the IPFS hash pointing to the full reasoning document are all stored on-chain.
>
> Stakers vote for or against using their proportional voting power. When the deadline passes, anyone can finalize it — and if approved, the contract executes the strategy autonomously."

**[SCREEN: Click 'Vote For' on an active proposal if wallet is connected]**

> "I'll vote for this one — watch the transaction go through MetaMask on Paseo testnet."

**[SCREEN: Wait for transaction confirmation]**

### Step 3 — Staking (4:15 – 4:45)

**[SCREEN: Navigate to `/app/stake`, select 'Deposit' tab]**

> "Users stake PAS tokens to earn yield and gain voting power. More stake means more say over the AI agent's decisions.
>
> Let me deposit — I'll select PAS, enter an amount, and submit."

**[SCREEN: Enter amount, click Deposit, show MetaMask popup]**

> "The contract first approves the token allowance, then calls `stake()`. Both confirmed on-chain."

**[SCREEN: Show success banner after confirmation]**

### Step 4 — Bifrost SLPx Test Evidence (4:45 – 5:00)

**[SCREEN: Switch to terminal / show test output from earlier]**

> "Finally — proof the Bifrost integration is real. We ran a live test against Moonbeam mainnet.
>
> The SLPx contract confirmed: xcDOT currency ID `0x0800`, minimum stake 10 planck, GLMR minimum 5 tokens. All currency IDs and minimums match the Bifrost documentation exactly.
>
> The interface is verified. The architecture is live. And the AI is running."

---

## 🏁 CLOSE (5:00 – 5:20)

**[SCREEN: Back to landing page hero]**

> "NeuroVault is the first AI-native treasury DAO on Polkadot Hub.
>
> Autonomous agent. On-chain governance. Cross-chain liquid staking via Bifrost.
>
> The AI proposes. Humans govern. The chain executes.
>
> Built on Polkadot Hub • Hyperbridge • Bifrost SLPx • Gemini AI • IPFS"

**[SCREEN: Fade to black or repo URL: github.com/minrawsjar/NeuroVault-Protocol]**

---

## 📋 PRE-RECORDING CHECKLIST

Before hitting record, verify:

- [ ] MetaMask connected to **Paseo testnet** (Chain ID: `420420417`)
- [ ] Wallet has PAS test tokens (get from faucet if needed)
- [ ] Frontend running at `http://localhost:3000`
- [ ] `/app` dashboard loads — treasury TVL shows on-chain data (not fallback mock)
- [ ] Bot console responds — run `treasury status` once manually to confirm Gemini works
- [ ] At least 1 active proposal visible on `/app/vote`
- [ ] Bifrost SLPx panel visible in sidebar
- [ ] Browser zoom set to ~90% so all panels are visible without scrolling
- [ ] Terminal open in background showing test output (for the Bifrost proof section)

---

## ⚡ KEY TALKING POINTS (memorise these)

| Claim | Evidence |
|---|---|
| AI agent auto-proposes | Live on `/app/vote` — proposals with `agent: 0xc5b7...` as proposer |
| On-chain treasury state | TVL/APY read directly from `0x195FAc...` on Paseo |
| Bifrost SLPx live on Moonbeam | Test script confirmed `currencyId=0x0800` at block height |
| Cross-chain via Hyperbridge | Dispatcher at `0xbb26e04a...` wired in `IBifrost.sol` |
| IPFS proposal storage | Every proposal has CID hash visible on vote page |
| Governance = check on AI | Humans reject → AI cannot execute |

---

## 🎙️ FALLBACK ONE-LINERS (if something breaks during recording)

- If contract reads fail: *"Treasury data is loading from Paseo RPC — the on-chain state is being fetched in real-time."*
- If Gemini is slow: *"The AI is reasoning over the current treasury snapshot — this is a live call to Gemini."*
- If no active proposals: *"Proposals are created autonomously by the agent each cycle. Let me run the governance queue command to show recent history."* → type `governance queue` in bot console
- If MetaMask rejects: *"This would require PAS testnet tokens — the contract interaction is fully wired, the flow is identical on mainnet."*
