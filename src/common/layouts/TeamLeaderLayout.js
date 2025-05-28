// src/common/layouts/TeamLeaderLayout.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar'; // Path relative to src/common/layouts

// Import pages from their new feature-based locations
// Dashboard
import Dashboard from '../../dashboard/pages/Dashboard'; // Unified Dashboard

// User Management / Shift Runners related pages
import Shiftrunners from '../../userManagement/pages/Shiftrunners'; // Moved under userManagement
import Shiftrunnersdetails from '../../userManagement/pages/Shiftrunnersdetails'; // Moved under userManagement

// Attendance pages
import Attendance from "../../attendance/pages/Attendance"; // Unified Attendance component

// Inventory pages (now pointing to unified feature components)
import WasteManagement from "../../inventory/pages/WasteManagement";
import StockCount from "../../inventory/pages/StockCount";
import StockMovement from "../../inventory/pages/StockMovement"; // Renamed from InventoryAndWasteHistory

// Cash Management pages (now pointing to unified feature components)
import OpenCashier from "../../cashManagement/pages/OpenCashier";
import CloseCashier from "../../cashManagement/pages/CloseCashier";
import SafeCountPage from "../../cashManagement/pages/SafeCountPage";
import BankingPage from "../../cashManagement/pages/BankingPage";

// Items Management pages (now pointing to unified feature components)
import Categories from "../../itemsManagement/pages/categories";
import Sauces from "../../itemsManagement/pages/sauces";
import Items from "../../itemsManagement/pages/items"; // Renamed from ItemsManager for consistency


const TeamLeaderLayout = () => {
    return (
        <div style={{ display: "flex" }}>
            <Sidebar />
            <div style={{ flex: 1, padding: "1rem" }}>
                <Routes>
                    {/* Core TeamLeader Dashboard */}
                    <Route path="dashboard" element={<Dashboard />} />

                    {/* Shift Runners (User Management) Routes */}
                    <Route path="user-management/shift-runners" element={<Shiftrunners />} />
                    <Route path="user-management/shift-runners/:id" element={<Shiftrunnersdetails />} />
                    
                    {/* Attendance Routes */}
                    <Route path="attendance/teamleader-attendance" element={<Attendance />} />

                    {/* Inventory Management Routes */}
                    <Route path="inventory/waste-management" element={<WasteManagement />} />
                    <Route path="inventory/stock-count" element={<StockCount />} />
                    <Route path="inventory/stock-movement" element={<StockMovement />} />

                    {/* Cash Management Routes */}
                    <Route path="cash-management/open-cashier" element={<OpenCashier />} />
                    <Route path="cash-management/close-cashier" element={<CloseCashier />} />
                    <Route path="cash-management/safe-count-page" element={<SafeCountPage />} />
                    <Route path="cash-management/banking-page" element={<BankingPage />} />

                    {/* Items Management Routes */}
                    <Route path="items-management/categories" element={<Categories />} />
                    <Route path="items-management/sauces" element={<Sauces />} />
                    <Route path="items-management/items" element={<Items />} />
                </Routes>
            </div>
        </div>
    );
};

export default TeamLeaderLayout;
