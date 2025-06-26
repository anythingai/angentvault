'use client';

export default function SettingsPage() {
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
                  defaultValue="Demo User"
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
                  defaultValue="demo@agentvault.ai"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Connected Wallet
                </label>
                <div className="flex items-center space-x-2 p-3 bg-gray-700 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-white font-mono text-sm">0x742d35...9c0CF</span>
                  <span className="text-green-400 text-sm">Connected</span>
                </div>
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
                  defaultChecked
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
                  defaultChecked
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
              <div className="text-3xl font-bold text-purple-400 mb-2">Premium</div>
              <p className="text-gray-400 text-sm mb-4">Full access to all features</p>
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
                Manage Billing
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