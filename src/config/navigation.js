
import { ROLES, PATHS } from './roles';

export const NAV_ITEMS = [
  {
    label: 'Dashboard',
    path: PATHS.DASHBOARD,
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TEAMLEADER, ROLES.TEAMMEMBER]
  },
  {
    label: 'User Management',
    path: PATHS.USERS,
    roles: [ROLES.ADMIN, ROLES.MANAGER]
  },
  {
    label: 'Attendance',
    path: PATHS.ATTENDANCE,
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TEAMLEADER, ROLES.TEAMMEMBER]
  },
  {
    label: 'Inventory',
    subItems: [
      {
        label: 'Stock Count',
        path: PATHS.STOCK_COUNT,
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TEAMLEADER]
      },
      {
        label: 'Waste Management',
        path: PATHS.WASTE_MANAGEMENT,
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TEAMLEADER]
      },
      {
        label: 'Stock Movement',
        path: PATHS.STOCK_MOVEMENT,
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TEAMLEADER]
      }
    ],
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TEAMLEADER]
  }
];