'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MessageTemplates() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Message Templates</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">Message templates features coming soon...</p>
      </div>
    </div>
  );
}
