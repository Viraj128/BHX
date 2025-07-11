// import { Routes, Route, Navigate } from 'react-router-dom';
// import { ProtectedRoute } from './auth/ProtectedRoute';
// import Login from './Login';
// import Dashboard from './pages/Dashboard';
// import Unauthorized from './Unauthorized';
// import { ROLES } from './config/roles';
// import Layout from '../src/layout/layout';
// import Users from '../src/pages/Users';
// import Attendance from '../src/pages/Attendance';
// import UserDetails from '../src/pages/UserDetails';
// import MemberAttendance from './pages/MemberAttendance';

// // Inventroy 
// import StockCount from './pages/inventory/StockCount';
// import WasteManagement from '../src/pages/inventory/WasteManagement';
// import InventoryAndWasteHistory from '../src/pages/inventory/StockMovement';
// import InventoryRecords from "./pages/inventory/inventoryrecords";
// import AddInventory from './pages/inventory/Addinventory';

// // Specific to admin 
// import AddUser from "../src/pages/admin/AddUser";
// import ChangePhoneNumber from "../src/pages/admin/phoneNumberChange"

// // Specific to TEAMMEMBER 
// import ViewDetails from "./pages/teammember/ViewDetails";

// //Items Management
// import Categories from "../src/pages/itemsManagement/categories";
// import ItemsManager from "../src/pages/itemsManagement/items";
// import Sauces from "../src/pages/itemsManagement/sauces";

// // Cash Management imports
// import OpenCashier from './pages/cashManagement/OpenCashier';
// import CloseCashier from './pages/cashManagement/CloseCashier';
// import BankingPage from './pages/cashManagement/BankingPage';
// import SafeCountPage from './pages/cashManagement/SafeCountPage';
// import TransferFloats from './pages/cashManagement/TransferFloats';
// import MoneyMovementPage from './pages/cashManagement/MoneyMovement';

// //Reports 
// import TrackInventoryWaste from './pages/reports/trakInvetroyWaste';
// import MonthlySalesDashboard from './pages/reports/monthlySale';
// import HourlySalesDashboard from './pages/reports/hourslysale';
// import WeeklySalesDashboard from './pages/reports/weeklySale';
// import SalesPerItemsReport from './pages/reports/totalsaleperitem';
// import CustomerOrderTrendReport from './pages/reports/customerTrend';
// import CustomerReport from './pages/reports/CustomerReport';
// import KOT from './pages/reports/KOT';

// import HACCPFormViewer from './pages/admin/HACCAPLogfoodCart';
// import HACCPFormViewerShop from './pages/admin/HACCAPLogfshop';
// function AppRoutes() {
//   return (
//     <Routes>
//       <Route path="/" element={<Login />} />
//       <Route path="/unauthorized" element={<Unauthorized />} />

//       {/* Common routes for all authenticated users */}
//       <Route element={<ProtectedRoute allowedRoles={[
//         ROLES.ADMIN,
//         ROLES.MANAGER,
//         ROLES.TEAMLEADER,
//         ROLES.TEAMMEMBER
//       ]} />}>
//         <Route element={<Layout />}>
//           <Route path="/dashboard" element={<Dashboard />} />
//         </Route>
//       </Route>

//       <Route element={<ProtectedRoute allowedRoles={[
//         ROLES.ADMIN,
//         ROLES.MANAGER,
//         ROLES.TEAMLEADER,
//       ]} />}>
//         <Route element={<Layout />}>
//           <Route path="/attendance" element={<Attendance />} />
//         </Route>
//       </Route>

//       <Route element={<ProtectedRoute allowedRoles={[
//         ROLES.TEAMMEMBER,
//         ROLES.MANAGER,
//         ROLES.TEAMLEADER,
//       ]} />}>
//         <Route element={<Layout />}>
//           <Route path="/memberAttendance" element={<MemberAttendance />} />
//         </Route>
//       </Route>

//       {/* Admin and Manager only routes */}
//       <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.TEAMLEADER]} />}>
//         <Route element={<Layout />}>
//           <Route path="/users" element={<Users />} />
//           <Route path="/users/:userId" element={<UserDetails />} />
//           <Route path="/users/add-employee" element={<AddUser />} />
//           <Route path="/users/changephoneNumber" element={<ChangePhoneNumber />} />
//         </Route>
//       </Route>

//       {/* for TeamMember  */}
//       <Route element={<ProtectedRoute allowedRoles={[ROLES.TEAMMEMBER]} />}>
//         <Route element={<Layout />}>
//           <Route path="/viewDetails" element={<ViewDetails />} />
//         </Route>
//       </Route>

//       {/* Inventory routes for Admin, Manager, and Team Leader */}
//       <Route element={<ProtectedRoute allowedRoles={[
//         ROLES.ADMIN,
//         ROLES.MANAGER,
//         ROLES.TEAMLEADER
//       ]} />}>
//         <Route element={<Layout />}>
//           <Route path="/inventory/stock-count" element={<StockCount />} />
//           <Route path="/inventory/waste-management" element={<WasteManagement />} />
//           <Route path="/inventory/stock-movement" element={<InventoryAndWasteHistory />} />
//           <Route path="/inventory/inventoryrecords" element={<InventoryRecords />} />
//           <Route path="/inventory/addinventory" element={<AddInventory />} />
//         </Route>
//       </Route>


//       {/* Cash Management routes for Admin, Manager, and Team Leader */}
//       <Route element={<ProtectedRoute allowedRoles={[
//         ROLES.ADMIN,
//         ROLES.MANAGER,
//         ROLES.TEAMLEADER
//       ]} />}>
//         <Route element={<Layout />}>
//           <Route path="/cash-management/open-cashier" element={<OpenCashier />} />
//           <Route path="/cash-management/close-cashier" element={<CloseCashier />} />
//           <Route path="/cash-management/banking" element={<BankingPage />} />
//           <Route path="/cash-management/safe-count" element={<SafeCountPage />} />
//           <Route path="/cash-management/transfer-floats" element={<TransferFloats />} />
//           <Route path="/cash-management/money-movement" element={<MoneyMovementPage />} />
//         </Route>
//       </Route>



//       {/* Items Management for Admin  */}
//       <Route element={<ProtectedRoute allowedRoles={[
//         ROLES.ADMIN,
//         ROLES.MANAGER,
//         ROLES.TEAMLEADER
//       ]} />}>
//         <Route element={<Layout />}>
//           <Route path="/itemsmanagement/categories" element={<Categories />} />
//           <Route path="/itemsmanagement/items" element={<ItemsManager />} />
//           <Route path="/itemsmanagement/sauces" element={<Sauces />} />
//         </Route>
//       </Route>

//       {/* Reports for Admin , Manager  */}
//       <Route element={<ProtectedRoute allowedRoles={[
//         ROLES.ADMIN,
//         ROLES.MANAGER
//       ]} />}>
//         <Route element={<Layout />}>
//           <Route path="/reports/trackingWaste" element={<TrackInventoryWaste />} />
//           <Route path="/reports/totalsaleperitem" element={<SalesPerItemsReport />} />
//           <Route path="/reports/monthlySale" element={<MonthlySalesDashboard />} />
//           <Route path="/reports/weeklySale" element={<WeeklySalesDashboard />} />
//           <Route path="/reports/hourlySale" element={<HourlySalesDashboard />} />
//           <Route path="/reports/customerTrend" element={<CustomerOrderTrendReport />} />
//           <Route path="/reports/kot" element={<KOT />} />
//           <Route path="/reports/customerreports" element={<CustomerReport />} />
//         </Route>
//       </Route>

//       {/* Reports for Admin */}
//       <Route element={<ProtectedRoute allowedRoles={[
//         ROLES.ADMIN,
//       ]} />}>
//         <Route element={<Layout />}>
//           <Route path="/haccaplog/ShopCarthaccap" element={<HACCPFormViewerShop />} />
//           <Route path="/haccaplog/foodCarthaccap" element={<HACCPFormViewer />} />
//         </Route>
//       </Route>

//       <Route path="*" element={<Navigate to="/" replace />} />
//     </Routes>
//   );
// }

// export default AppRoutes;



//WITH KART CODE:
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
import MemberAttendance from './pages/MemberAttendance';

// Main Inventory
import StockCount from './pages/inventory/mainInventory/StockCount';
import WasteManagement from './pages/inventory/mainInventory/WasteManagement';
import InventoryAndWasteHistory from './pages/inventory/mainInventory/StockMovement';
import InventoryRecords from './pages/inventory/mainInventory/inventoryrecords';
import AddInventory from './pages/inventory/mainInventory/Addinventory';

// Cart Inventory
import CartStockCount from './pages/inventory/cartInventory/cartStockCount';
import CartWasteManagement from './pages/inventory/cartInventory/cartWasteManagement';
import CartInventoryAndWasteHistory from './pages/inventory/cartInventory/cartStockMovement';
import CartInventoryRecords from './pages/inventory/cartInventory/cartInventoryRecords';
import CartAddinventory from './pages/inventory/cartInventory/cartAddInventory';



// Specific to admin 
import AddUser from "../src/pages/admin/AddUser";
import ChangePhoneNumber from "../src/pages/admin/phoneNumberChange"

// Specific to TEAMMEMBER 
import ViewDetails from "./pages/teammember/ViewDetails";

// Items Management
import Categories from "../src/pages/itemsManagement/mainItems/categories";
import KartItems from "../src/pages/itemsManagement/kart/KartItems";
import KartCategories from "../src/pages/itemsManagement/kart/KartCategories";
import KartSauces from "../src/pages/itemsManagement/kart/KartSauces";
import Sauces from "../src/pages/itemsManagement/mainItems/sauces";
import ItemsManager from "../src/pages/itemsManagement/mainItems/items";

// Cash Management imports
import OpenCashier from './pages/cashManagement/OpenCashier';
import CloseCashier from './pages/cashManagement/CloseCashier';
import BankingPage from './pages/cashManagement/BankingPage';
import SafeCountPage from './pages/cashManagement/SafeCountPage';
import TransferFloats from './pages/cashManagement/TransferFloats';
import MoneyMovementPage from './pages/cashManagement/MoneyMovement';

// Reports 
import TrackInventoryWaste from './pages/reports/trakInvetroyWaste';
import MonthlySalesDashboard from './pages/reports/monthlySale';
import HourlySalesDashboard from './pages/reports/hourslysale';
import WeeklySalesDashboard from './pages/reports/weeklySale';
import SalesPerItemsReport from './pages/reports/totalsaleperitem';
import CustomerOrderTrendReport from './pages/reports/customerTrend';
import CustomerReport from './pages/reports/CustomerReport';
import KOT from './pages/reports/KOT';


import HACCPFormViewer from './pages/admin/HACCAPLogfoodCart';
import HACCPFormViewerShop from './pages/admin/HACCAPLogfshop';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route element={<ProtectedRoute allowedRoles={[
        ROLES.ADMIN,
        ROLES.MANAGER,
        ROLES.TEAMLEADER,
        ROLES.TEAMMEMBER
      ]} />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[
        ROLES.ADMIN,
        ROLES.MANAGER,
        ROLES.TEAMLEADER,
      ]} />}>
        <Route element={<Layout />}>
          <Route path="/attendance" element={<Attendance />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[
        ROLES.TEAMMEMBER,
        ROLES.MANAGER,
        ROLES.TEAMLEADER,
      ]} />}>
        <Route element={<Layout />}>
          <Route path="/memberAttendance" element={<MemberAttendance />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.TEAMLEADER]} />}>
        <Route element={<Layout />}>
          <Route path="/users" element={<Users />} />
          <Route path="/users/:userId" element={<UserDetails />} />
          <Route path="/users/add-employee" element={<AddUser />} />
          <Route path="/users/changephoneNumber" element={<ChangePhoneNumber />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[ROLES.TEAMMEMBER]} />}>
        <Route element={<Layout />}>
          <Route path="/viewDetails" element={<ViewDetails />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[
        ROLES.ADMIN,
        ROLES.MANAGER,
        ROLES.TEAMLEADER
      ]} />}>
        <Route element={<Layout />}>
          <Route path="/inventory/mainInventory/stock-count" element={<StockCount />} />
          <Route path="/inventory/mainInventory/waste-management" element={<WasteManagement />} />
          <Route path="/inventory/mainInventory/stock-movement" element={<InventoryAndWasteHistory />} />
          <Route path="/inventory/mainInventory/inventoryrecords" element={<InventoryRecords />} />
          <Route path="/inventory/mainInventory/addinventory" element={<AddInventory />} />
          <Route path="/inventory/cartInventory/cartStockCount" element={<CartStockCount />} />
          <Route path="/inventory/cartInventory/cartWasteManagement" element={<CartWasteManagement />} />
          <Route path="/inventory/cartInventory/cartStockMovement" element={<CartInventoryAndWasteHistory />} />
          <Route path="/inventory/cartInventory/cartInventoryRecords" element={<CartInventoryRecords />} />
          <Route path="/inventory/cartInventory/cartAddInventory" element={<CartAddinventory />} />
        </Route>
      </Route>

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
          <Route path="/cash-management/money-movement" element={<MoneyMovementPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[
        ROLES.ADMIN,
        ROLES.MANAGER,
        ROLES.TEAMLEADER
      ]} />}>
        <Route element={<Layout />}>
          <Route path="/items-management/mainItems/categories" element={<Categories />} />
          <Route path="/items-management/mainItems/items" element={<ItemsManager />} />
          <Route path="/items-management/mainItems/sauces" element={<Sauces />} />
          <Route path="/items-management/kart/categories" element={<KartCategories />} />
          <Route path="/items-management/kart/items" element={<KartItems />} />
          <Route path="/items-management/kart/sauces" element={<KartSauces />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[
        ROLES.ADMIN,
        ROLES.MANAGER
      ]} />}>
        <Route element={<Layout />}>
          <Route path="/reports/trackingWaste" element={<TrackInventoryWaste />} />
          <Route path="/reports/totalsaleperitem" element={<SalesPerItemsReport />} />
          <Route path="/reports/monthlySale" element={<MonthlySalesDashboard />} />
          <Route path="/reports/weeklySale" element={<WeeklySalesDashboard />} />
          <Route path="/reports/hourlySale" element={<HourlySalesDashboard />} />
          <Route path="/reports/customerTrend" element={<CustomerOrderTrendReport />} />
          <Route path="/reports/kot" element={<KOT />} />
          <Route path="/reports/customerreports" element={<CustomerReport />} />
        </Route>
      </Route>

      {/* Reports for Admin */}
      <Route element={<ProtectedRoute allowedRoles={[
        ROLES.ADMIN,
      ]} />}>
        <Route element={<Layout />}>
          <Route path="/haccaplog/ShopCarthaccap" element={<HACCPFormViewerShop />} />
          <Route path="/haccaplog/foodCarthaccap" element={<HACCPFormViewer />} />
        </Route>
      </Route>



      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
