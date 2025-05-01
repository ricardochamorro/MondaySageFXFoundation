import { useState, useEffect } from 'react';

export function useMondayAuth() {
  const [isMondayConnected, setIsMondayConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkMondayConnection = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        setIsMondayConnected(false);
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/monday/token', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.access_token) {
          setIsMondayConnected(true);
        } else {
          setIsMondayConnected(false);
        }
      } else {
        // If the token is expired or invalid, we'll get a 401
        setIsMondayConnected(false);
      }
    } catch (error) {
      console.error('Error checking Monday connection:', error);
      setIsMondayConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const connectToMonday = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const returnUrl = window.location.pathname;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://monday.sagefxfoundation.com';
    window.location.href = `${apiUrl}/api/auth/monday?token=${token}&returnUrl=${encodeURIComponent(returnUrl)}`;
  };

  useEffect(() => {
    checkMondayConnection();
  }, []);

  return { isMondayConnected, isLoading, connectToMonday, checkMondayConnection };
}
