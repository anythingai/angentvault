'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center space-x-2 mb-6">
            <Image src="/icon.svg" alt="AgentVault Logo" width={48} height={48} />
            <span className="text-3xl font-bold text-white relative top-px">AgentVault</span>
          </Link>
          <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
          <p className="text-gray-400">Enter your email to receive reset instructions</p>
        </div>

        <div className="crypto-card p-8">
          <form className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                placeholder="Enter your email address"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Send Reset Instructions
            </button>
          </form>
          
          <div className="text-center mt-6">
            <Link href="/login" className="text-purple-400 hover:text-purple-300 text-sm">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 