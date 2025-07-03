import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import dynamic from 'next/dynamic'

const inter = Inter({ subsets: ['latin'] })

// Lazy load wallet provider to avoid SSR issues
const WalletProvider = dynamic(() => import('./providers/WalletProvider'), { ssr: false })

export const metadata: Metadata = {
  title: 'AgentVault - Autonomous Crypto Investment Platform',
  description: 'AI-powered autonomous crypto investment platform with advanced agent technology',
  keywords: ['crypto', 'AI', 'autonomous', 'investment', 'DeFi', 'blockchain', 'x402pay', 'CDP', 'Bedrock', 'Akash'],
  authors: [{ name: 'AgentVault Team' }],
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
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
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      </head>
      <body className={`${inter.className} bg-gray-900 font-sans overflow-x-hidden`}>
        <WalletProvider>
          <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 text-white">
            <Navbar />
            {children}
          </div>
          <Footer />
        </WalletProvider>
      </body>
    </html>
  )
} 