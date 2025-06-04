import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import Login from './Login';
import Dashboard from './pages/Dashboard';
import Unauthorized from './Unauthorized';
import { ROLES } from './config/roles';
import Layout from '../src/layout/layout';
import Users from '../src/pages/Users';
import Attendance from '../src/pages/Attendance';
import UserDetails from '../src/pages/UserDetails';

// Inventroy 
import StockCount from './pages/inventory/StockCount';
import WasteManagement from '../src/pages/inventory/WasteManagement';
import InventoryAndWasteHistory from '../src/pages/inventory/StockMovement';
import InventoryRecords from "./pages/inventory/inventoryrecords";
import AddInventory from './pages/inventory/Addinventory';

// Specific to admin 
import AddUser from "../src/pages/admin/AddUser";
import ChangePhoneNumber from "../src/pages/admin/phoneNumberChange"

// Specific to TEAMMEMBER 
import ViewDetails from "./pages/teammember/ViewDetails";

//Items Management
import Categories from "../src/pages/itemsManagement/categories";
import ItemsManager from "../src/pages/itemsManagement/items";
import Sauces from "../src/pages/itemsManagement/sauces";

// Cash Management imports
import OpenCashier from './pages/cashManagement/OpenCashier';
import CloseCashier from './pages/cashManagement/CloseCashier';
import BankingPage from './pages/cashManagement/BankingPage';
import SafeCountPage from './pages/cashManagement/SafeCountPage';
import TransferFloats from './pages/cashManagement/TransferFloats';


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
          <Route path="/attendance" element={<Attendance />} />
        </Route>
      </Route>

      {/* Admin and Manager only routes */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.TEAMLEADER]} />}>
        <Route element={<Layout />}>
          <Route path="/users" element={<Users />} />
          <Route path="/users/:userId" element={<UserDetails />} />
          <Route path="/users/add-employee" element={<AddUser />} />
          <Route path="/users/changephoneNumber" element={<ChangePhoneNumber />} />
        </Route>
      </Route>

      {/* for TeamMember  */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.TEAMMEMBER]} />}>
        <Route element={<Layout />}>
          <Route path="/viewDetails" element={<ViewDetails />} />
        </Route>
      </Route>

      {/* Inventory routes for Admin, Manager, and Team Leader */}
      <Route element={<ProtectedRoute allowedRoles={[
        ROLES.ADMIN,
        ROLES.MANAGER,
        ROLES.TEAMLEADER
      ]} />}>
        <Route element={<Layout />}>
          <Route path="/inventory/stock-count" element={<StockCount />} />
          <Route path="/inventory/waste-management" element={<WasteManagement />} />
          <Route path="/inventory/stock-movement" element={<InventoryAndWasteHistory />} />
          <Route path="/inventory/inventoryrecords" element={<InventoryRecords />} />
          <Route path="/inventory/addinventory" element={<AddInventory />} />
        </Route>
      </Route>


      {/* Cash Management routes for Admin, Manager, and Team Leader */}
      <Route element={<ProtectedRoute allowedRoles={[
        ROLES.ADMIN,
        ROLES.MANAGER,
        ROLES.TEAMLEADER
      ]} />}>
        <Route element={<Layout />}>
          <Route path="/cash-management/open-cashier" element={<OpenCashier />} />
          <Route path="/cash-management/close-cashier" element={<CloseCashier />} />
          <Route path="/cash-management/banking" element={<BankingPage />} />
          <Route path="/cash-management/safe-count" element={<SafeCountPage />} />
          <Route path="/cash-management/transfer-floats" element={<TransferFloats />} />
        </Route>
      </Route>



      {/* Items Management for Admin  */}
      <Route element={<ProtectedRoute allowedRoles={[
        ROLES.ADMIN,
        ROLES.MANAGER,
        ROLES.TEAMLEADER
      ]} />}>
        <Route element={<Layout />}>
          <Route path="/itemsmanagement/categories" element={<Categories />} />
          <Route path="/itemsmanagement/items" element={<ItemsManager />} />
          <Route path="/itemsmanagement/sauces" element={<Sauces />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
