import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebase/config';
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const SESSION_TIMEOUT = 20 * 60 * 1000; // 20 minutes
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const timeoutIdRef = useRef(null);
  const sessionIdRef = useRef(null);
    const [initializing, setInitializing] = useState(true); // Add initializing state

  // Generate unique session ID
  const generateSessionId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Restore session on mount
 useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const sessionTimestamp = localStorage.getItem('sessionTimestamp');
    const storedSessionId = localStorage.getItem('sessionId');

    if (storedUser && sessionTimestamp && storedSessionId) {
      const timeElapsed = Date.now() - parseInt(sessionTimestamp, 10);
      if (timeElapsed < SESSION_TIMEOUT) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setSessionActive(true);
        sessionIdRef.current = storedSessionId;
      } else {
        clearSessionData();
      }
    }
    setInitializing(false); // Mark initialization as complete
  }, []);

  // Track tab close events
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (sessionIdRef.current && user?.phone) {
        try {
          const userRef = doc(db, 'userSessions', user.phone);
          await setDoc(userRef, {
            sessions: {
              [sessionIdRef.current]: {
                logoutTime: serverTimestamp()
              }
            }
          }, { merge: true });
        } catch (error) {
          console.error("Error logging tab close:", error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  const clearSessionData = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('sessionTimestamp');
    localStorage.removeItem('sessionId');
  };

  const logout = useCallback(async () => {
    if (sessionIdRef.current && user?.phone) {
      try {
        const userRef = doc(db, 'userSessions', user.phone);
        await setDoc(userRef, {
          sessions: {
            [sessionIdRef.current]: {
              logoutTime: serverTimestamp()
            }
          }
        }, { merge: true });
      } catch (error) {
        console.error("Error logging logout time:", error);
      }
    }
    
    // Clear all state and storage
    setUser(null);
    setSessionActive(false);
    sessionIdRef.current = null;
    clearSessionData();
  }, [user]);

  const resetSessionTimeout = useCallback(() => {
    localStorage.setItem('sessionTimestamp', Date.now().toString());
  }, []);

  // Session timeout handler
  useEffect(() => {
    if (!sessionActive) {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      return;
    }

    const onTimeout = () => {
      logout();
      alert('Session expired due to inactivity');
    };

    timeoutIdRef.current = setTimeout(onTimeout, SESSION_TIMEOUT);

    const handleActivity = () => {
      resetSessionTimeout();
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      timeoutIdRef.current = setTimeout(onTimeout, SESSION_TIMEOUT);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [sessionActive, logout, resetSessionTimeout]);

  const login = async (userData) => {
    const sessionId = generateSessionId();
    const minimalUserData = {
      name: userData.name,
      employeeID: userData.employeeID,
      phone: userData.phone,
      role: userData.role,
      sessionId: sessionId,
    };

    // Set user state
    setUser(minimalUserData);
    setSessionActive(true);
    sessionIdRef.current = sessionId;
    
    // Store in localStorage
    localStorage.setItem('user', JSON.stringify(minimalUserData));
    localStorage.setItem('sessionTimestamp', Date.now().toString());
    localStorage.setItem('sessionId', sessionId);

    // Log login to Firestore
    try {
      const userRef = doc(db, 'userSessions', userData.phone);
      await setDoc(userRef, {
        name: userData.name,
        phone: userData.phone,
        employeeID: userData.employeeID,
        sessions: {
          [sessionId]: {
            loginTime: serverTimestamp(),
            logoutTime: null
          }
        }
      }, { merge: true });
    } catch (error) {
      console.error("Error logging login time:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      resetSessionTimeout,
      initializing // Expose initializing state
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Add this missing hook export
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}