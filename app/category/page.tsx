'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardHeader from '../dashboard/DashboardHeader';
import { categoriesAPI } from '../../lib/api';

interface Category {
  _id: string;
  name: string;
  identifier: string;
  description: string;
  icon: string;
  color: string;
  iconColor: string;
  subcategories: Subcategory[];
  caseCount: number;
  isActive: boolean;
}

interface Subcategory {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export default function CategoriesPage() {
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddSubcategory, setShowAddSubcategory] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<{categoryId: string, subcategory: Subcategory} | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
    fetchCategories();
  }, [router]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoriesAPI.getAll();
      setCategories(response.data?.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      await categoriesAPI.delete(categoryId);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category. It may have active cases.');
    }
  };

  const handleDeleteSubcategory = async (categoryId: string, subcategoryId: string) => {
    if (!confirm('Are you sure you want to delete this subcategory?')) {
      return;
    }

    try {
      await categoriesAPI.deleteSubcategory(categoryId, subcategoryId);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      alert('Failed to delete subcategory. It may have active cases.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading categories...</p>
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
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block cursor-pointer">
            ← Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Category Management</h1>
              <p className="text-gray-600">Manage case categories and subcategories</p>
            </div>
            <button
              onClick={() => setShowAddCategory(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200 whitespace-nowrap cursor-pointer"
            >
              + Add Category
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <i className="ri-error-warning-line text-red-500 mr-2"></i>
              <span className="text-red-700">{error}</span>
              <button 
                onClick={fetchCategories}
                className="ml-auto text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {categories.map((category) => (
            <div key={category._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 flex items-center justify-center ${category.iconColor} bg-white rounded-lg border-2`}>
                    <i className={`${category.icon} text-xl`}></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-gray-600 text-sm">{category.description}</p>
                    <span className="inline-block mt-1 bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                      {category.caseCount || 0} cases
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingCategory(category)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer"
                  >
                    Edit
                  </button>
                  {['admin', 'super_admin'].includes(user.role) && (
                    <button
                      onClick={() => handleDeleteCategory(category._id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Subcategories</h4>
                  <button
                    onClick={() => setShowAddSubcategory(category._id)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer"
                  >
                    + Add Subcategory
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {category.subcategories.map((subcategory) => (
                    <div key={subcategory._id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-gray-900 text-sm">{subcategory.name}</h5>
                          <p className="text-gray-600 text-xs">{subcategory.description}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setEditingSubcategory({categoryId: category._id, subcategory})}
                            className="text-blue-600 hover:text-blue-700 text-xs cursor-pointer"
                          >
                            Edit
                          </button>
                          {['admin', 'super_admin'].includes(user.role) && (
                            <button
                              onClick={() => handleDeleteSubcategory(category._id, subcategory._id)}
                              className="text-red-600 hover:text-red-700 text-xs cursor-pointer ml-2"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && !loading && (
          <div className="text-center py-12">
            <i className="ri-folder-open-line text-4xl text-gray-400 mb-4"></i>
            <p className="text-gray-600 mb-4">No categories found</p>
            <button
              onClick={() => setShowAddCategory(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
            >
              Create First Category
            </button>
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {showAddCategory && (
        <CategoryModal
          onClose={() => setShowAddCategory(false)}
          onSave={fetchCategories}
        />
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <CategoryModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSave={fetchCategories}
        />
      )}

      {/* Add Subcategory Modal */}
      {showAddSubcategory && (
        <SubcategoryModal
          categoryId={showAddSubcategory}
          onClose={() => setShowAddSubcategory(null)}
          onSave={fetchCategories}
        />
      )}

      {/* Edit Subcategory Modal */}
      {editingSubcategory && (
        <SubcategoryModal
          categoryId={editingSubcategory.categoryId}
          subcategory={editingSubcategory.subcategory}
          onClose={() => setEditingSubcategory(null)}
          onSave={fetchCategories}
        />
      )}
    </div>
  );
}

// Category Modal Component
function CategoryModal({ category, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    identifier: category?.identifier || '',
    description: category?.description || '',
    icon: category?.icon || 'ri-folder-line',
    color: category?.color || 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    iconColor: category?.iconColor || 'text-blue-600'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (category) {
        await categoriesAPI.update(category._id, formData);
      } else {
        await categoriesAPI.create(formData);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {category ? 'Edit Category' : 'Add Category'}
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Identifier</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                placeholder="auto-generated if empty"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200"
              >
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Subcategory Modal Component
function SubcategoryModal({ categoryId, subcategory, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    name: subcategory?.name || '',
    description: subcategory?.description || ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (subcategory) {
        await categoriesAPI.updateSubcategory(categoryId, subcategory._id, formData);
      } else {
        await categoriesAPI.createSubcategory(categoryId, formData);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving subcategory:', error);
      alert('Failed to save subcategory');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {subcategory ? 'Edit Subcategory' : 'Add Subcategory'}
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200"
              >
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}