

// import { Navigate, Outlet } from 'react-router-dom';
// import { useAuth } from './AuthContext';
// import { useEffect } from 'react';

// export const ProtectedRoute = ({ allowedRoles }) => {
//   const { user, initializing, resetSessionTimeout } = useAuth();
  
//   // This useEffect must be at the top level
//   useEffect(() => {
//     if (user && !initializing) {
//       resetSessionTimeout();
//     }
//   }, [user, initializing, resetSessionTimeout]);

//   // Check session validity function
//   const isSessionValid = () => {
//     const sessionTimestamp = localStorage.getItem('sessionTimestamp');
//     if (!sessionTimestamp) return false;
    
//     const SESSION_TIMEOUT = 20 * 60 * 1000; // 20 minutes
//     const timeElapsed = Date.now() - parseInt(sessionTimestamp);
//     return timeElapsed < SESSION_TIMEOUT;
//   };

//   // Wait until initialization completes
//   if (initializing) {
//     return null; // Or a loading spinner
//   }

//   if (!user || !isSessionValid()) {
//     return <Navigate to="/login" replace />;
//   }

//   if (!allowedRoles.includes(user.role)) {
//     return <Navigate to="/unauthorized" replace />;
//   }

//   return <Outlet />;
// };



import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useEffect } from 'react';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { user, initializing, resetSessionTimeout } = useAuth();
  
  useEffect(() => {
    console.log('ProtectedRoute - User:', user, 'Initializing:', initializing, 'Session Valid:', isSessionValid());
    if (user && !initializing) {
      resetSessionTimeout();
    }
  }, [user, initializing, resetSessionTimeout]);

  const isSessionValid = () => {
    const sessionTimestamp = localStorage.getItem('sessionTimestamp');
    if (!sessionTimestamp) {
      console.log('No session timestamp found');
      return false;
    }
    
    const SESSION_TIMEOUT = 20 * 60 * 1000; // 20 minutes
    const timeElapsed = Date.now() - parseInt(sessionTimestamp);
    console.log('Time Elapsed:', timeElapsed, 'vs Timeout:', SESSION_TIMEOUT);
    return timeElapsed < SESSION_TIMEOUT;
  };

  if (initializing) {
    return null; // Or a loading spinner
  }

  if (!user || !isSessionValid()) {
    console.log('Redirecting to login due to:', !user ? 'No user' : 'Invalid session');
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log('Redirecting to unauthorized due to role mismatch:', user.role, 'not in', allowedRoles);
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};