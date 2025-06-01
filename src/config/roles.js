// Define role constants to avoid hardcoding role names throughout the app.
// This improves maintainability and reduces bugs due to typos.
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  TEAMLEADER: 'teamleader',
  TEAMMEMBER: 'teammember',
};

// Define path constants to centralize route definitions.
// Makes it easier to change paths in one place without refactoring multiple files.
export const PATHS = {
  DASHBOARD: '/dashboard',
  USERS: '/users',
  ATTENDANCE: '/attendance',
  MEMBERATTENDANCE: '/memberattendance',
  STOCK_COUNT: '/inventory/stock-count',
  WASTE_MANAGEMENT: '/inventory/waste-management',
  STOCK_MOVEMENT: '/inventory/stock-movement',
  VIEWDETAILS: '/viewDetails',
};

// Utility function to return the dashboard path.
// Useful for cases where you might later want to change or add logic to route generation.
export const getDashboardPath = () => '/dashboard';
