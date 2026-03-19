// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IBifrost
 * @notice Interface definitions for interacting with Bifrost vDOT liquid staking.
 * @dev Bifrost lives on its own parachain. NeuroVault sends XCM messages via Hyperbridge
 *      to call these functions cross-chain. These interfaces define what the Hyperbridge
 *      body payload encodes — they are NOT called directly via EVM call().
 *
 *      When NeuroVault wants to stake DOT on Bifrost:
 *      1. Vault encodes a BifrostStakeCall using abi.encode()
 *      2. Vault dispatches a Hyperbridge POST request with that encoded body
 *      3. Bifrost's ISMP module decodes and executes the call
 *
 *      vDOT is Bifrost's liquid staking derivative for DOT.
 *      Users deposit DOT → receive vDOT → earn staking yield → redeem vDOT for DOT + yield.
 */

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
}
