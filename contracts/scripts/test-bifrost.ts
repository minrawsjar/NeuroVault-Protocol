/**
 * test-bifrost.ts
 *
 * Tests Bifrost SLPx integration on Moonbeam mainnet.
 *
 * Phase 1 (read-only, free): Verify SLPx contract is live, query asset info
 * Phase 2 (optional write): Create a real stake order — requires GLMR/xcDOT balance
 *
 * Usage:
 *   npx hardhat run scripts/test-bifrost.ts --network moonbeam
 *
 * To also run Phase 2 (real tx): set BIFROST_TEST_STAKE=true in env
 */

import { ethers } from "hardhat";

const SLPX_ADDRESS   = "0xF1d4797E51a4640a76769A50b57abE7479ADd3d8";
const XCDOT_ADDRESS  = "0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080";
const XCASTR_ADDRESS = "0xFfFFFfffA893AD19e540E172C10d78D4d479B5Cf";
const GLMR_ADDRESS   = "0x0000000000000000000000000000000000000802";

const SLPX_ABI = [
  "function addressToAssetInfo(address assetAddress) external view returns (bytes2 currencyId, uint256 operationalMin)",
  "function create_order(address assetAddress, uint128 amount, uint64 dest_chain_id, bytes memory receiver, string memory remark, uint32 channel_id) external payable",
];

const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
  "function approve(address spender, uint256 amount) external returns (bool)",
];

async function main() {
  const [signer] = await ethers.getSigners();
  const provider = ethers.provider;

  console.log("\n======================================================");
  console.log("  Bifrost SLPx Integration Test — Moonbeam Mainnet");
  console.log("======================================================");
  console.log(`Signer:  ${signer.address}`);
  console.log(`Network: Moonbeam (chain ${(await provider.getNetwork()).chainId})`);

  const glmrBalance = await provider.getBalance(signer.address);
  console.log(`GLMR Balance: ${ethers.formatEther(glmrBalance)} GLMR\n`);

  // ─── Phase 1: Read-only checks (free, no tx) ─────────────────────────────

  console.log("── Phase 1: Read-Only SLPx Checks ──────────────────────");

  const slpx = new ethers.Contract(SLPX_ADDRESS, SLPX_ABI, provider);

  const tokens = [
    { name: "xcDOT",  address: XCDOT_ADDRESS  },
    { name: "xcASTR", address: XCASTR_ADDRESS },
    { name: "GLMR",   address: GLMR_ADDRESS   },
  ];

  for (const token of tokens) {
    try {
      const [currencyId, operationalMin] = await slpx.addressToAssetInfo(token.address);
      console.log(`✅ ${token.name.padEnd(7)} currencyId=${currencyId}  operationalMin=${operationalMin.toString()}`);
    } catch (e: any) {
      console.log(`❌ ${token.name.padEnd(7)} query failed: ${e.message}`);
    }
  }

  // Check xcDOT balance
  try {
    const xcDot = new ethers.Contract(XCDOT_ADDRESS, ERC20_ABI, provider);
    const [symbol, decimals, balance] = await Promise.all([
      xcDot.symbol(),
      xcDot.decimals(),
      xcDot.balanceOf(signer.address),
    ]);
    console.log(`\n${symbol} balance: ${ethers.formatUnits(balance, decimals)} ${symbol}`);
  } catch (e: any) {
    console.log(`\nxcDOT balance check failed: ${e.message}`);
  }

  // ─── Phase 2: Write (stake order) ────────────────────────────────────────

  const runStake = process.env.BIFROST_TEST_STAKE === "true";

  if (!runStake) {
    console.log("\n── Phase 2: Stake Order (SKIPPED) ──────────────────────");
    console.log("   Set BIFROST_TEST_STAKE=true to run a real stake tx.");
    console.log("   Requires GLMR balance (min 5 GLMR) in signer wallet.");
  } else {
    console.log("\n── Phase 2: Stake Order (GLMR → vGLMR) ─────────────────");

    const STAKE_AMOUNT = ethers.parseEther("5"); // 5 GLMR (minimum)

    if (glmrBalance < STAKE_AMOUNT + ethers.parseEther("0.1")) {
      console.log(`❌ Insufficient GLMR. Need at least 5.1 GLMR, have ${ethers.formatEther(glmrBalance)}`);
      return;
    }

    const receiverBytes = ethers.zeroPadValue(signer.address, 20);

    console.log(`   Staking ${ethers.formatEther(STAKE_AMOUNT)} GLMR via SLPx...`);
    console.log(`   Receiver: ${signer.address}`);
    console.log(`   Remark: "NeuroVault"`);

    try {
      const slpxSigner = new ethers.Contract(SLPX_ADDRESS, SLPX_ABI, signer);
      const tx = await slpxSigner.create_order(
        GLMR_ADDRESS,          // asset: GLMR native
        STAKE_AMOUNT,          // amount: 5 GLMR
        1284n,                 // dest_chain_id: Moonbeam
        receiverBytes,         // receiver: our address
        "NeuroVault",          // remark
        0,                     // channel_id: no RSP
        { value: STAKE_AMOUNT }
      );

      console.log(`   TX submitted: ${tx.hash}`);
      console.log("   Waiting for confirmation...");
      const receipt = await tx.wait();
      console.log(`✅ Confirmed in block ${receipt?.blockNumber}`);
      console.log("   Wait ~45-60 seconds → vGLMR will arrive in your wallet.");
    } catch (e: any) {
      console.log(`❌ Stake failed: ${e.message}`);
    }
  }

  console.log("\n======================================================\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
