'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  walletAddress: string;
  subscription: string;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Check for authentication token
    const token = localStorage.getItem('token');
    if (token) {
      // In production, fetch user data from API
      setUser({
        id: 'demo-user',
        name: 'Demo User',
        email: 'demo@agentvault.ai',
        walletAddress: '0x742d35Cc6634C0532925a3b8D404d01A8dB9c0CF',
        subscription: 'premium'
      });
    }
  }, []);

  const navItems = [
    { href: '/', label: 'Home', requiresAuth: false },
    { href: '/dashboard', label: 'Dashboard', requiresAuth: true },
    { href: '/agents', label: 'My Agents', requiresAuth: true },
    { href: '/portfolio', label: 'Portfolio', requiresAuth: true },
    { href: '/marketplace', label: 'Marketplace', requiresAuth: false },
    { href: '/analytics', label: 'Analytics', requiresAuth: true },
    { href: '/payments', label: 'Payments', requiresAuth: true },
  ];

  const isActive = (href: string) => pathname === href;

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-b border-purple-500/20 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AV</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                AgentVault
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              if (item.requiresAuth && !user) return null;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-purple-600/50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="hidden md:flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-400 text-sm">Connected</span>
                </div>
                
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-2 bg-gray-800 rounded-lg px-3 py-2 text-sm"
                  >
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <span className="text-white hidden md:block">{user.name}</span>
                  </button>
                  
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-lg py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-700">
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                        <p className="text-purple-400 text-xs mt-1">
                          {user.subscription.toUpperCase()} Plan
                        </p>
                      </div>
                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-gray-300 hover:bg-gray-700"
                      >
                        Settings
                      </Link>
                      <Link
                        href="/billing"
                        className="block px-4 py-2 text-gray-300 hover:bg-gray-700"
                      >
                        Billing & Payments
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white p-2"
              aria-label="Toggle mobile menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-800 rounded-lg mt-2">
              {navItems.map((item) => {
                if (item.requiresAuth && !user) return null;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive(item.href)
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
} 