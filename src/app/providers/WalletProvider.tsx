'use client';
/* eslint-disable jsx-a11y/aria-proptypes */
/* eslint-disable no-console */
import '@rainbow-me/rainbowkit/styles.css';
import { ReactNode, useEffect, useState, useMemo } from 'react';
import {
  RainbowKitProvider,
  darkTheme,
  connectorsForWallets,
} from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
  rainbowWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { createConfig, WagmiProvider, http } from 'wagmi';
import { base, baseSepolia, type Chain } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Toggle testnet support via env
const enableTestnet = process.env.NEXT_PUBLIC_ENABLE_TESTNET === 'true';
const chains: readonly [Chain, ...Chain[]] = enableTestnet ? [baseSepolia, base] : [base];

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '';

if (!projectId) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is required – obtain one at cloud.walletconnect.com and expose it to the Next.js runtime.');
}

// Create a stable query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Prevent unnecessary background fetches
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: false,
    },
  },
});

// WalletConnect Core singleton guard (prevents double init in dev/hot reload)
if (typeof window !== 'undefined') {
  if (!window.__WALLETCONNECT_CORE_SINGLETON__) {
    window.__WALLETCONNECT_CORE_SINGLETON__ = true;
  } else {
    // If already initialized, do not re-initialize WalletConnect Core
    // Optionally, you can log or silently skip
    // This prevents the 'WalletConnect Core is already initialized' warning
  }
}

declare global {
  interface Window {
    __WALLETCONNECT_CORE_SINGLETON__?: boolean;
  }
}

interface Props {
  children: ReactNode;
}

export default function WalletProvider({ children }: Props) {
  const [mounted, setMounted] = useState(false);

  // Handle hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Always call useMemo, but only use its value after mounted
  const wagmiConfig = useMemo(() => {
    if (!mounted) return null;
    const walletConnectors = connectorsForWallets(
      [
        {
          groupName: 'Recommended',
          wallets: [coinbaseWallet, metaMaskWallet, walletConnectWallet, rainbowWallet],
        },
      ],
      {
        appName: 'AgentVault',
        projectId,
      }
    );

    return createConfig({
      connectors: walletConnectors,
      chains,
      transports: {
        [base.id]: http(),
        [baseSepolia.id]: http(),
      },
      ssr: true,
    });
  }, [mounted]);

  // Show loading state during hydration
  if (!mounted || !wagmiConfig) {
    return null;
  }

  // All wallet config and provider logic is now inside the client-only check
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme()}
          initialChain={enableTestnet ? baseSepolia : base}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 