import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import Login from './Login';
import Dashboard from './pages/Dashboard';
import Unauthorized from './Unauthorized';
import { ROLES } from './config/roles';
import Layout from '../src/layout/layout';
// import Users from '../src/pages/Users';
// import Attendance from '../src/pages/Attendance';
// import UserDetails from '../src/pages/UserDetails';
// import StockCount from './pages/inventory/StockCount';
// import WasteManagement from '../src/pages/inventory/WasteManagement';
// import InventoryAndWasteHistory from '../src/pages/inventory/StockMovement';
// import AddUser from "../src/pages/AddUser";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      {/* Common routes for all authenticated users */}
      <Route element={<ProtectedRoute allowedRoles={[
        ROLES.ADMIN, 
        ROLES.MANAGER, 
        ROLES.TEAMLEADER, 
        ROLES.TEAMMEMBER
      ]} />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          {/* <Route path="/attendance" element={<Attendance />} /> */}
        </Route>
      </Route>

      {/* Admin and Manager only routes */}
      {/* <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]} />}>
        <Route element={<Layout />}>
          <Route path="/users" element={<Users />} />
          <Route path="/users/:userId" element={<UserDetails />} />
          <Route path="/users/add-employee" element={<AddUser />} />
        </Route>
      </Route> */}

      {/* Inventory routes for Admin, Manager, and Team Leader */}
      {/* <Route element={<ProtectedRoute allowedRoles={[
        ROLES.ADMIN, 
        ROLES.MANAGER, 
        ROLES.TEAMLEADER
      ]} />}>
        <Route element={<Layout />}>
          <Route path="/inventory/stock-count" element={<StockCount />} />
          <Route path="/inventory/waste-management" element={<WasteManagement />} />
          <Route path="/inventory/stock-movement" element={<InventoryAndWasteHistory />} />
        </Route>
      </Route> */}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;