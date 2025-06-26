'use client';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-gray-400">Last updated: June 26, 2025</p>
      </div>

      <div className="crypto-card p-8">
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
          <p className="text-blue-300 text-sm mb-0">
            <strong>Demo Notice:</strong> This is a demonstration for the Coinbase Agents in Action Hackathon. 
            These terms are for demo purposes only and do not constitute a legal agreement.
          </p>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300">
              By accessing and using AgentVault, you acknowledge and agree to these Terms of Service. 
              This platform demonstrates autonomous AI trading capabilities with integrated sponsor technologies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Technology Integration</h2>
            <p className="text-gray-300 mb-4">
              AgentVault integrates the following sponsor technologies:
            </p>
            <ul className="text-gray-300 space-y-2 ml-6">
              <li>• <strong>x402pay:</strong> Micropayment processing for AI agent monetization</li>
              <li>• <strong>CDP Wallet:</strong> Secure programmable wallet functionality</li>
              <li>• <strong>Amazon Bedrock Nova:</strong> AI-powered market analysis and decision making</li>
              <li>• <strong>Akash Network:</strong> Decentralized compute infrastructure</li>
              <li>• <strong>Pinata IPFS:</strong> Distributed storage for trading history and audit trails</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Demo Limitations</h2>
            <p className="text-gray-300">
              This is a demonstration platform built for the hackathon. Real trading functionality, 
              payment processing, and AI decision-making are simulated for demo purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Contact</h2>
            <p className="text-gray-300">
              For questions about this demonstration, please contact the AgentVault team through 
              the hackathon submission portal.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
} 