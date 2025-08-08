'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        // If no user data or token, go to login
        if (!userData || !token) {
          console.log('No user data or token found, redirecting to login');
          router.push('/login');
          return;
        }

        // Validate token by making a request to the API
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            // Token is valid, redirect to dashboard
            console.log('Token is valid, redirecting to dashboard');
            router.push('/dashboard');
          } else {
            // Token is invalid/expired, clear storage and redirect to login
            console.log('Token is invalid/expired, clearing storage and redirecting to login');
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            router.push('/login');
          }
        } catch (error) {
          // Network error or API is down, clear storage and redirect to login
          console.error('Error validating token:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          router.push('/login');
        }
      } catch (error) {
        console.error('Error in auth check:', error);
        // Clear any potentially corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        router.push('/login');
      } finally {
        setIsChecking(false);
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  // Show loading spinner while checking authentication
  if (isChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // This should rarely be shown since we redirect immediately
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}