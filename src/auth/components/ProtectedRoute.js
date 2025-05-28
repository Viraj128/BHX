import { useAuth } from '../context/AuthContext'; // Path remains correct relative to src/auth/components
import { Navigate, useLocation } from 'react-router-dom';
import { ROLES } from '../../config/roles'; // Updated path for ROLES

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  const location = useLocation();

  // If user is not logged in, redirect to login page
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Normalize the user's role for case-insensitive comparison
  const normalizedUserRole = user.role?.toLowerCase();

  // Check if the user's role is among the allowed roles
  const isAllowed = allowedRoles.some(role => 
    role.toLowerCase() === normalizedUserRole
  );

  // If user's role is not allowed, redirect to unauthorized page
  if (!isAllowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If authorized, render the children components
  return children;
};

// RoleRoute is a convenience wrapper for ProtectedRoute when only a single role is allowed
export const RoleRoute = ({ role, children }) => (
  <ProtectedRoute allowedRoles={[role]}>
    {children}
  </ProtectedRoute>
);
