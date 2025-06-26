'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BillingPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to payments page where billing functionality is located
    router.replace('/payments');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Redirecting to payments...</p>
      </div>
    </div>
  );
} 