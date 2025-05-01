'use client';

import { Button } from '@mondaysagefx/ui';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthError() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || 'An error occurred during authentication';

  const handleConnectMonday = () => {
    router.push('/api/auth/monday');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Authentication Error</h2>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
        </div>

        <div className="mt-8 space-y-4">
          {message.includes('Monday.com account') && (
            <Button
              onClick={handleConnectMonday}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Connect Monday.com Account
            </Button>
          )}

          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
