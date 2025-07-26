'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from './DashboardHeader';
import CaseNotifications from './CaseNotifications';
import CategoryCards from './CategoryCards';
import InactiveCases from './InactiveCases';
import { dashboardAPI } from '../../lib/api';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Check if user is logged in
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (!userData || !token) {
          router.push('/login');
          return;
        }

        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // Fetch dashboard data
        const response = await dashboardAPI.getOverview();
        if (response.success) {
          setDashboardData(response.data);
        }

      } catch (error: any) {
        console.error('Dashboard initialization error:', error);
        setError(error.message || 'Failed to load dashboard data');
        
        // If it's an authentication error, redirect to login
        if (error.message?.includes('token') || error.message?.includes('auth')) {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user.name}</h1>
          <p className="text-gray-600">Manage your legal cases and stay updated with upcoming hearings</p>
        </div>

        {dashboardData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <CategoryCards data={dashboardData} />
            </div>
            
            <div className="space-y-6">
              <CaseNotifications data={dashboardData} />
              <InactiveCases data={dashboardData} />
            </div>
          </div>
        )}

        {!dashboardData && (
          <div className="text-center py-12">
            <p className="text-gray-500">No dashboard data available</p>
          </div>
        )}
      </div>
    </div>
  );
}