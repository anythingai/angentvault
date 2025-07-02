'use client';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-gray-400">Last updated: June 26, 2025</p>
      </div>

      <div className="crypto-card p-8">
        {process.env.NEXT_PUBLIC_ENV !== 'production' && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
            <p className="text-blue-300 text-sm mb-0">
              <strong>Demo Notice:</strong> DEV / TEST environment. Privacy policy draft subject to change.
            </p>
          </div>
        )}

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Information We Collect</h2>
            <p className="text-gray-300">
              In this demonstration, we simulate the collection of user data including wallet addresses, 
              trading preferences, and agent configurations for the purpose of demonstrating platform functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Data Storage and Security</h2>
            <p className="text-gray-300">
              Demo data is stored locally and in decentralized storage systems including Pinata IPFS 
              to demonstrate the platform&apos;s capabilities. In production, all user data would be encrypted 
              and secured according to industry best practices.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Third-Party Integrations</h2>
            <p className="text-gray-300 mb-4">
              This demo integrates with the following third-party services:
            </p>
            <ul className="text-gray-300 space-y-2 ml-6">
              <li>• CDP Wallet for secure asset management</li>
              <li>• x402pay for payment processing</li>
              <li>• Amazon Bedrock Nova for AI analysis</li>
              <li>• Akash Network for decentralized hosting</li>
              <li>• Pinata for IPFS storage</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Data Usage</h2>
            <p className="text-gray-300">
              Demo data is used solely to demonstrate the autonomous trading agent platform 
              and its integration with sponsor technologies for the hackathon submission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Contact</h2>
            <p className="text-gray-300">
              For questions about data handling in this demonstration, please contact the 
              AgentVault team through the hackathon submission portal.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
} 