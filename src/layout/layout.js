// import React from 'react';
// import { Outlet } from 'react-router-dom';
// import { useAuth } from '../auth/AuthContext';
// import Sidebar from '../component/Sidebar';

// const Layout = () => {
//   const { user } = useAuth();

//   // If no user (e.g., during session restoration), return null
//   if (!user) {
//     return null;
//   }

//   return (
//   <div className="flex min-h-screen">
//       {/* Sidebar is fixed and takes up 256px width */}
//       <Sidebar user={user} />

//       {/* Main content area with padding to avoid overlapping the fixed sidebar */}
//       <div className="flex-1 pl-64">
//         <Outlet />
//       </div>
//     </div>
//   );
// };

// export default Layout;

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Sidebar from '../component/Sidebar';
import { FiMenu, FiX } from 'react-icons/fi';

const Layout = () => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Track sidebar state for mobile
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Track collapsed state for desktop

  // If no user (e.g., during session restoration), return null
  if (!user) {
    return null;
  }

  // Toggle sidebar open/close on mobile
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Toggle sidebar collapsed/expanded on desktop
  const toggleCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Calculate sidebar width based on state
  const sidebarWidth = isSidebarCollapsed ? 'w-16' : 'w-64'; // 64px collapsed, 256px expanded
  const mainContentPadding = isSidebarCollapsed ? 'pl-16' : 'pl-64'; // Adjust padding accordingly

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar
        user={user}
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={toggleCollapse}
        className={`fixed inset-y-0 left-0 z-30 bg-white shadow-md transition-all duration-300 
          ${sidebarWidth} 
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      />

      {/* Mobile Overlay: Show when sidebar is open on mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 
          ${isSidebarOpen ? 'md:pl-64' : mainContentPadding} 
          md:min-h-screen bg-gray-50`}
      >
        {/* Mobile Toggle Button */}
        <button
          className="fixed top-4 left-4 z-40 p-2 text-gray-600 bg-white rounded-md shadow-md md:hidden"
          onClick={toggleSidebar}
        >
          {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>

        {/* Outlet for child routes */}
        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;