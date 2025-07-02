'use client';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-gray-400">Last updated: January 2, 2025</p>
      </div>

      <div className="crypto-card p-8">
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300">
              By accessing and using AgentVault, you acknowledge and agree to be bound by these Terms of Service. 
              If you do not agree to these terms, you may not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Service Description</h2>
            <p className="text-gray-300 mb-4">
              AgentVault provides autonomous cryptocurrency trading services through AI-powered agents. Our platform integrates:
            </p>
            <ul className="text-gray-300 space-y-2 ml-6 mb-4">
              <li>• <strong>AI Trading Agents:</strong> Autonomous decision-making powered by Amazon Bedrock Nova</li>
              <li>• <strong>Secure Wallet Management:</strong> Integration with all major EVM-compatible wallets for asset custody</li>
              <li>• <strong>Micropayment Processing:</strong> x402pay for seamless revenue sharing</li>
              <li>• <strong>Decentralized Infrastructure:</strong> Akash Network for compute resources</li>
              <li>• <strong>Immutable Storage:</strong> Pinata IPFS for trading history and audit trails</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Risk Disclosure</h2>
            <p className="text-gray-300 mb-4">
              <strong>Cryptocurrency trading involves substantial risk of loss.</strong> You acknowledge that:
            </p>
            <ul className="text-gray-300 space-y-2 ml-6 mb-4">
              <li>• Trading decisions are made by AI agents based on market analysis</li>
              <li>• Past performance does not guarantee future results</li>
              <li>• You may lose all or part of your investment</li>
              <li>• Market volatility can result in rapid losses</li>
              <li>• You trade at your own risk and discretion</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. User Responsibilities</h2>
            <p className="text-gray-300 mb-4">
              You agree to:
            </p>
            <ul className="text-gray-300 space-y-2 ml-6 mb-4">
              <li>• Provide accurate account information</li>
              <li>• Maintain the security of your account credentials</li>
              <li>• Comply with applicable laws and regulations</li>
              <li>• Monitor your agent&apos;s performance and adjust settings as needed</li>
              <li>• Report any unauthorized access immediately</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Fees and Payments</h2>
            <p className="text-gray-300 mb-4">
              Our fee structure includes:
            </p>
            <ul className="text-gray-300 space-y-2 ml-6 mb-4">
              <li>• Platform subscription fees</li>
              <li>• Performance-based fees for successful trades</li>
              <li>• Network transaction fees (gas costs)</li>
              <li>• Premium AI analysis charges via x402pay</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Limitation of Liability</h2>
            <p className="text-gray-300">
              AgentVault and its affiliates shall not be liable for any indirect, incidental, special, 
              consequential, or punitive damages, including but not limited to loss of profits, 
              data, or use, arising out of your use of our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Contact Information</h2>
            <p className="text-gray-300">
              For legal inquiries or terms-related questions:<br/>
              Email: legal@agentvault.io<br/>
              Address: 123 Crypto Street, San Francisco, CA 94102
            </p>
          </section>
        </div>
      </div>
    </div>
  );
} 