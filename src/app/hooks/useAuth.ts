import { useState, useEffect, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { setCookie, getCookie, deleteCookie } from 'cookies-next';

const AUTH_TOKEN_KEY = 'auth-token';

export default function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    const token = getCookie(AUTH_TOKEN_KEY) || (typeof window !== 'undefined' ? localStorage.getItem('token') : undefined);
    if (token && isConnected) {
      setIsAuthenticated(true);
      // Fetch user data from backend if needed
    } else {
      setIsAuthenticated(false);
    }
  }, [isConnected]);

  const login = useCallback(async () => {
    try {
      if (!isConnected) {
        connect({ connector: connectors[0] });
      }

      if (address) {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: address }),
        });

        if (response.ok) {
          const { token, user } = await response.json();
          // Persist token for both SSR (cookie) and client-side (localStorage)
          setCookie(AUTH_TOKEN_KEY, token, {
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
          });
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', token);
          }
          setIsAuthenticated(true);
          setUser(user);
        } else if (response.status === 401 && address) {
          // Wallet not registered yet – automatically create user
          const regRes = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress: address.toLowerCase(), method: 'wallet' }),
          });
          if (regRes.ok) {
            const { token, user } = await regRes.json();
            setCookie(AUTH_TOKEN_KEY, token, { maxAge: 60 * 60 * 24 * 7, path: '/' });
            if (typeof window !== 'undefined') {
              localStorage.setItem('token', token);
            }
            setIsAuthenticated(true);
            setUser(user);
          }
        }
      }
    } catch (error) {
      // Login error occurred - handle error appropriately
    }
  }, [isConnected, address, connect, connectors]);

  const logout = useCallback(() => {
    disconnect();
    deleteCookie(AUTH_TOKEN_KEY);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    setIsAuthenticated(false);
    setUser(null);
  }, [disconnect]);

  return {
    isAuthenticated,
    user,
    login,
    logout,
    address,
    isConnected,
  };
} 