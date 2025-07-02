import { useState, useEffect } from 'react';
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
    const token = getCookie(AUTH_TOKEN_KEY);
    if (token && isConnected) {
      setIsAuthenticated(true);
      // Fetch user data from backend if needed
    } else {
      setIsAuthenticated(false);
    }
  }, [isConnected]);

  const login = async () => {
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
          setCookie(AUTH_TOKEN_KEY, token, {
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
          });
          setIsAuthenticated(true);
          setUser(user);
        } else {
          // Login failed - handle error appropriately
        }
      }
    } catch (error) {
      // Login error occurred - handle error appropriately
    }
  };

  const logout = () => {
    disconnect();
    deleteCookie(AUTH_TOKEN_KEY);
    setIsAuthenticated(false);
    setUser(null);
  };

  return {
    isAuthenticated,
    user,
    login,
    logout,
    address,
    isConnected,
  };
} 