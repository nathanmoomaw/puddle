import '@nomicfoundation/hardhat-toolbox'
import { config as dotenv } from 'dotenv'

dotenv()

const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY

/** @type {import('hardhat/config').HardhatUserConfig} */
export default {
  solidity: {
    version: '0.8.28',
    settings: {
      evmVersion: 'cancun',
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    base: {
      url: 'https://mainnet.base.org',
      accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : [],
      chainId: 8453,
    },
    'base-sepolia': {
      url: 'https://sepolia.base.org',
      accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : [],
      chainId: 84532,
    },
  },
}
