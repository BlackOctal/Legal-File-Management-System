'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardHeader from '../../dashboard/DashboardHeader';

export default function CreateCasePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    subcategory: '',
    clientNames: [''],
    description: '',
    priority: 'Medium',
    assignedLawyer: '',
    courtName: '',
    judgeAssigned: ''
  });
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
    setLoading(false);
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating case:', formData);
    router.push('/dashboard');
  };

  const addClientName = () => {
    setFormData({
      ...formData,
      clientNames: [...formData.clientNames, '']
    });
  };

  const removeClientName = (index: number) => {
    const newClientNames = formData.clientNames.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      clientNames: newClientNames.length ? newClientNames : ['']
    });
  };

  const updateClientName = (index: number, value: string) => {
    const newClientNames = [...formData.clientNames];
    newClientNames[index] = value;
    setFormData({
      ...formData,
      clientNames: newClientNames
    });
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

  if (!user) return null;

  const categories = [
    { id: 'financial', name: 'Financial Cases', subcategories: ['Loan Settlement', 'Debt Recovery', 'Bankruptcy'] },
    { id: 'deeds', name: 'Property Deeds', subcategories: ['Property Transfer', 'Title Dispute', 'Registration'] },
    { id: 'criminal', name: 'Criminal Cases', subcategories: ['Defense', 'Prosecution', 'Appeals'] },
    { id: 'civil', name: 'Civil Litigation', subcategories: ['Contract Dispute', 'Personal Injury', 'Torts'] },
    { id: 'family', name: 'Family Law', subcategories: ['Divorce', 'Custody', 'Adoption'] },
    { id: 'corporate', name: 'Corporate Law', subcategories: ['Formation', 'Contracts', 'Compliance'] }
  ];

  const selectedCategory = categories.find(cat => cat.id === formData.category);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block cursor-pointer">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Case</h1>
          <p className="text-gray-600">Fill in the details to create a new legal case</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Case Title</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter case title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value, subcategory: ''})}
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({...formData, subcategory: e.target.value})}
                  disabled={!selectedCategory}
                >
                  <option value="">Select subcategory</option>
                  {selectedCategory?.subcategories.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Client Names</label>
              {formData.clientNames.map((clientName, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    required
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Client ${index + 1} name`}
                    value={clientName}
                    onChange={(e) => updateClientName(index, e.target.value)}
                  />
                  {formData.clientNames.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeClientName(index)}
                      className="w-10 h-10 flex items-center justify-center text-red-600 hover:bg-red-50 rounded cursor-pointer"
                    >
                      <i className="ri-subtract-line"></i>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addClientName}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer"
              >
                + Add Another Client
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Case Description</label>
              <textarea
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Describe the case details..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500 characters</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Lawyer</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Lawyer name"
                  value={formData.assignedLawyer}
                  onChange={(e) => setFormData({...formData, assignedLawyer: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Court Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Court name (optional)"
                  value={formData.courtName}
                  onChange={(e) => setFormData({...formData, courtName: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Judge Assigned</label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Judge name (optional)"
                value={formData.judgeAssigned}
                onChange={(e) => setFormData({...formData, judgeAssigned: e.target.value})}
              />
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6">
              <Link href="/dashboard" className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition duration-200 whitespace-nowrap cursor-pointer">
                Cancel
              </Link>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition duration-200 whitespace-nowrap cursor-pointer"
              >
                Create Case
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}