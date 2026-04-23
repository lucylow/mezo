import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
      evmVersion: "cancun",
    },
  },
  networks: {
    hardhat: { chainId: 31337 },
    mezoTestnet: {
      url: process.env.MEZO_RPC_URL || "https://rpc.test.mezo.org",
      chainId: 31611,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
    },
    mezoMainnet: {
      url: "https://rpc.mezo.org",
      chainId: 31612,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
    },
  },
  etherscan: {
    apiKey: {
      mezoTestnet: "not-needed",
      mezoMainnet: "not-needed",
    },
    customChains: [
      {
        network: "mezoTestnet",
        chainId: 31611,
        urls: {
          apiURL: "https://explorer.test.mezo.org/api",
          browserURL: "https://explorer.test.mezo.org",
        },
      },
      {
        network: "mezoMainnet",
        chainId: 31612,
        urls: {
          apiURL: "https://explorer.mezo.org/api",
          browserURL: "https://explorer.mezo.org",
        },
      },
    ],
  },
};

export default config;
