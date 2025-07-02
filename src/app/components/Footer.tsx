import Link from 'next/link';
import { FaTwitter, FaGithub, FaDiscord } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-purple-500/10 pt-16 pb-8 text-gray-400">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-12">
          {/* Column 1: Brand */}
          <div className="col-span-2">
            <h3 className="text-xl font-bold text-white mb-2">AgentVault</h3>
            <p className="text-sm">Autonomous AI agents for crypto trading.</p>
          </div>

          {/* Column 2: Product */}
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2">
              <li><Link href="/dashboard" className="hover:text-purple-400">Dashboard</Link></li>
              <li><Link href="/agents" className="hover:text-purple-400">Agents</Link></li>
              <li><Link href="/marketplace" className="hover:text-purple-400">Marketplace</Link></li>
              <li><Link href="/analytics" className="hover:text-purple-400">Analytics</Link></li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/#about" className="hover:text-purple-400">About Us</Link></li>
              <li><a href="mailto:careers@agentvault.io" className="hover:text-purple-400">Careers</a></li>
              <li><a href="mailto:press@agentvault.io" className="hover:text-purple-400">Press</a></li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/terms" className="hover:text-purple-400">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-purple-400">Privacy Policy</Link></li>
              <li><a href="mailto:support@agentvault.io" className="hover:text-purple-400">Contact Support</a></li>
            </ul>
          </div>

          {/* Column 5: Social */}
          <div>
            <h4 className="font-semibold text-white mb-4">Follow Us</h4>
            <ul className="flex space-x-4">
              <li>
                <a href="https://twitter.com/agentvault" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400" aria-label="Follow us on Twitter"><FaTwitter size={20} /></a>
              </li>
              <li>
                <a href="https://github.com/agentvault" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400" aria-label="Check out our GitHub"><FaGithub size={20} /></a>
              </li>
              <li>
                <a href="https://discord.gg/agentvault" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400" aria-label="Join our Discord"><FaDiscord size={20} /></a>
              </li>
            </ul>
          </div>
        </div>
        
        <hr className="border-gray-800 my-8" />

        <div className="flex flex-col sm:flex-row justify-between items-center text-sm">
          <p>&copy; {new Date().getFullYear()} AgentVault. All rights reserved.</p>
          <p className="mt-4 sm:mt-0">Built for the Coinbase Agents in Action Hackathon.</p>
        </div>
      </div>
    </footer>
  );
} 