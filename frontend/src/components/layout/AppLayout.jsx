import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';

export const AppLayout = () => {
  return (
    <div className="flex min-h-screen bg-bg-primary text-gray-200">
      {/* Fixed Sidebar navigation */}
      <Sidebar />

      {/* Main layout context */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        
        {/* Scrollable Viewport Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
