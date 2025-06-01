// Import role constants and path constants to ensure consistency and avoid hardcoding
import { ROLES, PATHS } from './roles';

// Navigation items used for rendering the sidebar or menu dynamically based on user role
export const NAV_ITEMS = [
  {
    // Main dashboard visible to all roles
    label: 'Dashboard',
    path: PATHS.DASHBOARD,
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TEAMLEADER, ROLES.TEAMMEMBER]
  },
  {
    // User Management visible only to Admins and Managers
    label: 'User Management',
    path: PATHS.USERS,
    roles: [ROLES.ADMIN, ROLES.MANAGER]
  },
  {
    // Attendance page available to all roles
    label: 'Attendance',
    path: PATHS.ATTENDANCE,
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TEAMLEADER]
  },
    {
    // Attendance page available to all roles
    label: 'Attendance',
    path: PATHS.MEMBERATTENDANCE,
    roles: [ROLES.TEAMMEMBER]
  },
  {
    label: 'View Details',
    path: PATHS.VIEWDETAILS,
    roles: [ROLES.TEAMMEMBER]
  },
  {
    // Inventory is a collapsible section with sub-items, only for Admin, Manager, and Team Leader
    label: 'Inventory',
    subItems: [
      {
        // Sub-navigation for Stock Count under Inventory
        label: 'Stock Count',
        path: PATHS.STOCK_COUNT,
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TEAMLEADER]
      },
      {
        // Sub-navigation for Waste Management
        label: 'Waste Management',
        path: PATHS.WASTE_MANAGEMENT,
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TEAMLEADER]
      },
      {
        // Sub-navigation for Stock Movement
        label: 'Stock Movement',
        path: PATHS.STOCK_MOVEMENT,
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TEAMLEADER]
      }
    ],
    // Only show the Inventory section for these roles
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TEAMLEADER]
  }
];
