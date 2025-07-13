'use client';
import { ReactNode } from 'react';
import DashboardHeader from '../../app/dashboard/DashboardHeader';

interface PageLayoutProps {
  children: ReactNode;
  user: any;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageLayout({ children, user, title, subtitle, actions }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(title || subtitle || actions) && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                {title && <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>}
                {subtitle && <p className="text-gray-600">{subtitle}</p>}
              </div>
              {actions && <div>{actions}</div>}
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}