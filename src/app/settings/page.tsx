'use client';

import { useState, useEffect } from 'react';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  walletAddress: string;
  subscription: string;
  createdAt: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    emailNotifications: true,
    autoCompound: true,
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view settings');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to load profile');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setProfile(result.data);
        setFormData({
          name: result.data.name || '',
          email: result.data.email || '',
          emailNotifications: true,
          autoCompound: true,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const result = await response.json();
      if (result.success) {
        setProfile(result.data);
        alert('Profile updated successfully!');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="h-96 bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="crypto-card p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label htmlFor="emailAddress" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  id="emailAddress"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Connected Wallet
                </label>
                <div className="flex items-center space-x-2 p-3 bg-gray-700 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-white font-mono text-sm">
                    {profile?.walletAddress ? 
                      `${profile.walletAddress.slice(0, 6)}...${profile.walletAddress.slice(-4)}` : 
                      'No wallet connected'
                    }
                  </span>
                  <span className="text-green-400 text-sm">
                    {profile?.walletAddress ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
              <div className="pt-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>

          <div className="crypto-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Trading Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Email Notifications</h3>
                  <p className="text-gray-400 text-sm">Receive trading alerts and updates</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.emailNotifications}
                  onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                  aria-label="Enable email notifications"
                  className="h-4 w-4 bg-gray-700 border-gray-600 rounded text-purple-600 focus:ring-purple-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Auto-compound Profits</h3>
                  <p className="text-gray-400 text-sm">Automatically reinvest trading profits</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.autoCompound}
                  onChange={(e) => setFormData({ ...formData, autoCompound: e.target.checked })}
                  aria-label="Enable auto-compound profits"
                  className="h-4 w-4 bg-gray-700 border-gray-600 rounded text-purple-600 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="crypto-card p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Subscription</h2>
            <div className="text-center">
                              <div className="text-3xl font-bold text-purple-400 mb-2">
                  {profile?.subscription ? profile.subscription.charAt(0).toUpperCase() + profile.subscription.slice(1) : 'Basic'}
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  {profile?.subscription === 'pro' ? 'Full access to all features' : 'Upgrade for premium features'}
                </p>
                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
                  {profile?.subscription === 'pro' ? 'Manage Billing' : 'Upgrade Plan'}
                </button>
            </div>
          </div>

          <div className="crypto-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Security</h2>
            <div className="space-y-3">
              <button className="w-full text-left p-3 hover:bg-gray-700 rounded-lg transition-colors">
                <div className="text-white font-medium">Two-Factor Authentication</div>
                <div className="text-gray-400 text-sm">Enable 2FA for added security</div>
              </button>
              <button className="w-full text-left p-3 hover:bg-gray-700 rounded-lg transition-colors">
                <div className="text-white font-medium">API Keys</div>
                <div className="text-gray-400 text-sm">Manage your API access</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 