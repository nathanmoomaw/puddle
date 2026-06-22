import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from './crypto/config'
import '@rainbow-me/rainbowkit/styles.css'
import './index.css'
import AppShell from './AppShell.jsx'

// Clear wallet SDK persisted state before providers mount.
// Prevents Coinbase/WalletConnect auto-connect popups on page load.
Object.keys(localStorage)
  .filter(k =>
    k.startsWith('wagmi') ||
    k.startsWith('rk-') ||
    k.startsWith('-walletlink') ||
    k.startsWith('-CBWSDK') ||
    k.startsWith('wc@2:')
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
