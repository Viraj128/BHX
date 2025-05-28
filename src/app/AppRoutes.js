// import { Routes, Route } from "react-router-dom";
// import { ProtectedRoute } from '../components/ProtectedRoute'; // Assuming it's moved to src/components
// import Login from '../Login'; // Assuming it remains in src
// import Unauthorized from '../Unauthorized'; // Assuming it remains in src
// import AdminLayout from '../common/layouts/AdminLayout'; // Moved to src/common/layouts
// import ManagerLayout from '../common/layouts/ManagerLayout'; // Moved to src/common/layouts
// import TeamLeaderLayout from '../common/layouts/TeamLeaderLayout'; // Moved to src/common/layouts
// import TeamMemberLayout from '../common/layouts/TeamMemberLayout'; // Moved to src/common/layouts
// import { ROLES } from '../config/roles'; // Path should be correct

// const AppRoutes = () => {
//     return (
//         <Routes>
//             <Route path="/" element={<Login />} />
//             <Route path="/unauthorized" element={<Unauthorized />} />

//             <Route path="/admin/*" element={
//                 <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
//                     <AdminLayout />
//                 </ProtectedRoute>
//             }/>

//             <Route path="/manager/*" element={
//                 <ProtectedRoute allowedRoles={[ROLES.MANAGER]}>
//                     <ManagerLayout />
//                 </ProtectedRoute>
//             }/>

//             <Route path="/teamleader/*" element={
//                 <ProtectedRoute allowedRoles={[ROLES.TEAM_LEADER]}>
//                     <TeamLeaderLayout />
//                 </ProtectedRoute>
//             }/>

//             <Route path="/teammember/*" element={
//                 <ProtectedRoute allowedRoles={[ROLES.TEAM_MEMBER, ROLES.EMPLOYEE]}>
//                     <TeamMemberLayout />
//                 </ProtectedRoute>
//             }/>
//         </Routes>
//     );
// };

// export default AppRoutes;


//src/app/AppRoutes.js
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from '../../auth/components/ProtectedRoute'; // Go up twice, then into auth/components
import Login from '../../auth/pages/Login'; // Go up twice, then into auth/pages
import Unauthorized from '../../Unauthorized'; // Assuming in src root
import AdminLayout from '../../common/layouts/AdminLayout';
import ManagerLayout from '../../common/layouts/ManagerLayout';
import TeamLeaderLayout from '../../common/layouts/TeamLeaderLayout';
import TeamMemberLayout from '../../common/layouts/TeamMemberLayout';
import { ROLES } from '../../config/roles'; // Go up twice, then into config

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            <Route path="/admin/*" element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <AdminLayout />
                </ProtectedRoute>
            }/>

            <Route path="/manager/*" element={
                <ProtectedRoute allowedRoles={[ROLES.MANAGER]}>
                    <ManagerLayout />
                </ProtectedRoute>
            }/>

            <Route path="/teamleader/*" element={
                <ProtectedRoute allowedRoles={[ROLES.TEAM_LEADER]}>
                    <TeamLeaderLayout />
                </ProtectedRoute>
            }/>

            <Route path="/teammember/*" element={
                <ProtectedRoute allowedRoles={[ROLES.TEAM_MEMBER, ROLES.EMPLOYEE]}>
                    <TeamMemberLayout />
                </ProtectedRoute>
            }/>
        </Routes>
    );
};

export default AppRoutes;

src/app/AppRoutes.js


