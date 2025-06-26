import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from './components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AgentVault - Autonomous Crypto Investment Platform',
  description: 'AI-powered autonomous cryptocurrency investment agents with x402pay monetization, CDP Wallet integration, Amazon Bedrock Nova AI, and Akash Network deployment - Built for Coinbase Agents in Action Hackathon',
  keywords: ['crypto', 'AI', 'autonomous', 'investment', 'DeFi', 'blockchain', 'x402pay', 'CDP', 'Bedrock', 'Akash'],
  authors: [{ name: 'AgentVault Team' }],
  openGraph: {
    title: 'AgentVault - Autonomous Crypto Investment Platform',
    description: 'AI-powered autonomous cryptocurrency investment agents',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgentVault',
    description: 'Autonomous Crypto Investment Agents',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900`}>
        <Navbar />
        <main className="min-h-screen">
        {children}
        </main>
      </body>
    </html>
  )
} 