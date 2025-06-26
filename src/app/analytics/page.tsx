'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AnalyticsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard where analytics functionality is located
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Redirecting to dashboard...</p>
      </div>
    </div>
  );
} 