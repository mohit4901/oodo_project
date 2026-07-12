import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import clsx from 'clsx';

export const Sidebar = () => {
  const { logout, user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Fleet', path: '/fleet', icon: Truck },
    { name: 'Drivers', path: '/drivers', icon: Users },
    { name: 'Trips', path: '/trips', icon: Route },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench },
    { name: 'Fuel & Expense', path: '/expenses', icon: Fuel },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-bg-sidebar border-r border-border-thin flex flex-col justify-between h-screen sticky top-0 text-gray-300">
      <div className="flex flex-col gap-6">
        {/* Brand Info */}
        <div className="flex items-center gap-2 p-6 border-b border-border-thin select-none">
          <Truck className="h-6 w-6 text-accent-orange" />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">TransitOps</h1>
            <span className="text-[10px] text-gray-500 font-medium">Operations Center</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1 px-4">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-sm border transition-colors cursor-pointer select-none',
                  isActive
                    ? 'bg-accent-orange/10 border-accent-orange text-white'
                    : 'bg-transparent border-transparent hover:bg-[#222] text-gray-400 hover:text-white'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Info / Logout */}
      <div className="p-4 border-t border-border-thin flex flex-col gap-4">
        {user && (
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="h-8 w-8 rounded-sm bg-accent-orange/20 border border-accent-orange/40 flex items-center justify-center text-sm font-bold text-accent-orange select-none">
              {user.name[0].toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-semibold text-gray-200 truncate leading-none mb-1">{user.name}</span>
              <span className="text-[10px] text-gray-500 truncate capitalize">{user.role.replace('_', ' ')}</span>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-sm border border-transparent hover:bg-red-950/20 hover:border-red-900/50 hover:text-red-400 text-gray-400 transition-colors cursor-pointer w-full select-none"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
