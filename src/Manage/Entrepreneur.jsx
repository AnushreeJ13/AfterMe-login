import React, { useState } from 'react';

const Entrepreneur = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  // SVG Icons as components
  const FileTextIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );

  const UsersIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );

  const CalendarIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );

  const BuildingIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
      <path d="M9 22v-4h6v4"/>
      <path d="M8 6h.01"/>
      <path d="M16 6h.01"/>
      <path d="M12 6h.01"/>
      <path d="M12 10h.01"/>
      <path d="M12 14h.01"/>
      <path d="M16 10h.01"/>
      <path d="M16 14h.01"/>
      <path d="M8 10h.01"/>
      <path d="M8 14h.01"/>
    </svg>
  );

  const LockIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );

  const MonitorIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  );

  const UserCheckIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="8.5" cy="7" r="4"/>
      <polyline points="17 11 19 13 23 9"/>
    </svg>
  );

  const LightbulbIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="9" y1="18" x2="15" y2="18"/>
      <line x1="10" y1="22" x2="14" y2="22"/>
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
    </svg>
  );

  const PlusIcon = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );

  const ChevronRightIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );

  const categories = [
    {
      id: 1,
      title: 'Formal Business Documentation',
      Icon: FileTextIcon,
      count: 0,
      description: 'Business registration, licenses, and legal documents'
    },
    {
      id: 2,
      title: 'Organisation Structure / Involvement',
      Icon: UsersIcon,
      count: 0,
      description: 'Organizational charts, roles, and responsibilities'
    },
    {
      id: 3,
      title: 'Key Supplier Agreements / Subscriptions',
      Icon: CalendarIcon,
      count: 0,
      description: 'Vendor contracts and subscription services'
    },
    {
      id: 4,
      title: 'Commercial Premises Ownership deeds or Rental Agreements',
      Icon: BuildingIcon,
      count: 0,
      description: 'Property documents and lease agreements'
    },
    {
      id: 5,
      title: 'Security access codes/keys',
      Icon: LockIcon,
      count: 0,
      description: 'Access credentials and security information'
    },
    {
      id: 6,
      title: 'Business software login/access',
      Icon: MonitorIcon,
      count: 0,
      description: 'Software licenses and login credentials'
    },
    {
      id: 7,
      title: 'HR / succession planning',
      Icon: UserCheckIcon,
      count: 0,
      description: 'Employee records and succession plans'
    },
    {
      id: 8,
      title: 'Miscellaneous',
      Icon: LightbulbIcon,
      count: 0,
      description: 'Other important business documents'
    }
  ];

  if (selectedCategory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 p-8">
        <nav className="flex gap-8 mb-8 pb-4 border-b-4 border-teal-500">
          <a href="#" className="text-gray-700 hover:text-teal-500 font-medium transition-colors">Dashboard</a>
          <a href="#" className="text-gray-700 hover:text-teal-500 font-medium transition-colors">Manage Your Life After Me</a>
          <a href="#" className="text-gray-700 hover:text-teal-500 font-medium transition-colors">My Trusted Appointees</a>
          <a href="#" className="text-gray-700 hover:text-teal-500 font-medium transition-colors">My Expert Advisers</a>
          <a href="#" className="text-gray-700 hover:text-teal-500 font-medium transition-colors">Security</a>
        </nav>

        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-8 text-sm">
            <button 
              onClick={() => setSelectedCategory(null)} 
              className="text-purple-600 hover:opacity-70 transition-opacity"
            >
              My legacy assets memories
            </button>
            <span className="text-purple-600">/</span>
            <span className="text-purple-600">Entrepreneur</span>
            <span className="text-purple-600">/</span>
            <span className="text-purple-600 font-medium">{selectedCategory.title}</span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-12">Legacy Assets Memories</h1>

          <div className="bg-white rounded-3xl p-16 shadow-lg hover:shadow-xl transition-shadow min-h-[400px] flex flex-col items-center justify-center">
            <button className="w-32 h-32 bg-white border-4 border-dashed border-teal-500 rounded-full flex items-center justify-center text-teal-500 hover:bg-teal-50 hover:border-solid hover:scale-105 transition-all mb-6">
              <PlusIcon />
            </button>
            <p className="text-gray-500 text-lg font-medium">Add your first document</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 p-8">
      <div className="mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-2">Legacy Assets Memories</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-purple-600">My legacy assets memories</span>
          <span className="text-purple-600">/</span>
          <span className="text-purple-600 font-medium">Entrepreneur</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
        {categories.map((category) => {
          const IconComponent = category.Icon;
          return (
            <div
              key={category.id}
              onClick={() => setSelectedCategory(category)}
              className="bg-white rounded-3xl p-8 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl shadow-lg relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="mb-6">
                  <div className="w-32 h-32 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all">
                    <IconComponent />
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3 min-h-[3.5rem] leading-tight">
                  {category.title}
                </h3>
                
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  {category.description}
                </p>
                
                <div className="w-full flex items-center justify-between px-5 py-3 border-2 border-gray-200 rounded-xl group-hover:border-teal-500 group-hover:bg-teal-50/50 transition-all">
                  <span className="text-sm font-medium text-gray-900">{category.count} documents</span>
                  <ChevronRightIcon />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <footer className="text-center text-gray-400 text-sm pt-8 border-t border-gray-300">
        Copyright © 2026 Life After Me B.V., All Rights Reserved.
      </footer>
    </div>
  );
};

export default Entrepreneur;