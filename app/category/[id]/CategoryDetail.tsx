
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardHeader from '../../dashboard/DashboardHeader';

interface CategoryDetailProps {
  categoryId: string;
}

const categoryData: Record<string, any> = {
  financial: {
    name: 'Financial Cases',
    description: 'Manage loan settlements, debt recovery, and bankruptcy cases',
    subcategories: [
      { id: 'loan-settlement', name: 'Loan Settlements', count: 12, description: 'Mortgage and personal loan settlements' },
      { id: 'debt-recovery', name: 'Debt Recovery', count: 8, description: 'Collection and recovery cases' },
      { id: 'bankruptcy', name: 'Bankruptcy', count: 4, description: 'Corporate and personal bankruptcy' }
    ]
  },
  deeds: {
    name: 'Property Deeds',
    description: 'Handle property transfers, title disputes, and registrations',
    subcategories: [
      { id: 'property-transfer', name: 'Property Transfers', count: 10, description: 'Ownership transfer documentation' },
      { id: 'title-dispute', name: 'Title Disputes', count: 5, description: 'Property ownership disputes' },
      { id: 'registration', name: 'Registration', count: 3, description: 'Property registration matters' }
    ]
  },
  criminal: {
    name: 'Criminal Cases',
    description: 'Criminal defense, prosecution, and appeals',
    subcategories: [
      { id: 'defense', name: 'Criminal Defense', count: 7, description: 'Defense representation cases' },
      { id: 'prosecution', name: 'Prosecution', count: 3, description: 'State prosecution cases' },
      { id: 'appeals', name: 'Criminal Appeals', count: 2, description: 'Appeal proceedings' }
    ]
  },
  civil: {
    name: 'Civil Litigation',
    description: 'Contract disputes, personal injury, and tort cases',
    subcategories: [
      { id: 'contract-dispute', name: 'Contract Disputes', count: 15, description: 'Business and personal contracts' },
      { id: 'personal-injury', name: 'Personal Injury', count: 12, description: 'Accident and injury claims' },
      { id: 'torts', name: 'Tort Cases', count: 4, description: 'Civil wrong and damages' }
    ]
  },
  family: {
    name: 'Family Law',
    description: 'Divorce, custody, adoption, and domestic relations',
    subcategories: [
      { id: 'divorce', name: 'Divorce Cases', count: 8, description: 'Marriage dissolution proceedings' },
      { id: 'custody', name: 'Child Custody', count: 5, description: 'Child custody and support' },
      { id: 'adoption', name: 'Adoption', count: 2, description: 'Adoption proceedings' }
    ]
  },
  corporate: {
    name: 'Corporate Law',
    description: 'Business formation, contracts, and compliance',
    subcategories: [
      { id: 'formation', name: 'Business Formation', count: 4, description: 'Company setup and structure' },
      { id: 'contracts', name: 'Corporate Contracts', count: 3, description: 'Business agreements' },
      { id: 'compliance', name: 'Compliance', count: 2, description: 'Regulatory compliance matters' }
    ]
  }
};

export default function CategoryDetail({ categoryId }: CategoryDetailProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
    return <div>Category not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block cursor-pointer">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{category.name}</h1>
          <p className="text-gray-600">{category.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {category.subcategories.map((subcategory: any) => (
            <Link key={subcategory.id} href={`/subcategory/${categoryId}/${subcategory.id}`} className="cursor-pointer">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg">
                    <i className="ri-folder-line text-xl"></i>
                  </div>
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                    {subcategory.count} cases
                  </span>
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
      </div>
    </div>
  );
}
