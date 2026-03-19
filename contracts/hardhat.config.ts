import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const DEPLOYER_PRIVATE_KEY =
  process.env.DEPLOYER_PRIVATE_KEY ||
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // hardhat default #0 (testnet only)

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
      // PolkaVM: avoid EVM-specific features
      evmVersion: "london", // avoid Shanghai (PUSH0 opcode)
    },
  },
  networks: {
    // Polkadot Hub TestNet (Paseo, chain ID 420420417)
    paseo: {
      url: process.env.PASEO_RPC_URL || "https://eth-rpc-testnet.polkadot.io/",
      chainId: 420420417,
      accounts: [DEPLOYER_PRIVATE_KEY],
      gasPrice: "auto",
    },
    // Local hardhat node for development
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // Polkadot Hub Mainnet (when ready)
    polkadotHub: {
      url: process.env.POLKADOT_HUB_RPC_URL || "https://asset-hub-polkadot-eth-rpc.polkadot.io",
      chainId: 420420420,
      accounts: [DEPLOYER_PRIVATE_KEY],
      gasPrice: "auto",
    },
    // Moonbeam Mainnet — for Bifrost SLPx testing
    moonbeam: {
      url: process.env.MOONBEAM_RPC_URL || "https://rpc.api.moonbeam.network",
      chainId: 1284,
      accounts: [DEPLOYER_PRIVATE_KEY],
      gasPrice: "auto",
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};

export default config;
