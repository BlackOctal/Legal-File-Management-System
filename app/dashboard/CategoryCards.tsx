
'use client';
import Link from 'next/link';

const categories = [
  {
    id: 'financial',
    name: 'Financial Cases',
    description: 'Loan settlements, debt recovery, bankruptcy cases',
    icon: 'ri-money-dollar-circle-line',
    color: 'bg-green-50 border-green-200 hover:bg-green-100',
    iconColor: 'text-green-600',
    count: 24
  },
  {
    id: 'deeds',
    name: 'Property Deeds',
    description: 'Property transfers, title disputes, registration',
    icon: 'ri-home-4-line',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    iconColor: 'text-blue-600',
    count: 18
  },
  {
    id: 'criminal',
    name: 'Criminal Cases',
    description: 'Criminal defense, prosecution, appeals',
    icon: 'ri-scales-3-line',
    color: 'bg-red-50 border-red-200 hover:bg-red-100',
    iconColor: 'text-red-600',
    count: 12
  },
  {
    id: 'civil',
    name: 'Civil Litigation',
    description: 'Contract disputes, personal injury, torts',
    icon: 'ri-file-text-line',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    iconColor: 'text-purple-600',
    count: 31
  },
  {
    id: 'family',
    name: 'Family Law',
    description: 'Divorce, custody, adoption, domestic relations',
    icon: 'ri-group-line',
    color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
    iconColor: 'text-orange-600',
    count: 15
  },
  {
    id: 'corporate',
    name: 'Corporate Law',
    description: 'Business formation, contracts, compliance',
    icon: 'ri-building-line',
    color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
    iconColor: 'text-indigo-600',
    count: 9
  }
];

export default function CategoryCards() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Case Categories</h2>
        <Link href="/cases" className="text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer">
          View All Cases →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category) => (
          <Link key={category.id} href={`/category/${category.id}`} className="cursor-pointer">
            <div className={`${category.color} border-2 rounded-xl p-6 transition duration-200`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 flex items-center justify-center ${category.iconColor} bg-white rounded-lg`}>
                  <i className={`${category.icon} text-xl`}></i>
                </div>
                <span className="bg-white text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                  {category.count} cases
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.name}</h3>
              <p className="text-gray-600 text-sm">{category.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
