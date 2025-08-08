'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardHeader from './DashboardHeader';
import CaseNotifications from './CaseNotifications';
import CategoryCards from './CategoryCards';
import InactiveCases from './InactiveCases';

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
          console.log('No authentication data found, redirecting to login');
          router.push('/login');
          return;
        }

        let parsedUser;
        try {
          parsedUser = JSON.parse(userData);
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }

        // Validate token by testing API access
        try {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
          
          const response = await fetch(`${API_BASE_URL}/dashboard/overview`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            if (response.status === 401) {
              console.log('Token expired or invalid, clearing auth and redirecting to login');
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              router.push('/login');
              return;
            }
            throw new Error(`Dashboard API error: ${response.status}`);
          }

          const dashboardResponse = await response.json();
          
          // Set user and dashboard data
          setUser(parsedUser);
          if (dashboardResponse.success) {
            setDashboardData(dashboardResponse.data);
          }

        } catch (apiError: any) {
          console.error('API Error:', apiError);
          
          // If it's a network error or auth error, redirect to login
          if (apiError.message?.includes('401') || 
              apiError.message?.includes('token') || 
              apiError.message?.includes('auth') ||
              apiError.message?.includes('fetch')) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            router.push('/login');
            return;
          }
          
          // For other errors, still set user but show error message
          setUser(parsedUser);
          setError(apiError.message || 'Failed to load dashboard data');
        }

      } catch (error: any) {
        console.error('Dashboard initialization error:', error);
        setError(error.message || 'Failed to initialize dashboard');
        
        // Clear potentially corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        router.push('/login');
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

  if (error && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Retry
            </button>
            <button 
              onClick={() => router.push('/login')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Back to Login
            </button>
          </div>
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

        {/* Error banner if dashboard data failed to load */}
        {error && user && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <i className="ri-warning-line text-yellow-500 mr-2"></i>
              <span className="text-yellow-700">Some dashboard data couldn't be loaded: {error}</span>
              <button 
                onClick={() => window.location.reload()}
                className="ml-auto text-yellow-600 hover:text-yellow-700 text-sm font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Admin Actions Section */}
        {(['admin', 'super_admin'].includes(user.role)) && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Register User Card */}
              <Link href="/register" className="cursor-pointer">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-green-100 text-green-600 rounded-lg">
                      <i className="ri-user-add-line text-xl"></i>
                    </div>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                      Admin Only
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Register New User</h3>
                  <p className="text-gray-600 text-sm">Add staff members and admins to the system</p>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="text-blue-600 text-sm font-medium">Add User →</span>
                  </div>
                </div>
              </Link>

              {/* Quick Actions Card */}
              <Link href="/cases/create" className="cursor-pointer">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg">
                      <i className="ri-file-add-line text-xl"></i>
                    </div>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                      Quick Action
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Create New Case</h3>
                  <p className="text-gray-600 text-sm">Start a new legal case for your clients</p>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="text-blue-600 text-sm font-medium">Create Case →</span>
                  </div>
                </div>
              </Link>

              {/* View All Cases Card */}
              <Link href="/cases" className="cursor-pointer">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-purple-100 text-purple-600 rounded-lg">
                      <i className="ri-folder-open-line text-xl"></i>
                    </div>
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                      View All
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">All Cases</h3>
                  <p className="text-gray-600 text-sm">Browse and manage all legal cases</p>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="text-blue-600 text-sm font-medium">View Cases →</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Staff Quick Actions (for staff members) */}
        {user.role === 'staff' && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Create Case Card for Staff */}
              <Link href="/cases/create" className="cursor-pointer">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg">
                      <i className="ri-file-add-line text-xl"></i>
                    </div>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                      Create
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Create New Case</h3>
                  <p className="text-gray-600 text-sm">Start a new legal case for your clients</p>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="text-blue-600 text-sm font-medium">Create Case →</span>
                  </div>
                </div>
              </Link>

              {/* View Cases Card for Staff */}
              <Link href="/cases" className="cursor-pointer">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-green-100 text-green-600 rounded-lg">
                      <i className="ri-folder-line text-xl"></i>
                    </div>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                      Manage
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Cases</h3>
                  <p className="text-gray-600 text-sm">View and update your assigned cases</p>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="text-blue-600 text-sm font-medium">View Cases →</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Main Dashboard Content */}
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

        {!dashboardData && !error && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Loading</h3>
            <p className="text-gray-500">Loading your dashboard data...</p>
          </div>
        )}
      </div>
    </div>
  );
}