import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import {
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { base, baseSepolia } from 'wagmi/chains'

// WalletConnect project ID from cloud.walletconnect.com
// Using placeholder — WalletConnect QR pairing won't work but injected wallets (MetaMask etc.) will.
// Replace with a real project ID for production WalletConnect support.
const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'placeholder'

// RibbonPuddle ERC-721 contract (deployed on Base mainnet).
// Set VITE_PUDDLE_CONTRACT_ADDRESS in .env after deploying contracts/RibbonPuddle.sol.
// Until set, mint buttons are disabled but the UI is otherwise fully functional.
export const PUDDLE_CONTRACT_ADDRESS = import.meta.env.VITE_PUDDLE_CONTRACT_ADDRESS || undefined

// Pinata IPFS pinning (optional — enables marketplace-compatible NFT metadata).
// Set VITE_PINATA_JWT in .env with a Pinata API JWT.
// Without it, minting still works; tokenURI will be empty until updated separately.
export const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || undefined

// Use Base Sepolia for local dev when VITE_USE_TESTNET=true, mainnet Base otherwise.
const chains = import.meta.env.VITE_USE_TESTNET === 'true'
  ? [baseSepolia, base]
  : [base]

// Explicit wallet list — excludes both baseAccount and coinbaseWallet because both load the
// Coinbase SDK which detects a stored Smart Wallet session and auto-pops a "continue in Base
// Account" window on every page load. Coinbase extension users are covered by injectedWallet.
const wallets = [
  {
    groupName: 'Popular',
    wallets: [
      metaMaskWallet,
      injectedWallet,
      walletConnectWallet,
      rainbowWallet,
    ],
  },
]

export const wagmiConfig = getDefaultConfig({
  appName: 'Puddle',
  projectId: WALLETCONNECT_PROJECT_ID,
  wallets,
  chains,
  ssr: false,
  reconnectOnMount: false,
})
