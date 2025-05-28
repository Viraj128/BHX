// src/common/layouts/ManagerLayout.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "../components/Sidebar"; // Path relative to src/common/layouts

// Import pages from their new feature-based locations
// Dashboard
import Dashboard from "../../dashboard/pages/ManagerDashboard"; // Unified Dashboard

// // User Management / Employee related pages
// import Users from "../../userManagement/pages/User"; // Assuming 'Users' is the general employee list
// import EmployeeDetails from "../../userManagement/pages/EmployeeDetails"; // Specific employee details

// // Attendance pages
// import ManagerAttendance from "../../attendance/pages/ManagerAttendance"; // Unified Manager Attendance

// Inventory pages (now pointing to unified feature components)
// import WasteManagement from "../../inventory/pages/WasteManagement";
import StockCount from "../../inventory/pages/StockCount";
import StockMovement from "../../inventory/pages/StockMovement"; // Renamed from InventoryAndWasteHistory

// // Cash Management pages (now pointing to unified feature components)
// import OpenCashier from "../../cashManagement/pages/OpenCashier";
// import CloseCashier from "../../cashManagement/pages/CloseCashier";
// import SafeCountPage from "../../cashManagement/pages/SafeCountPage";
// import BankingPage from "../../cashManagement/pages/BankingPage";

// // Items Management pages (now pointing to unified feature components)
// import Categories from "../../itemsManagement/pages/categories";
// import Sauces from "../../itemsManagement/pages/sauces";
// import Items from "../../itemsManagement/pages/items"; // Renamed from ItemsManager for consistency


const ManagerLayout = () => {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: "1rem" }}>
        <Routes>
          {/* Core Manager Dashboard */}
          <Route path="dashboard" element={<Dashboard />} />


          {/* <Route path="employees" element={<Users />} /> 
          <Route path="employee/:id" element={<EmployeeDetails />} /> 
          
       
          <Route path="attendance/manager-attendance" element={<ManagerAttendance />} /> */}

       
          {/* <Route path="inventory/waste-management" element={<WasteManagement />} /> */}
          <Route path="inventory/stock-count" element={<StockCount />} />
          <Route path="inventory/stock-movement" element={<StockMovement />} />

{/*      
          <Route path="cash-management/open-cashier" element={<OpenCashier />} />
          <Route path="cash-management/close-cashier" element={<CloseCashier />} />
          <Route path="cash-management/safe-count-page" element={<SafeCountPage />} />
          <Route path="cash-management/banking-page" element={<BankingPage />} />

        
          <Route path="items-management/categories" element={<Categories />} />
          <Route path="items-management/sauces" element={<Sauces />} />
          <Route path="items-management/items" element={<Items />} /> */}
        </Routes>
      </div>
    </div>
  );
};

export default ManagerLayout;
