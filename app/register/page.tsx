'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardHeader from '../dashboard/DashboardHeader';
import { authAPI } from '../../lib/api';

export default function RegisterStaffPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff',
    phoneNumber: '',
    department: ''
  });
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    // Check if user has permission to register staff
    if (!['admin', 'super_admin'].includes(parsedUser.role)) {
      router.push('/dashboard');
      return;
    }
    
    setLoading(false);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Check if user can create this role
    if (user.role === 'admin' && formData.role !== 'staff') {
      setError('Admins can only create Staff accounts');
      return;
    }

    setSubmitting(true);

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phoneNumber: formData.phoneNumber || undefined,
        department: formData.department || undefined
      };

      console.log('Registering new user:', { ...userData, password: '[HIDDEN]' });
      
      const response = await authAPI.register(userData);
      
      console.log('Registration response:', response);
      
      if (response.success) {
        setSuccess(`${formData.role === 'staff' ? 'Staff member' : 'Admin'} "${formData.name}" has been registered successfully!`);
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'staff',
          phoneNumber: '',
          department: ''
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Failed to register user');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <i className="ri-error-warning-line text-4xl"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Only administrators can register new users.</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block cursor-pointer">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Register New User</h1>
          <p className="text-gray-600">
            {user.role === 'admin' 
              ? 'Add a new staff member to the system' 
              : 'Add a new staff member or admin to the system'
            }
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <i className="ri-error-warning-line text-red-500 mr-2"></i>
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <i className="ri-check-line text-green-500 mr-2"></i>
                <span className="text-green-700">{success}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter password (min 6 characters)"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
              <select
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="staff">Staff Member</option>
                {user.role === 'super_admin' && (
                  <option value="admin">Admin</option>
                )}
                {/* Super Admin option only for Super Admins - commented out for security */}
                {/* {user.role === 'super_admin' && (
                  <option value="super_admin">Super Admin</option>
                )} */}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {user.role === 'admin' 
                  ? 'As an Admin, you can only create Staff members' 
                  : 'Super Admins can create Staff and Admin accounts'
                }
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number (optional)"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter department (optional)"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <i className="ri-information-line text-blue-500 mr-2 mt-0.5"></i>
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Account Information:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>The new user will be able to log in immediately with the provided credentials</li>
                      <li>They should change their password after first login</li>
                      <li>Staff members can create and manage cases</li>
                      <li>Only Super Admins can delete cases</li>
                      {user.role === 'admin' && (
                        <li><strong>As an Admin, you can only create Staff accounts</strong></li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4">
                <Link href="/dashboard" className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition duration-200 whitespace-nowrap cursor-pointer">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition duration-200 whitespace-nowrap cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : `Register ${formData.role === 'staff' ? 'Staff Member' : 'Admin'}`}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}