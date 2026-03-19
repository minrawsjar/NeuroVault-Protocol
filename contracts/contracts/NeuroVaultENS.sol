// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NeuroVaultENS
 * @notice On-chain name registry for NeuroVault agents and services.
 *         Maps human-readable names (e.g. "neurovault.eth") to addresses
 *         and stores metadata (role, description, endpoint URL).
 *
 * This is a lightweight ENS-style registry purpose-built for NeuroVault.
 * Names are bytes32 (keccak256 of the string name) for gas efficiency.
 */
contract NeuroVaultENS is Ownable {

    struct Record {
        address addr;
        string name;         // Human-readable name, e.g. "neurovault.eth"
        string role;         // e.g. "agent", "treasury", "staker"
        string description;  // Short description
        string endpoint;     // API endpoint URL (for agents)
        uint256 registeredAt;
        bool active;
    }

    /// @notice name hash => record
    mapping(bytes32 => Record) public records;

    /// @notice address => name hash (reverse lookup)
    mapping(address => bytes32) public reverseRecords;

    /// @notice All registered name hashes (for enumeration)
    bytes32[] public registeredNames;

    event NameRegistered(bytes32 indexed nameHash, string name, address indexed addr, string role);
    event NameUpdated(bytes32 indexed nameHash, address indexed addr);
    event NameDeactivated(bytes32 indexed nameHash);

    constructor() Ownable(msg.sender) {}

    /// @notice Register a new name. Only owner can register.
    function register(
        string calldata name,
        address addr,
        string calldata role,
        string calldata description,
        string calldata endpoint
    ) external onlyOwner {
        bytes32 nameHash = keccak256(bytes(name));
        require(!records[nameHash].active, "NeuroVaultENS: name already registered");
        require(addr != address(0), "NeuroVaultENS: zero address");

        records[nameHash] = Record({
            addr: addr,
            name: name,
            role: role,
            description: description,
            endpoint: endpoint,
            registeredAt: block.timestamp,
            active: true
        });

        reverseRecords[addr] = nameHash;
        registeredNames.push(nameHash);

        emit NameRegistered(nameHash, name, addr, role);
    }

    /// @notice Update the address for an existing name
    function updateAddress(string calldata name, address newAddr) external onlyOwner {
        bytes32 nameHash = keccak256(bytes(name));
        require(records[nameHash].active, "NeuroVaultENS: name not found");

        address oldAddr = records[nameHash].addr;
        delete reverseRecords[oldAddr];

        records[nameHash].addr = newAddr;
        reverseRecords[newAddr] = nameHash;

        emit NameUpdated(nameHash, newAddr);
    }

    /// @notice Deactivate a name
    function deactivate(string calldata name) external onlyOwner {
        bytes32 nameHash = keccak256(bytes(name));
        require(records[nameHash].active, "NeuroVaultENS: name not found");
        records[nameHash].active = false;
        emit NameDeactivated(nameHash);
    }

    /// @notice Resolve a name to an address
    function resolve(string calldata name) external view returns (address) {
        bytes32 nameHash = keccak256(bytes(name));
        Record storage r = records[nameHash];
        require(r.active, "NeuroVaultENS: name not found");
        return r.addr;
    }

    /// @notice Reverse resolve: address to name
    function reverseName(address addr) external view returns (string memory) {
        bytes32 nameHash = reverseRecords[addr];
        require(records[nameHash].active, "NeuroVaultENS: no name for address");
        return records[nameHash].name;
    }

    /// @notice Get full record for a name
    function getRecord(string calldata name) external view returns (Record memory) {
        bytes32 nameHash = keccak256(bytes(name));
        require(records[nameHash].active, "NeuroVaultENS: name not found");
        return records[nameHash];
    }

    /// @notice Get total number of registered names
    function totalNames() external view returns (uint256) {
        return registeredNames.length;
    }

    /// @notice Get all active records (for frontend display)
    function getAllActiveRecords() external view returns (Record[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < registeredNames.length; i++) {
            if (records[registeredNames[i]].active) count++;
        }

        Record[] memory active = new Record[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < registeredNames.length; i++) {
            if (records[registeredNames[i]].active) {
                active[idx] = records[registeredNames[i]];
                idx++;
            }
        }
        return active;
    }
}
