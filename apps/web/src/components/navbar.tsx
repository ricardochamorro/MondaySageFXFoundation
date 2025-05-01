'use client';

import { Button } from '@mondaysagefx/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function Navbar() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    router.push('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center">
      <div className="text-xl font-bold">Monday Sage FX</div>
      <div>
        {isAuthenticated && (
          <Button
            variant="outline"
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700"
          >
            Logout
          </Button>
        )}
      </div>
    </nav>
  );
}
