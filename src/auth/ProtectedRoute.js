import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useEffect, useCallback } from 'react';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { user, resetSessionTimeout } = useAuth();

  const storedUser = localStorage.getItem('user');
  const sessionTimestamp = localStorage.getItem('sessionTimestamp');
  const SESSION_TIMEOUT = 20 * 60 * 1000;

  const isSessionValid = useCallback(() => {
    if (!storedUser || !sessionTimestamp) return false;
    const timeElapsed = Date.now() - parseInt(sessionTimestamp);
    return timeElapsed < SESSION_TIMEOUT;
  }, [storedUser, sessionTimestamp, SESSION_TIMEOUT]);

  useEffect(() => {
    if (user && isSessionValid()) {
      resetSessionTimeout();
    }
  }, [user, resetSessionTimeout, isSessionValid]);

  if (!user || !storedUser || !isSessionValid()) {
    localStorage.removeItem('user');
    localStorage.removeItem('sessionTimestamp');
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
