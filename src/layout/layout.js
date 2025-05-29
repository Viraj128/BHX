// src/component/Layout.js
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

import { Outlet } from 'react-router-dom';

const Layout = () => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 bg-gray-100">
        <Outlet />  {/* Changed from {children} */}
      </main>
    </div>
  );
};
export default Layout;