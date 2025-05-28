// src/common/layouts/TeamMemberLayout.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "../components/Sidebar"; // Path relative to src/common/layouts
// import ViewDetails from "../../userManagement/pages/ViewDetails"; // Assuming in userManagement
// import MemberAttendance from "../../attendance/pages/MemberAttendance"; // Assuming in attendance

const TeamMemberLayout = () => {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: "1rem" }}>
        <Routes>
          {/* <Route path="view-details" element={<ViewDetails/>} />
          <Route path="member-attendance" element={<MemberAttendance />} /> */}
        </Routes>
      </div>
    </div>
  );
};

export default TeamMemberLayout;