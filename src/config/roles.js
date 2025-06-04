// // Define role constants to avoid hardcoding role names throughout the app.
// // This improves maintainability and reduces bugs due to typos.
// export const ROLES = {
//   ADMIN: 'admin',
//   MANAGER: 'manager',
//   TEAMLEADER: 'teamleader',
//   TEAMMEMBER: 'teammember',
// };

// // Define path constants to centralize route definitions.
// // Makes it easier to change paths in one place without refactoring multiple files.
// export const PATHS = {
//   DASHBOARD: '/dashboard',
//   USERS: '/users',
//   ATTENDANCE: '/attendance',
//   STOCK_COUNT: '/inventory/stock-count',
//   WASTE_MANAGEMENT: '/inventory/waste-management',
//   INVENTORY_RECORDS: '/inventory/inventoryrecords',
//   STOCK_MOVEMENT: '/inventory/stock-movement',
//   VIEWDETAILS: '/viewDetails',
//   CATEGORIES : '/itemsmanagement/categories',
//   ITEMS : '/itemsmanagement/items',
//   SAUCES : '/itemsmanagement/sauces'
// };

// // Utility function to return the dashboard path.
// // Useful for cases where you might later want to change or add logic to route generation.
// export const getDashboardPath = () => '/dashboard';







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
  MEMBER_ATTENDANCE: '/member-attendance', // CHANGE: Added for TEAMMEMBER attendance
  STOCK_COUNT: '/inventory/stock-count',
  WASTE_MANAGEMENT: '/inventory/waste-management',
  INVENTORY_RECORDS: '/inventory/inventory-records', // CHANGE: Updated to kebab-case
  STOCK_MOVEMENT: '/inventory/stock-movement',
  VIEWDETAILS: '/view-details', // CHANGE: Updated to kebab-case
  CATEGORIES: '/items-management/categories', // CHANGE: Updated to kebab-case
  ITEMS: '/items-management/items', // CHANGE: Updated to kebab-case
  SAUCES: '/items-management/sauces', // CHANGE: Updated to kebab-case
  // CHANGE: Added Cash Management paths
  CASH_MANAGEMENT: '/cash-management',
  CASH_MANAGEMENT_OPEN_CASHIER: '/cash-management/open-cashier',
  CASH_MANAGEMENT_CLOSE_CASHIER: '/cash-management/close-cashier',
  CASH_MANAGEMENT_BANKING: '/cash-management/banking',
  CASH_MANAGEMENT_SAFE_COUNT: '/cash-management/safe-count',
  CASH_MANAGEMENT_TRANSFER_FLOATS: '/cash-management/transfer-floats',
};

// Utility function to return the dashboard path.
// Useful for cases where you might later want to change or add logic to route generation.
export const getDashboardPath = () => '/dashboard';