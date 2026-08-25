import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import { wagmiConfig } from './config/wagmi.js'
import { NotificationProvider } from './context/NotificationContext.jsx'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
)
