// Wagmi v2 + Viem config — Sepolia testnet only
import { createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [
    injected(), // MetaMask (and any other injected wallet)
  ],
  transports: {
    [sepolia.id]: http(), // Uses the default public Sepolia RPC
  },
})
