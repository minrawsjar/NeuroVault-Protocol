// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IBifrost
 * @notice Interface definitions for interacting with Bifrost vToken liquid staking.
 * @dev Bifrost uses the SLPx protocol for cross-chain liquid staking. There are two
 *      integration paths:
 *
 *      PATH A — Direct SLPx (on Moonbeam/Ethereum/Arbitrum/etc.)
 *        Call MoonbeamSlpx.create_order() directly from an EVM chain where SLPx is deployed.
 *        Wait ~45-60 seconds for vToken delivery. Does NOT support atomic contract calls.
 *        Contract address (Moonbeam): 0xF1d4797E51a4640a76769A50b57abE7479ADd3d8
 *
 *      PATH B — Hyperbridge cross-chain (from Polkadot Hub)
 *        NeuroVault encodes a BifrostStakeCall and dispatches it via Hyperbridge ISMP
 *        to Bifrost's parachain. Used when calling from chains without SLPx deployment.
 *
 *      vDOT is Bifrost's liquid staking derivative for DOT.
 *      Users deposit DOT → receive vDOT → earn staking yield (~12-15% APY)
 *      → redeem vDOT for DOT + yield. vDOT remains transferable (liquid).
 *
 * @custom:docs https://docs.bifrost.io
 */

// ─────────────────────────────────────────────────────────────────────────────
// PATH A: Bifrost SLPx Protocol (Direct EVM Integration)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @title ISLPx
 * @notice Interface for Bifrost SLPx (Superfluid Liquid Staking via XCM) protocol.
 *         Deployed on Moonbeam, Ethereum, Arbitrum, Base, BNB Chain, Manta, Soneium.
 *
 * @dev IMPORTANT: create_order() does NOT support atomic contract calls.
 *      vAsset tokens arrive ~45-60 seconds after tx confirmation.
 *      You can call from frontend (Wagmi) or from a contract at the END of its logic.
 *
 *      Moonbeam SLPx: 0xF1d4797E51a4640a76769A50b57abE7479ADd3d8
 */
interface ISLPx {
    /**
     * @notice Get asset info for a given token address.
     * @param assetAddress The EVM token address on the deployment chain.
     * @return currencyId  Bifrost currency ID (2 bytes, e.g. 0x0800 for xcDOT)
     * @return operationalMin Minimum amount required for the operation
     */
    function addressToAssetInfo(address assetAddress)
        external
        view
        returns (bytes2 currencyId, uint256 operationalMin);

    /**
     * @notice Create an order to mint vAsset (stake) or redeem vAsset (unstake).
     * @dev For ERC20 tokens: caller must approve SLPx contract first.
     *      For native tokens (GLMR): send amount as msg.value.
     *
     * @param assetAddress  Token address to stake or its vToken to redeem
     * @param amount        Amount of tokens to mint/redeem
     * @param dest_chain_id Chain ID where the vAsset should be delivered
     * @param receiver      Receiver address on dest chain (20 bytes for EVM, 32 for Substrate)
     * @param remark        Order identifier string (< 32 bytes, e.g. "NeuroVault")
     * @param channel_id    Revenue Sharing Program channel ID (0 if none)
     */
    function create_order(
        address assetAddress,
        uint128 amount,
        uint64 dest_chain_id,
        bytes memory receiver,
        string memory remark,
        uint32 channel_id
    ) external payable;
}

/**
 * @title BifrostSLPxTokens
 * @notice Known token addresses and asset info for Bifrost SLPx on Moonbeam.
 * @dev These are the real contract addresses from Bifrost documentation.
 */
library BifrostSLPxTokens {
    // ── Moonbeam Token Addresses ──
    address constant XCDOT  = 0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080;
    address constant XCASTR = 0xFfFFFfffA893AD19e540E172C10d78D4d479B5Cf;
    address constant GLMR   = 0x0000000000000000000000000000000000000802;

    // ── Moonbeam SLPx Contract ──
    address constant MOONBEAM_SLPX = 0xF1d4797E51a4640a76769A50b57abE7479ADd3d8;

    // ── Moonbeam Chain ID ──
    uint64 constant MOONBEAM_CHAIN_ID = 1284;

    // ── Currency IDs (Bifrost internal) ──
    bytes2 constant CURRENCY_XCDOT  = 0x0800;
    bytes2 constant CURRENCY_GLMR   = 0x0801;
    bytes2 constant CURRENCY_XCASTR = 0x0803;

    // ── Operational Minimums ──
    uint256 constant MIN_XCDOT  = 10_000_000_000;              // 10^10 (10 DOT planck)
    uint256 constant MIN_GLMR   = 5_000_000_000_000_000_000;   // 5 GLMR (18 dec)
    uint256 constant MIN_XCASTR = 5_000_000_000_000_000_000;   // 5 ASTR (18 dec)
}

// ─────────────────────────────────────────────────────────────────────────────
// PATH B: Hyperbridge Cross-Chain Encoding (from Polkadot Hub)
// ─────────────────────────────────────────────────────────────────────────────

/// @notice Action types that can be sent to Bifrost via Hyperbridge
enum BifrostAction {
    Stake,      // Deposit DOT, receive vDOT
    Unstake,    // Burn vDOT, queue DOT redemption
    Redeem      // Claim redeemed DOT after unbonding period
}

/// @notice ABI-encoded body for Hyperbridge POST to Bifrost
struct BifrostStakeCall {
    /// The action to perform
    BifrostAction action;
    /// Amount of DOT to stake (in planck: 1 DOT = 10^10 planck)
    uint256 amount;
    /// The EVM address on Polkadot Hub to receive vDOT or returned DOT
    address recipient;
    /// Nonce for idempotency
    uint256 nonce;
}

/**
 * @title IBifrostVToken
 * @notice ERC20-compatible interface for vDOT if it is bridged back to Polkadot Hub EVM.
 *         Used to read vDOT balance and approve transfers on the Hub side.
 */
interface IBifrostVToken {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function totalSupply() external view returns (uint256);

    /// @notice Current exchange rate: how many DOT per 1 vDOT (scaled by 1e18)
    function getExchangeRate() external view returns (uint256);
}

/**
 * @title BifrostCallEncoder
 * @notice Helper library to encode calls for Hyperbridge dispatch body.
 */
library BifrostCallEncoder {
    /// @notice Encode a stake call for the Hyperbridge POST body
    function encodeStake(uint256 amount, address recipient, uint256 nonce)
        internal
        pure
        returns (bytes memory)
    {
        return abi.encode(BifrostStakeCall({
            action: BifrostAction.Stake,
            amount: amount,
            recipient: recipient,
            nonce: nonce
        }));
    }

    /// @notice Encode an unstake call for the Hyperbridge POST body
    function encodeUnstake(uint256 amount, address recipient, uint256 nonce)
        internal
        pure
        returns (bytes memory)
    {
        return abi.encode(BifrostStakeCall({
            action: BifrostAction.Unstake,
            amount: amount,
            recipient: recipient,
            nonce: nonce
        }));
    }

    /// @notice Encode a redeem call for the Hyperbridge POST body
    function encodeRedeem(uint256 amount, address recipient, uint256 nonce)
        internal
        pure
        returns (bytes memory)
    {
        return abi.encode(BifrostStakeCall({
            action: BifrostAction.Redeem,
            amount: amount,
            recipient: recipient,
            nonce: nonce
        }));
    }
}
