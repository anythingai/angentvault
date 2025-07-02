'use client';
/* eslint-disable jsx-a11y/aria-proptypes */
/* eslint-disable no-console */
import '@rainbow-me/rainbowkit/styles.css';
import { ReactNode } from 'react';
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

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is required – obtain one at cloud.walletconnect.com and expose it to the Next.js runtime.');
}

const connectors = connectorsForWallets(
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

const config = createConfig({
  connectors,
  chains,
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: true,
});

const queryClient = new QueryClient();

interface Props {
  children: ReactNode;
}

export default function WalletProvider({ children }: Props) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 