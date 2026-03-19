// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IHyperbridge
 * @notice Real Hyperbridge ISMP interfaces for cross-chain dispatch from Polkadot Hub.
 * @dev Based on the Hyperbridge ISMP spec: https://docs.hyperbridge.network
 *      IIsmpDispatch is the entry point for sending cross-chain requests.
 *      The host contract on Polkadot Hub implements this interface.
 */

/// @notice A POST request to be dispatched cross-chain via Hyperbridge
struct DispatchPost {
    /// Destination state machine identifier (e.g. "POLKADOT-1000" for Bifrost parachain 1000)
    bytes dest;
    /// The address of the receiving module on the destination chain
    bytes to;
    /// ABI-encoded call data for the receiving module
    bytes body;
    /// Timeout in seconds from the current timestamp (0 = no timeout)
    uint64 timeout;
    /// The native token fee paid to relayers; must be approved to the dispatcher
    uint256 fee;
    /// Address to refund fees if the request times out
    address payer;
}

/// @notice A GET request to read state from a remote chain
struct DispatchGet {
    /// Source state machine for the response
    bytes dest;
    /// Block height at which to read state
    uint64 height;
    /// List of storage keys to read
    bytes[] keys;
    /// Timeout in seconds (0 = no timeout)
    uint64 timeout;
    /// Relayer fee
    uint256 fee;
    /// Fee payer / refund address
    address payer;
}

/// @notice Returned commitment for a dispatched request
struct DispatchResponse {
    /// The unique commitment hash of the request
    bytes32 commitment;
}

/**
 * @title IIsmpDispatch
 * @notice Interface implemented by the Hyperbridge host contract on Polkadot Hub EVM.
 *         Call dispatch() to send a cross-chain POST request to any parachain.
 */
interface IIsmpDispatch {
    /**
     * @notice Dispatch a cross-chain POST request via Hyperbridge.
     * @param request The post request parameters.
     * @return response The commitment hash identifying this request on-chain.
     */
    function dispatch(DispatchPost memory request)
        external
        payable
        returns (DispatchResponse memory response);

    /**
     * @notice Dispatch a cross-chain GET request to read remote state.
     * @param request The get request parameters.
     * @return response The commitment hash.
     */
    function dispatch(DispatchGet memory request)
        external
        payable
        returns (DispatchResponse memory response);

    /**
     * @notice Calculate the fee required to dispatch a POST request.
     * @param request The post request (fee field ignored).
     * @return fee The required fee in the native token.
     */
    function quote(DispatchPost memory request) external view returns (uint256 fee);

    /**
     * @notice Calculate the fee required to dispatch a GET request.
     * @param request The get request (fee field ignored).
     * @return fee The required fee in the native token.
     */
    function quote(DispatchGet memory request) external view returns (uint256 fee);
}

/**
 * @title IIsmpModule
 * @notice Implement this on any contract that wants to RECEIVE cross-chain messages.
 *         NeuroVault does not need this unless it wants to receive responses from Bifrost.
 */
interface IIsmpModule {
    /**
     * @notice Called by the Hyperbridge host when an inbound POST request arrives.
     */
    function onAccept(PostRequest memory request) external;

    /**
     * @notice Called by the Hyperbridge host when a response to our GET request arrives.
     */
    function onGetResponse(GetResponse memory response) external;

    /**
     * @notice Called if a dispatched request times out before being processed.
     */
    function onPostRequestTimeout(PostRequest memory request) external;
}

/// @notice Inbound POST request (received by IIsmpModule)
struct PostRequest {
    bytes source;
    bytes dest;
    uint64 nonce;
    bytes from;
    bytes to;
    uint64 timeoutTimestamp;
    bytes body;
}

/// @notice Response to a GET request
struct GetResponse {
    bytes source;
    bytes dest;
    uint64 nonce;
    uint64 height;
    bytes[] keys;
    bytes[] values;
    uint64 timeoutTimestamp;
}
