import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

// Session timeout duration in milliseconds (20 minutes)
const SESSION_TIMEOUT = 20 * 60 * 1000;

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const timeoutIdRef = useRef(null);

  // On mount: restore session if valid
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const sessionTimestamp = localStorage.getItem('sessionTimestamp');

    if (storedUser && sessionTimestamp) {
      const timeElapsed = Date.now() - parseInt(sessionTimestamp, 10);
      if (timeElapsed < SESSION_TIMEOUT) {
        setUser(JSON.parse(storedUser));
        setSessionActive(true);
      } else {
        localStorage.removeItem('user');
        localStorage.removeItem('sessionTimestamp');
        setSessionActive(false);
      }
    }
  }, []);

  // Logout function - stable with useCallback
  const logout = useCallback(() => {
    setUser(null);
    setSessionActive(false);
    localStorage.removeItem('user');
    localStorage.removeItem('sessionTimestamp');
  }, []);

  // Reset session timestamp in localStorage
  const resetSessionTimeout = useCallback(() => {
    localStorage.setItem('sessionTimestamp', Date.now().toString());
  }, []);

  // Handle session timeout and activity monitoring
  useEffect(() => {
    if (!sessionActive) {
      // Clear any existing timeout if session is inactive
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      return;
    }

    // Function to logout due to inactivity
    const onTimeout = () => {
      logout();
      alert('Session expired due to inactivity');
    };

    // Set the initial timeout
    timeoutIdRef.current = setTimeout(onTimeout, SESSION_TIMEOUT);

    // Activity handler to reset timeout and session timestamp
    const handleActivity = () => {
      resetSessionTimeout();

      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      timeoutIdRef.current = setTimeout(onTimeout, SESSION_TIMEOUT);
    };

    // Add event listeners for user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    // Cleanup function to remove listeners and clear timeout
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [sessionActive, logout, resetSessionTimeout]);

  // Login function
  const login = (userData) => {
    const minimalUserData = {
      phone: userData.phone,
      employeeID: userData.employeeID,
    };
    setUser(userData);
    setSessionActive(true);
    localStorage.setItem('user', JSON.stringify(minimalUserData));
    localStorage.setItem('sessionTimestamp', Date.now().toString());
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, resetSessionTimeout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to access auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
