'use client';
/* eslint-disable jsx-a11y/aria-proptypes */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import useAuth from '../hooks/useAuth';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Image from 'next/image';

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Agents', href: '/agents' },
  { name: 'Marketplace', href: '/marketplace' },
  { name: 'Analytics', href: '/analytics' },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { login, isConnected, isAuthenticated } = useAuth();
  const rawPath = usePathname();
  const pathname = rawPath || '/';

  useEffect(() => {
    if (isConnected) {
      login();
    }
  }, [isConnected, login]);

  return (
    <header className="sticky top-0 z-50 bg-gray-900/80 text-white backdrop-blur-md border-b border-purple-500/10">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center space-x-2">
            <Image src="/icon.svg" alt="AgentVault Logo" width={32} height={32} />
            <span className="text-xl font-bold relative top-px">AgentVault</span>
          </Link>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <Link 
              key={item.name} 
              href={item.href} 
              className={`text-sm font-semibold leading-6 ${
                (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)) ? 'text-purple-400' : ''
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
          {!isAuthenticated ? (
            <>
              <Link
                href="/login"
                className={`text-sm font-semibold leading-6 ${
                  pathname === '/login' ? 'text-purple-400' : 'hover:text-purple-400'
                }`}
              >
                Login
              </Link>
              <Link
                href="/register"
                className={`text-sm font-semibold leading-6 ${
                  pathname === '/register' ? 'text-purple-400' : 'hover:text-purple-400'
                }`}
              >
                Register
              </Link>
            </>
          ) : (
            <ConnectButton />
          )}
        </div>
      </nav>
      {/* Mobile menu */}
      <div className={`lg:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`} role="dialog" aria-modal="true">
        <div className="fixed inset-0 z-10" />
        <div className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-gray-900 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-white/10">
          <div className="flex items-center justify-between">
            <Link href="/" className="-m-1.5 p-1.5 flex items-center space-x-2">
              <Image src="/icon.svg" alt="AgentVault Logo" width={32} height={32} />
              <span className="text-xl font-bold relative top-px">AgentVault</span>
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5"
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
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 hover:bg-gray-800"
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
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 hover:bg-gray-800"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 hover:bg-gray-800"
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
    </header>
  );
} 