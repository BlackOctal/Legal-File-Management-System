'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardHeader from '../../dashboard/DashboardHeader';
import { casesAPI } from '../../../lib/api';

interface CategoryDetailProps {
  categoryId: string;
}

const categoryData: Record<string, any> = {
  financial: {
    name: 'Financial Cases',
    description: 'Manage loan settlements, debt recovery, and bankruptcy cases',
    subcategories: [
      { id: 'loan-settlement', name: 'Loan Settlements', description: 'Mortgage and personal loan settlements', mappedName: 'Loan Settlement' },
      { id: 'debt-recovery', name: 'Debt Recovery', description: 'Collection and recovery cases', mappedName: 'Debt Recovery' },
      { id: 'bankruptcy', name: 'Bankruptcy', description: 'Corporate and personal bankruptcy', mappedName: 'Bankruptcy' }
    ]
  },
  deeds: {
    name: 'Property Deeds',
    description: 'Handle property transfers, title disputes, and registrations',
    subcategories: [
      { id: 'property-transfer', name: 'Property Transfers', description: 'Ownership transfer documentation', mappedName: 'Property Transfer' },
      { id: 'title-dispute', name: 'Title Disputes', description: 'Property ownership disputes', mappedName: 'Title Dispute' },
      { id: 'registration', name: 'Registration', description: 'Property registration matters', mappedName: 'Registration' }
    ]
  },
  criminal: {
    name: 'Criminal Cases',
    description: 'Criminal defense, prosecution, and appeals',
    subcategories: [
      { id: 'defense', name: 'Criminal Defense', description: 'Defense representation cases', mappedName: 'Defense' },
      { id: 'prosecution', name: 'Prosecution', description: 'State prosecution cases', mappedName: 'Prosecution' },
      { id: 'appeals', name: 'Criminal Appeals', description: 'Appeal proceedings', mappedName: 'Appeals' }
    ]
  },
  civil: {
    name: 'Civil Litigation',
    description: 'Contract disputes, personal injury, and tort cases',
    subcategories: [
      { id: 'contract-dispute', name: 'Contract Disputes', description: 'Business and personal contracts', mappedName: 'Contract Dispute' },
      { id: 'personal-injury', name: 'Personal Injury', description: 'Accident and injury claims', mappedName: 'Personal Injury' },
      { id: 'torts', name: 'Tort Cases', description: 'Civil wrong and damages', mappedName: 'Torts' }
    ]
  },
  family: {
    name: 'Family Law',
    description: 'Divorce, custody, adoption, and domestic relations',
    subcategories: [
      { id: 'divorce', name: 'Divorce Cases', description: 'Marriage dissolution proceedings', mappedName: 'Divorce' },
      { id: 'custody', name: 'Child Custody', description: 'Child custody and support', mappedName: 'Custody' },
      { id: 'adoption', name: 'Adoption', description: 'Adoption proceedings', mappedName: 'Adoption' }
    ]
  },
  corporate: {
    name: 'Corporate Law',
    description: 'Business formation, contracts, and compliance',
    subcategories: [
      { id: 'formation', name: 'Business Formation', description: 'Company setup and structure', mappedName: 'Formation' },
      { id: 'contracts', name: 'Corporate Contracts', description: 'Business agreements', mappedName: 'Contracts' },
      { id: 'compliance', name: 'Compliance', description: 'Regulatory compliance matters', mappedName: 'Compliance' }
    ]
  }
};

export default function CategoryDetail({ categoryId }: CategoryDetailProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subcategoryStats, setSubcategoryStats] = useState<Record<string, number>>({});
  const [error, setError] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
    fetchSubcategoryStats();
  }, [router, categoryId]);

  const fetchSubcategoryStats = async () => {
    try {
      setLoading(true);
      setError('');
      
      const category = categoryData[categoryId];
      if (!category) {
        setError('Category not found');
        setLoading(false);
        return;
      }

      // Fetch case counts for each subcategory using your consolidated casesAPI
      const stats: Record<string, number> = {};
      
      for (const subcategory of category.subcategories) {
        try {
          const params = new URLSearchParams({
            category: categoryId,
            subcategory: subcategory.mappedName,
            limit: '1' // We only need the count
          });
          
          console.log(`Fetching stats for ${subcategory.name} with params:`, params.toString());
          
          const data = await casesAPI.getAll(params);
          const totalCases = data.data?.pagination?.totalCases || data.pagination?.totalCases || 0;
          stats[subcategory.id] = totalCases;
          
          console.log(`Subcategory ${subcategory.name}: ${totalCases} cases`);
        } catch (error) {
          console.error(`Error fetching stats for ${subcategory.id}:`, error);
          stats[subcategory.id] = 0;
        }
      }
      
      setSubcategoryStats(stats);
      console.log('Final subcategory stats:', stats);
    } catch (error) {
      console.error('Error fetching subcategory stats:', error);
      setError('Failed to load case statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading category...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const category = categoryData[categoryId];
  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <i className="ri-error-warning-line text-4xl"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Category Not Found</h2>
          <p className="text-gray-600 mb-4">The requested category could not be found.</p>
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block cursor-pointer">
            ← Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{category.name}</h1>
              <p className="text-gray-600">{category.description}</p>
            </div>
            <Link href="/cases/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200 whitespace-nowrap cursor-pointer">
              + New Case
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
            <button 
              onClick={() => fetchSubcategoryStats()}
              className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {category.subcategories.map((subcategory: any) => (
            <Link key={subcategory.id} href={`/subcategory/${categoryId}/${subcategory.id}`} className="cursor-pointer">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg">
                    <i className="ri-folder-line text-xl"></i>
                  </div>
                  <div className="text-right">
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                      {subcategoryStats[subcategory.id] !== undefined ? 
                        `${subcategoryStats[subcategory.id]} cases` : 
                        'Loading...'
                      }
                    </span>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{subcategory.name}</h3>
                <p className="text-gray-600 text-sm">{subcategory.description}</p>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className="text-blue-600 text-sm font-medium">View Cases →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {category.subcategories.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-folder-open-line text-4xl text-gray-400 mb-4"></i>
            <p className="text-gray-600">No subcategories found in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}