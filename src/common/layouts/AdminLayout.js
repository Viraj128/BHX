// src/common/layouts/AdminLayout.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "../components/Sidebar"; // Path relative to src/common/layouts

// Import pages from their new feature-based locations
// Dashboard
import Dashboard from "../../dashboard/pages/Dashboard";

// User Management pages
import AddUser from "../../userManagement/pages/AddUser";
import UserDetails from "../../userManagement/pages/UserDetails";
import Users from "../../userManagement/pages/User";
import ChangePhoneNumber from "../../userManagement/pages/phoneNumberChange";

// Attendance pages
import AdminAttendance from "../../attendance/pages/AdminAttendance";

// Inventory pages
import WasteManagement from "../../inventory/pages/WasteManagement";
import StockCount from "../../inventory/pages/StockCount";
import StockMovement from "../../inventory/pages/StockMovement"; // Renamed from InventoryAndWasteHistory
import InventoryRecords from "../../inventory/pages/InventoryRecords";
import AddInventory from '../../inventory/pages/AddInventory'; // Corrected casing and path

// Cash Management pages
import OpenCashier from "../../cashManagement/pages/OpenCashier";
import CloseCashier from "../../cashManagement/pages/CloseCashier";
import SafeCountPage from "../../cashManagement/pages/SafeCountPage";
import BankingPage from "../../cashManagement/pages/BankingPage";

// Customer Tracking / Reporting pages
import KOT from "../../reporting/pages/KOT"; // Moved under reporting feature
import CustomerReport from "../../reporting/pages/CustomerReport"; // Moved under reporting feature

// Items Management pages
import Categories from "../../itemsManagement/pages/categories";
import Sauces from "../../itemsManagement/pages/sauces";
import Items from "../../itemsManagement/pages/items"; // Renamed from ItemsManager for consistency


const AdminLayout = () => {
  return (
    <div className="bg-white min-h-screen">
      <div style={{ display: "flex" }}>
        <Sidebar />
        <div className="flex-1 p-4">
          <Routes>
            {/* Core Admin Dashboard */}
            <Route path="dashboard" element={<Dashboard />} />

            {/* User Management Routes */}
            <Route path="users" element={<Users />} />
            <Route path="users/add-employee" element={<AddUser />} />
            <Route path="user/:userId" element={<UserDetails />} />
            <Route path="user/change-phone-number" element={<ChangePhoneNumber />} /> {/* Adjusted path for clarity */}
            
            {/* Attendance Routes */}
            <Route path="attendance/admin-attendance" element={<AdminAttendance />} /> {/* Explicit path for clarity */}

            {/* Inventory Management Routes */}
            <Route path="inventory/waste-management" element={<WasteManagement />} /> {/* Adjusted path for clarity */}
            <Route path="inventory/stock-count" element={<StockCount />} />
            <Route path="inventory/stock-movement" element={<StockMovement />} />
            <Route path="inventory/inventory-records" element={<InventoryRecords />} />
            <Route path="inventory/add-inventory" element={<AddInventory />} />

            {/* Cash Management Routes */}
            <Route path="cash-management/open-cashier" element={<OpenCashier />} />
            <Route path="cash-management/close-cashier" element={<CloseCashier />} />
            <Route path="cash-management/safe-count-page" element={<SafeCountPage />} />
            <Route path="cash-management/banking-page" element={<BankingPage />} />

            {/* Customer Tracking / Reporting Routes */}
            <Route path="reporting/customer-report" element={<CustomerReport />} />
            <Route path="reporting/kot" element={<KOT />} />

            {/* Items Management Routes */}
            <Route path="items-management/categories" element={<Categories />} />
            <Route path="items-management/sauces" element={<Sauces />} />
            <Route path="items-management/items" element={<Items />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
