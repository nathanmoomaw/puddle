import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from './crypto/config'
import '@rainbow-me/rainbowkit/styles.css'
import './index.css'
import AppShell from './AppShell.jsx'

// Clear wagmi + RainbowKit + Coinbase SDK persisted state before the provider mounts.
// Prevents the Coinbase Base Account auto-connect popup on page load.
// Keys: wagmi.store, rk-*, -walletlink:* (legacy WalletLink), -CBWSDK:* (SDK scoped storage)
// IDB:  'cbwsdk' database (Coinbase SDK KMS key storage)
Object.keys(localStorage)
  .filter(k =>
    k.startsWith('wagmi') ||
    k.startsWith('rk-') ||
    k.startsWith('-walletlink') ||
    k.startsWith('-CBWSDK')
  )
  .forEach(k => localStorage.removeItem(k))
try { indexedDB.deleteDatabase('cbwsdk') } catch (_) {}

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({ accentColor: '#e040fb' })}>
          <AppShell />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
