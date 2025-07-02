'use client';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-gray-400">Last updated: January 2, 2025</p>
      </div>

      <div className="crypto-card p-8">
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Information We Collect</h2>
            <p className="text-gray-300 mb-4">
              AgentVault collects information necessary to provide autonomous crypto trading services:
            </p>
            <ul className="text-gray-300 space-y-2 ml-6 mb-4">
              <li>• Account information (email, authentication credentials)</li>
              <li>• Wallet addresses and blockchain transaction data</li>
              <li>• Trading preferences and agent configurations</li>
              <li>• Performance metrics and trading history</li>
              <li>• Payment information for platform services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Data Storage and Security</h2>
            <p className="text-gray-300 mb-4">
              We implement industry-standard security measures:
            </p>
            <ul className="text-gray-300 space-y-2 ml-6 mb-4">
              <li>• End-to-end encryption for sensitive data</li>
              <li>• Decentralized storage on IPFS via Pinata for trading history</li>
              <li>• Multi-signature wallet security through your connected EVM-compatible wallet</li>
              <li>• SOC 2 Type II compliance standards</li>
              <li>• Regular security audits and penetration testing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Third-Party Integrations</h2>
            <p className="text-gray-300 mb-4">
              AgentVault integrates with the following secure services:
            </p>
            <ul className="text-gray-300 space-y-2 ml-6 mb-4">
              <li>• <strong>Wallet Integration:</strong> Secure asset management and custody with your preferred EVM-compatible wallet</li>
              <li>• <strong>x402pay:</strong> Micropayment processing and revenue sharing</li>
              <li>• <strong>Amazon Bedrock Nova:</strong> AI analysis (data anonymized)</li>
              <li>• <strong>Akash Network:</strong> Decentralized compute infrastructure</li>
              <li>• <strong>Pinata IPFS:</strong> Immutable storage for audit trails</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Data Usage</h2>
            <p className="text-gray-300 mb-4">
              Your data is used exclusively for:
            </p>
            <ul className="text-gray-300 space-y-2 ml-6 mb-4">
              <li>• Executing autonomous trading strategies</li>
              <li>• Providing personalized AI recommendations</li>
              <li>• Processing payments and revenue distribution</li>
              <li>• Maintaining security and preventing fraud</li>
              <li>• Improving platform performance and features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Data Rights</h2>
            <p className="text-gray-300 mb-4">
              You have the right to:
            </p>
            <ul className="text-gray-300 space-y-2 ml-6 mb-4">
              <li>• Access your personal data</li>
              <li>• Request data corrections or deletions</li>
              <li>• Export your trading history</li>
              <li>• Opt-out of non-essential data processing</li>
              <li>• Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Contact Information</h2>
            <p className="text-gray-300">
              For privacy-related inquiries, contact our Data Protection Officer:<br/>
              Email: privacy@agentvault.io<br/>
              Address: 123 Crypto Street, San Francisco, CA 94102
            </p>
          </section>
        </div>
      </div>
    </div>
  );
} 