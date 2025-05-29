import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ROLES } from '../config/roles';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Sidebar = ({ user }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isCashManagementOpen, setIsCashManagementOpen] = useState(false);
  const [isItemsManagementOpen, setIsItemsManagementOpen] = useState(false);
  const [isCustomerTrackingOpen, setIsCustomerTrackingOpen] = useState(false);
  
  const isAdmin = user?.role === ROLES.ADMIN;
  const isManager = user?.role === ROLES.MANAGER;
  const isTeamLeader = user?.role === ROLES.TEAMLEADER;
  const isTeamMember = user?.role === ROLES.TEAMMEMBER;

  const formatTime = (date) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="w-64 bg-white h-[100vh] p-4 flex flex-col border-r border-gray-200 fixed top-0 left-0">
      {/* Brand Header */}
      <div className="text-gray-800 mb-6">
        <h1 className="text-xl font-bold mb-1">BHX - Bhookie</h1>
        <div className="h-px bg-gray-200 w-full"></div>
      </div>

      {/* User Info */}
      <div className="text-gray-800 mb-8">
        <h2 className="text-lg font-semibold">{user?.name}</h2>
        <p className="text-sm text-gray-600">{user?.role}</p>
        <p className="text-xs text-gray-500 mt-1">
          Active since: {formatTime(user?.createdAt)}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        <button 
          className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-md text-sm"
          onClick={() => navigate('/dashboard')}
        >
          Dashboard
        </button>
        
        {(isAdmin || isManager || isTeamLeader) && (
          <button
            className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-md text-sm"
            onClick={() => navigate('/users')}
          >
            User Management
          </button>
        )}
        
        {(isAdmin || isManager || isTeamLeader || isTeamMember) && (
          <button
            className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-md text-sm"
            onClick={() => navigate('/attendance')}
          >
            Attendance Records
          </button>
        )}
        
        {(isAdmin || isManager || isTeamLeader) && (
          <>
            {/* Inventory */}
            <div className="space-y-1">
              <button
                className="w-full flex justify-between items-center px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-md text-sm"
                onClick={() => setIsInventoryOpen(!isInventoryOpen)}
              >
                <span>Inventory</span>
                {isInventoryOpen ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </button>
              
              {isInventoryOpen && (
                <div className="ml-4 space-y-1">
                  <button
                    className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm"
                    onClick={() => navigate('/inventory/stock-count')}
                  >
                    Stock Count
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm"
                    onClick={() => navigate('/inventory/waste-management')}
                  >
                    Waste Management
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm"
                    onClick={() => navigate('/inventory/stock-Movement')}
                  >
                    Stock Movement
                  </button>
                </div>
              )}
            </div>

            {/* Cash Management */}
            <div className="space-y-1">
              <button
                className="w-full flex justify-between items-center px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-md text-sm"
                onClick={() => setIsCashManagementOpen(!isCashManagementOpen)}
              >
                <span>Cash Management</span>
                {isCashManagementOpen ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </button>
              
              {isCashManagementOpen && (
                <div className="ml-4 space-y-1">
                  <button
                    className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm"
                    onClick={() => navigate('/cash-management/open-cashier')}
                  >
                    Open Cashier
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm"
                    onClick={() => navigate('/cash-management/close-cashier')}
                  >
                    Close Cashier
                  </button>
                </div>
              )}
            </div>

            {/* Items Management */}
            <div className="space-y-1">
              <button
                className="w-full flex justify-between items-center px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-md text-sm"
                onClick={() => setIsItemsManagementOpen(!isItemsManagementOpen)}
              >
                <span>Items Management</span>
                {isItemsManagementOpen ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </button>
              
              {isItemsManagementOpen && (
                <div className="ml-4 space-y-1">
                  <button
                    className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm"
                    onClick={() => navigate('/items-management/categories')}
                  >
                    Categories
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm"
                    onClick={() => navigate('/items-management/items')}
                  >
                    Items
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {isAdmin && (
          <div className="space-y-1">
            <button
              className="w-full flex justify-between items-center px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-md text-sm"
              onClick={() => setIsCustomerTrackingOpen(!isCustomerTrackingOpen)}
            >
              <span>Customer Tracking</span>
              {isCustomerTrackingOpen ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </button>
            
            {isCustomerTrackingOpen && (
              <div className="ml-4 space-y-1">
                <button
                  className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm"
                  onClick={() => navigate('/customer-tracking/reports')}
                >
                  Customer Report
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm"
                  onClick={() => navigate('/customer-tracking/kot')}
                >
                  KOT Reports
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Logout */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 rounded-md text-sm"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;