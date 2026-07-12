import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Bell, Search, User } from 'lucide-react';
import toast from 'react-hot-toast';

export const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Maps pathnames to screen header titles
  const pathTitleMap = {
    '/dashboard': 'Dashboard',
    '/fleet': 'Vehicle Registry',
    '/drivers': 'Driver & Safety Profiles',
    '/trips': 'Trip Dispatcher',
    '/maintenance': 'Maintenance Log',
    '/expenses': 'Fuel & Expense Management',
    '/analytics': 'Reports & Analytics',
    '/settings': 'Settings & RBAC',
  };

  const currentTitle = pathTitleMap[location.pathname] || 'TransitOps';

  return (
    <header className="h-16 border-b border-border-thin bg-[#121212]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 text-gray-200">
      {/* Title */}
      <h2 className="text-base font-bold text-white tracking-wide font-sans uppercase">
        {currentTitle}
      </h2>

      {/* Global Actions */}
      <div className="flex items-center gap-6">
        {/* Search Field */}
        <div className="relative w-64 hidden sm:block">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search assets, trips, drivers..."
            onClick={() => toast('Global search activation placeholder.', { icon: '🔍' })}
            className="w-full bg-[#181818] border border-border-thin rounded-sm pl-9 pr-4 py-1.5 text-xs text-gray-300 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-accent-orange focus:border-accent-orange cursor-pointer"
          />
        </div>

        {/* Notifications */}
        <button
          onClick={() => toast('No new system alerts.', { icon: '🔔' })}
          className="relative p-1.5 bg-[#181818] border border-border-thin rounded-sm hover:bg-[#222] text-gray-400 hover:text-white transition-colors cursor-pointer select-none"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-accent-orange rounded-full" />
        </button>

        {/* User profile identifier */}
        {user && (
          <div className="flex items-center gap-3 pl-4 border-l border-border-thin select-none">
            <div className="flex flex-col items-end">
              <span className="text-xs font-semibold text-gray-200">{user.name}</span>
              <span className="text-[9px] font-bold text-accent-orange tracking-widest uppercase">
                {user.role.replace('_', ' ')}
              </span>
            </div>
            <div className="h-8 w-8 rounded-sm bg-accent-orange/10 border border-accent-orange/30 flex items-center justify-center text-accent-orange">
              <User className="h-4 w-4" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
