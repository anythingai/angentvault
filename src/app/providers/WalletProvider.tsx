import '@rainbow-me/rainbowkit/styles.css';
import { ReactNode } from 'react';
import {
  RainbowKitProvider,
  darkTheme,
  getDefaultConfig,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider, http } from 'wagmi';
import { base, baseSepolia, type Chain } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Toggle testnet support via env
const enableTestnet = process.env.NEXT_PUBLIC_ENABLE_TESTNET === 'true';
const chains: readonly [Chain, ...Chain[]] = enableTestnet ? [baseSepolia, base] : [base];

const config = getDefaultConfig({
  appName: 'AgentVault',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo',
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
        <RainbowKitProvider theme={darkTheme()}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 