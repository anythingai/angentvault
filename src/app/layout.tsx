import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AgentVault - Autonomous Crypto Investment Platform',
  description: 'AI-powered autonomous cryptocurrency investment agents - Built for Coinbase Agents in Action Hackathon',
  keywords: ['crypto', 'AI', 'autonomous', 'investment', 'DeFi', 'blockchain'],
  authors: [{ name: 'AgentVault Team' }],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const themeColor = '#3b82f6';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen`}>
        {children}
      </body>
    </html>
  )
} 