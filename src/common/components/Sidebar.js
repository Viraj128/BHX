import React, { useState, useEffect, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from '../../auth/context/AuthContext'; // Updated path for AuthContext
import { ROLES } from '../../config/roles'; // Updated path for ROLES

const Sidebar = () => {
  const { user, logout, isAdmin, isManager, isTeamLeader } = useAuth();
  const [inventoryExpanded, setInventoryExpanded] = useState(false);
  const [cashManagementExpanded, setCashManagementExpanded] = useState(false);
  const [customerTrackingExpanded, setCustomerTrackingExpanded] = useState(false);
  const [tableManagementExpanded, setTableManagementExpanded] = useState(false);
  const [loginTime, setLoginTime] = useState('');

  // Memoized role configuration for navigation links and base paths
  const { links, panelTitle, inventoryBasePath } = useMemo(() => {
    const roleConfig = {
      links: [],
      panelTitle: "System Panel",
      inventoryBasePath: "" // Base path for feature-specific sub-routes
    };

    if (!user) return roleConfig;

    switch (user.role) {
      case ROLES.ADMIN:
        roleConfig.links = [
          { name: "Dashboard", path: "/admin/dashboard" },
          { name: "User Management", path: "/admin/users" },
          { name: "Attendance Records", path: "/admin/AdminAttendance" }
        ];
        roleConfig.panelTitle = "Administration Panel";
        roleConfig.inventoryBasePath = "/admin"; // Base path for admin-specific feature routes
        break;

      case ROLES.MANAGER:
        roleConfig.links = [
          { name: "Performance Dashboard", path: "/manager/dashboard" },
          { name: "Employees Details", path: "/manager/employees" },
          { name: "Attendance", path: "/manager/ManagerAttendance" }
        ];
        roleConfig.panelTitle = "Management Console";
        roleConfig.inventoryBasePath = "/manager"; // Base path for manager-specific feature routes
        break;

      case ROLES.TEAM_LEADER:
        roleConfig.links = [
          { name: "Team Dashboard", path: "/teamleader/dashboard" },
          { name: "Shift Runners", path: "/teamleader/Shiftrunners" },
          { name: "Attendance Tracking", path: "/teamleader/attendance" }
        ];
        roleConfig.panelTitle = "Team Leadership";
        roleConfig.inventoryBasePath = "/teamleader"; // Base path for teamleader-specific feature routes
        break;

      case ROLES.TEAM_MEMBER:
      case ROLES.EMPLOYEE:
        roleConfig.links = [
          { name: "My Profile", path: "/teammember/ViewDetails" },
          { name: "Attendance History", path: "/teammember/MemberAttendance" }
        ];
        roleConfig.panelTitle = user.role === ROLES.TEAM_MEMBER
          ? "My Account Portal"
          : "Employee Portal";
        break;
      default:
        // Handle unknown roles or no role
        roleConfig.links = [];
        roleConfig.panelTitle = "Guest Panel";
        break;
    }

    return roleConfig;
  }, [user]); // Re-calculate when user object changes

  // Effect to format and update login time
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component

    const updateTime = () => {
      if (user?.loginTime && isMounted) {
        const formatted = new Date(user.loginTime).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        setLoginTime(formatted);
      }
    };

    updateTime(); // Initial call
    const timer = setInterval(updateTime, 1000); // Update every second

    // Cleanup function: runs on unmount or before re-running effect
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [user?.loginTime]); // Re-run effect if user's loginTime changes

  return (
    <div className="sidebar-container">
      {/* User Info Section */}
      <div className="user-info-section">
        <div className="user-details">
          <h3 className="user-name">{user?.name || 'Guest User'}</h3>
          <div className="user-meta">
            <span className="user-role">{user?.role || 'No Role Assigned'}</span>
            {loginTime && (
              <span className="login-time">Active since: {loginTime}</span>
            )}
          </div>
        </div>
      </div>

      <div className="scrollable-section">
        {/* Main Navigation Section */}
        <nav className="main-navigation">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active-nav-item' : ''}`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </nav>

        {/* Inventory Section - Visible to Admin, Manager, TeamLeader */}
        {(isAdmin || isManager || isTeamLeader) && (
          <div className="management-section">
            <button
              className={`management-toggle ${inventoryExpanded ? 'expanded' : ''}`}
              onClick={() => setInventoryExpanded(!inventoryExpanded)}
            >
              Inventory
              <span className="toggle-indicator">
                {inventoryExpanded ? '▼' : '▶'}
              </span>
            </button>

            <div className={`management-submenu ${inventoryExpanded ? 'expanded' : ''}`}>
              <NavLink
                to={`${inventoryBasePath}/inventory/wastemanagement`}
                className={({ isActive }) =>
                  `submenu-item ${isActive ? 'active-subitem' : ''}`
                }
              >
                Waste Count
              </NavLink>
              <NavLink
                to={`${inventoryBasePath}/inventory/stockcount`}
                className={({ isActive }) =>
                  `submenu-item ${isActive ? 'active-subitem' : ''}`
                }
              >
                Stock Count
              </NavLink>
              <NavLink
                to={`${inventoryBasePath}/inventory/stockmovement`}
                className={({ isActive }) =>
                  `submenu-item ${isActive ? 'active-subitem' : ''}`
                }
              >
                Stock Movement
              </NavLink>
              <NavLink
                to={`${inventoryBasePath}/inventory/inventoryrecords`}
                className={({ isActive }) =>
                  `submenu-item ${isActive ? 'active-subitem' : ''}`
                }
              >
                Inventory Records
              </NavLink>
              {/* Add Inventory link, if applicable for these roles */}
              {(isAdmin || isManager) && ( // Assuming only Admin and Manager can add inventory
                <NavLink
                  to={`${inventoryBasePath}/inventory/addinventory`}
                  className={({ isActive }) =>
                    `submenu-item ${isActive ? 'active-subitem' : ''}`
                  }
                >
                  Add Inventory
                </NavLink>
              )}
            </div>
          </div>
        )}

        {/* Cash Management Section - Visible to Admin, Manager, TeamLeader */}
        {(isAdmin || isManager || isTeamLeader) && (
          <div className="management-section">
            <button
              className={`management-toggle ${cashManagementExpanded ? 'expanded' : ''}`}
              onClick={() => setCashManagementExpanded(!cashManagementExpanded)}
            >
              Cash Management
              <span className="toggle-indicator">
                {cashManagementExpanded ? '▼' : '▶'}
              </span>
            </button>

            <div className={`management-submenu ${cashManagementExpanded ? 'expanded' : ''}`}>
              <NavLink
                to={`${inventoryBasePath}/cashmanagement/opencashier`}
                className={({ isActive }) =>
                  `submenu-item ${isActive ? 'active-subitem' : ''}`
                }
              >
                Open Cashier
              </NavLink>
              <NavLink
                to={`${inventoryBasePath}/cashmanagement/closecashier`}
                className={({ isActive }) =>
                  `submenu-item ${isActive ? 'active-subitem' : ''}`
                }
              >
                Close Cashier
              </NavLink>
              <NavLink
                to={`${inventoryBasePath}/cashmanagement/safecountpage`}
                className={({ isActive }) =>
                  `submenu-item ${isActive ? 'active-subitem' : ''}`
                }
              >
                Safe Count
              </NavLink>
              <NavLink
                to={`${inventoryBasePath}/cashmanagement/bankingpage`}
                className={({ isActive }) =>
                  `submenu-item ${isActive ? 'active-subitem' : ''}`
                }
              >
                Banking
              </NavLink>
            </div>
          </div>
        )}

        {/* Items Management Section - Visible to Admin, Manager, TeamLeader */}
        {(isAdmin || isManager || isTeamLeader) && (
          <div className="management-section">
            <button
              className={`management-toggle ${tableManagementExpanded ? 'expanded' : ''}`}
              onClick={() => setTableManagementExpanded(!tableManagementExpanded)}
            >
              Items Management
              <span className="toggle-indicator">
                {tableManagementExpanded ? '▼' : '▶'}
              </span>
            </button>

            <div className={`management-submenu ${tableManagementExpanded ? 'expanded' : ''}`}>
              <NavLink
                to={`${inventoryBasePath}/itemsmanagement/categories`}
                className={({ isActive }) =>
                  `submenu-item ${isActive ? 'active-subitem' : ''}`
                }
              >
                Categories
              </NavLink>
              <NavLink
                to={`${inventoryBasePath}/itemsmanagement/sauces`}
                className={({ isActive }) =>
                  `submenu-item ${isActive ? 'active-subitem' : ''}`
                }
              >
                Sauces
              </NavLink>
              <NavLink
                to={`${inventoryBasePath}/itemsmanagement/items`}
                className={({ isActive }) =>
                  `submenu-item ${isActive ? 'active-subitem' : ''}`
                }
              >
                Items
              </NavLink>
            </div>
          </div>
        )}

        {/* Customer Tracking Section - Visible only to Admin */}
        {isAdmin && (
          <div className="management-section">
            <button
              className={`management-toggle ${customerTrackingExpanded ? 'expanded' : ''}`}
              onClick={() => setCustomerTrackingExpanded(!customerTrackingExpanded)}
            >
              Customer Tracking
              <span className="toggle-indicator">
                {customerTrackingExpanded ? '▼' : '▶'}
              </span>
            </button>

            <div className={`management-submenu ${customerTrackingExpanded ? 'expanded' : ''}`}>
              <NavLink
                to={`${inventoryBasePath}/customertracking/customerreport`}
                className={({ isActive }) =>
                  `submenu-item ${isActive ? 'active-subitem' : ''}`
                }
              >
                Customer Report
              </NavLink>
              <NavLink
                to={`${inventoryBasePath}/customertracking/kot`}
                className={({ isActive }) =>
                  `submenu-item ${isActive ? 'active-subitem' : ''}`
                }
              >
                KOT Reports
              </NavLink>
            </div>
          </div>
        )}
      </div>

      {/* Logout Section */}
      <div className="logout-section">
        <button onClick={logout} className="logout-button">
          Logout
        </button>
      </div>
    </div>
  );
};

export default React.memo(Sidebar);
