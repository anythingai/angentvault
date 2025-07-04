'use client';
/* eslint-disable jsx-a11y/aria-proptypes */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import useAuth from '../hooks/useAuth';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { deleteCookie } from 'cookies-next';
import { FaUser } from 'react-icons/fa';

const authNav = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Agents', href: '/agents' },
  { name: 'Marketplace', href: '/marketplace' },
  { name: 'Analytics', href: '/analytics' },
];

const publicNav = [
  { name: 'Home', href: '/' },
  { name: 'Marketplace', href: '/marketplace' },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { login, isConnected, isAuthenticated, logout } = useAuth();
  const rawPath = usePathname();
  const pathname = rawPath || '/';
  const router = useRouter();

  const navigation = isAuthenticated ? authNav : publicNav;

  useEffect(() => {
    if (isConnected) {
      login();
    }
  }, [isConnected, login]);

  // Scroll detection for navbar background effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    deleteCookie('auth-token');
    logout();
    router.push('/');
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-slate-900/80 backdrop-blur-lg shadow-lg' 
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-6 py-6 flex justify-between items-center">
      <div className="flex items-center">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
          <defs>
            <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A855F7" stopOpacity="1" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path d="M6 2.75L16 1L26 2.75V12C26 19.16 20.44 24.93 16 26.5C11.56 24.93 6 19.16 6 12V2.75Z" fill="url(#logo-gradient)" stroke="#FFF" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M12 18L16 14L20 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 14V8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <Link href="/" className="text-xl font-bold text-white">AgentVault</Link>
      </div>
      
      <nav className="hidden md:flex items-center space-x-8">
        {navigation.map((item) => (
          <Link 
            key={item.name} 
            href={item.href} 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              item.name === 'Home'
                ? 'text-white hover:bg-white hover:bg-opacity-10'
                : (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href))
                  ? 'bg-white bg-opacity-10 text-white'
                  : 'text-white hover:bg-white hover:bg-opacity-10'
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
      
      <div className="flex items-center space-x-4">
        {!isAuthenticated ? (
          <>
            <Link
              href="/login"
              className="hidden md:block text-sm font-medium text-white hover:text-gray-300 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded-md text-sm font-medium text-white transition-colors"
            >
              Get Started
            </Link>
          </>
        ) : (
          <div className="flex items-center gap-x-4">
            <ConnectButton showBalance={false} chainStatus="icon" />
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-x-2 px-4 py-2 rounded-lg text-sm font-medium text-white hover:bg-white hover:bg-opacity-10 transition-all duration-200"
                aria-label="Open user menu"
                title="Open user menu"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <FaUser className="text-white text-sm" />
                </div>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl py-1 border border-purple-500/20">
                  <Link href="/settings" className="block px-4 py-2 text-sm text-gray-300 hover:bg-purple-500/10 hover:text-white transition-all duration-200">
                    Settings
                  </Link>
                  <hr className="my-1 border-gray-700" />
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-purple-500/10 hover:text-white transition-all duration-200">
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile menu button */}
      <div className="flex md:hidden">
        <button
          type="button"
          className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-white"
          onClick={() => setMobileMenuOpen(true)}
        >
          <span className="sr-only">Open main menu</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>
      
      {/* Mobile menu */}
      <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`} role="dialog" aria-modal="true">
        <div className="fixed inset-0 z-50" />
        <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-gray-900 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                <defs>
                  <linearGradient id="logo-gradient-mobile" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#A855F7" stopOpacity="1" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="1" />
                  </linearGradient>
                </defs>
                <path d="M6 2.75L16 1L26 2.75V12C26 19.16 20.44 24.93 16 26.5C11.56 24.93 6 19.16 6 12V2.75Z" fill="url(#logo-gradient-mobile)" stroke="#FFF" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M12 18L16 14L20 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 14V8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xl font-bold text-white">AgentVault</span>
            </div>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/25">
              <div className="space-y-2 py-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-gray-800"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="py-6">
                {!isAuthenticated ? (
                  <div className="space-y-2">
                    <Link
                      href="/login"
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-gray-800"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-gray-800"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Register
                    </Link>
                  </div>
                ) : (
                  <ConnectButton />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </header>
  );
} 