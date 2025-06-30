'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  const navItems = [
    { href: '/', label: 'Home', requiresAuth: false, icon: '🏠' },
    { href: '/dashboard', label: 'Dashboard', requiresAuth: true, icon: '📊' },
    { href: '/agents', label: 'My Agents', requiresAuth: true, icon: '🤖' },
    { href: '/portfolio', label: 'Portfolio', requiresAuth: true, icon: '💼' },
    { href: '/marketplace', label: 'Marketplace', requiresAuth: false, icon: '🏪' },
    { href: '/analytics', label: 'Analytics', requiresAuth: true, icon: '📈' },
    { href: '/payments', label: 'Payments', requiresAuth: true, icon: '💳' },
  ];

  const isActive = (href: string) => pathname === href;

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsUserMenuOpen(false);
    window.location.href = '/';
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsUserMenuOpen(false); // Close user menu when opening mobile menu
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
    setIsMobileMenuOpen(false); // Close mobile menu when opening user menu
  };

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-b border-purple-500/20 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <span className="text-white font-bold text-sm">AV</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                AgentVault
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              if (item.requiresAuth && !user) return null;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                    isActive(item.href)
                      ? 'nav-link-active bg-purple-600/20 text-purple-400'
                      : 'text-gray-300 hover:text-white hover:bg-purple-600/10'
                  }`}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu & Mobile Controls */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                {/* Connection Status - Desktop Only */}
                <div className="hidden md:flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm font-medium">Connected</span>
                </div>
                
                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={toggleUserMenu}
                    className="flex items-center space-x-2 bg-gray-800/80 hover:bg-gray-700/80 rounded-lg px-3 py-2 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    aria-expanded={isUserMenuOpen ? 'true' : 'false'}
                    aria-haspopup="true"
                    aria-label="Open user menu"
                  >
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <span className="text-white hidden sm:block">{user.name}</span>
                    <svg 
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700/50 py-2 z-50 animate-slide-up">
                      <div className="px-4 py-3 border-b border-gray-700/50">
                        <p className="text-white font-semibold">{user.name}</p>
                        <p className="text-gray-400 text-sm truncate">{user.email}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-purple-400 text-xs font-medium bg-purple-600/20 px-2 py-1 rounded-full">
                            {user.subscription.toUpperCase()} PLAN
                          </span>
                          <div className="flex items-center space-x-1">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                            <span className="text-green-400 text-xs">Online</span>
                          </div>
                        </div>
                      </div>
                      <Link
                        href="/settings"
                        className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors duration-200"
                      >
                        <span>⚙️</span>
                        <span>Settings</span>
                      </Link>
                      <Link
                        href="/billing"
                        className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors duration-200"
                      >
                        <span>💳</span>
                        <span>Billing & Payments</span>
                      </Link>
                      <div className="border-t border-gray-700/50 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-red-400 hover:bg-red-600/10 hover:text-red-300 transition-colors duration-200"
                        >
                          <span>🚪</span>
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hidden sm:block"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="btn-primary text-sm px-4 py-2"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-expanded={isMobileMenuOpen ? 'true' : 'false'}
              aria-label="Toggle mobile menu"
            >
              <svg 
                className={`h-6 w-6 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-90' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden" ref={mobileMenuRef}>
            <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-800/80 backdrop-blur-sm rounded-xl mt-2 border border-gray-700/50 animate-slide-up">
              {/* Auth Status for Mobile */}
              {user && (
                <div className="flex items-center justify-between px-3 py-2 bg-gray-700/50 rounded-lg mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-sm">Connected</span>
                  </div>
                  <span className="text-purple-400 text-xs">{user.subscription.toUpperCase()}</span>
                </div>
              )}

              {/* Navigation Links */}
              {navItems.map((item) => {
                if (item.requiresAuth && !user) return null;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Mobile Auth Buttons */}
              {!user && (
                <div className="pt-2 space-y-2">
                  <Link
                    href="/login"
                    className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="block btn-primary text-center"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
} 