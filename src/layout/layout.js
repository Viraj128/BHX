import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Sidebar from '../component/Sidebar';

const Layout = () => {
  const { user } = useAuth();

  // If no user (e.g., during session restoration), return null
  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 bg-gray-100">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;