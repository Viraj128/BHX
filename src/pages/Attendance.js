import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  format, 
  addWeeks, 
  startOfWeek, 
  isWithinInterval, 
  isBefore, 
  isAfter, 
  isMonday, 
  subWeeks, 
  addDays,
  isSameDay
} from 'date-fns';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  Timestamp,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase/config';
import debounce from 'lodash/debounce';
import Select from 'react-select';
import { useAuth } from '../auth/AuthContext';
import { ROLES } from '../config/roles';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';

const Attendance = () => {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({ checkInStr: '', checkOutStr: '' });
  const [addingNew, setAddingNew] = useState(false);
  const [newData, setNewData] = useState({ userId: '', checkInStr: '', checkOutStr: '' });
  const [users, setUsers] = useState([]);
  const [shiftStartDate, setShiftStartDate] = useState(new Date());
  const [shiftEndDate, setShiftEndDate] = useState(new Date());
  const [errors, setErrors] = useState({ userId: '', checkInStr: '', checkOutStr: '', shiftEndDate: '' });
  const [tableKey, setTableKey] = useState(0);

  // TeamMember-specific state
  const [employeeId, setEmployeeId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [totalHours, setTotalHours] = useState('0h 0m');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [error, setError] = useState('');

  // Determine user roles
  const isAdmin = user?.role === ROLES.ADMIN;
  const isManager = user?.role === ROLES.MANAGER;
  const isTeamMember = user?.role === ROLES.TEAMMEMBER;
  const isTeamLeader = user?.role === ROLES.TEAMLEADER;

  // Fetch users for Admin/Manager
  const fetchUsers = useCallback(async () => {
    try {
      const userCollection = collection(db, "users_01");
      const userSnapshot = await getDocs(userCollection);
      const userList = userSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(user => [
          ROLES.TEAMMEMBER, 
          ROLES.MANAGER, 
          ROLES.TEAMLEADER,
          ROLES.ADMIN
        ].includes(user.role));
      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, []);

  // User options for select
  const userOptions = useMemo(() => 
    users.map(user => ({
      value: user.id,
      label: user.name
    })), 
  [users]);

  // Calculate worked hours
  const calculateWorkedHours = useMemo(() => {
    return (checkIn, checkOut) => {
      if (!checkIn || !checkOut) return "Incomplete";
      if (isBefore(checkOut, checkIn)) return "Invalid";
      let duration = checkOut - checkIn;
      const maxDuration = 24 * 60 * 60 * 1000;
      if (duration > maxDuration) duration = maxDuration;
      if (duration >= 12.5 * 60 * 60 * 1000) {
        duration -= 60 * 60 * 1000;
      } else if (duration >= 4.5 * 60 * 60 * 1000) {
        duration -= 30 * 60 * 60 * 1000;
      }
      const hrs = Math.floor(duration / (1000 * 60 * 60));
      const mins = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
      return `${hrs}h ${mins}m`;
    };
  }, []);

  // TeamMember: Calculate total work hours from worked_hours
  const calculateTotalHours = useCallback((data) => {
    let totalMinutes = 0;
    data.forEach((record) => {
      if (record.worked && record.worked !== 'N/A') {
        const match = record.worked.match(/^(\d+)h\s*(\d+)m$/);
        if (match) {
          const hours = parseInt(match[1], 10);
          const minutes = parseInt(match[2], 10);
          totalMinutes += hours * 60 + minutes;
        }
      }
    });
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }, []);

  // TeamMember: Parse duration to minutes for sorting
  const parseDurationToMinutes = useCallback((duration) => {
    if (!duration || duration === 'N/A') return 0;
    const match = duration.match(/^(\d+)h\s*(\d+)m$/);
    if (match) {
      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      return hours * 60 + minutes;
    }
    return 0;
  }, []);

  // TeamMember: Parse time for sorting
  const parseTime = useCallback((time) => {
    if (!time || time === '--:--') return '00:00';
    return time;
  }, []);

  // TeamMember: Sort attendance data
  const sortData = useCallback((data) => {
    return [...data].sort((a, b) => {
      let valueA, valueB;
      switch (sortField) {
        case 'date':
          valueA = new Date(a.date.split('-').reverse().join('-'));
          valueB = new Date(b.date.split('-').reverse().join('-'));
          break;
        case 'checkIn':
          valueA = parseTime(a.checkInStr);
          valueB = parseTime(b.checkInStr);
          break;
        case 'checkOut':
          valueA = parseTime(a.checkOutStr);
          valueB = parseTime(a.checkOutStr);
          break;
        case 'duration':
          valueA = parseDurationToMinutes(a.worked);
          valueB = parseDurationToMinutes(b.worked);
          break;
        default:
          return 0;
      }
      if (sortDirection === 'asc') {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    });
  }, [sortField, sortDirection, parseTime, parseDurationToMinutes]);

  // TeamMember: Handle sort toggle
  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  // TeamMember: Fetch attendance for the logged-in TeamMember
  const fetchTeamMemberAttendance = useCallback(async () => {
    // Use the user's employeeID from auth context
    if (!user?.employeeID) {
      setError('Employee ID not found in user profile.');
      return;
    }
    setLoading(true);
    setError('');
    setAttendanceData([]);
    setEmployeeName(user?.name || '');
    setTotalHours('0h 0m');

    try {
      // Fetch user document to get phone number (document ID)
      const usersQuery = query(
        collection(db, "users_01"),
        where("employeeID", "==", user.employeeID.trim())
      );
      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        setError('Employee ID not found.');
        setLoading(false);
        return;
      }

      const userDoc = usersSnapshot.docs[0];
      const phoneNum = userDoc.id; // Document ID is the phone number
      setEmployeeName(userDoc.data().name || user.employeeID);

      // Fetch all attendance subcollections
      const attendanceCollection = collection(db, "users_01", phoneNum, "attendance");
      const attendanceSnapshots = await getDocs(attendanceCollection);

      let logs = [];

      for (const attendanceDoc of attendanceSnapshots.docs) {
        const yearMonth = attendanceDoc.id; // e.g., "2025-06"
        const daysMap = attendanceDoc.data().days || {};

        Object.keys(daysMap).forEach((day) => {
          const dayData = daysMap[day];
          if (!dayData?.sessions?.length) return;

          dayData.sessions.forEach((session) => {
            const checkIn = session.checkIn?.toDate?.() || 
                           (session.checkIn instanceof Date ? session.checkIn : null);
            const checkOut = session.checkOut?.toDate?.() || 
                            (session.checkOut instanceof Date ? session.checkOut : null);

            // Apply date range filter if set
            if (startDate && endDate) {
              const recordDate = new Date(checkIn);
              recordDate.setHours(0, 0, 0, 0);
              const start = new Date(startDate);
              start.setHours(0, 0, 0, 0);
              const end = new Date(endDate);
              end.setHours(23, 59, 59, 999);
              if (recordDate < start || recordDate > end) return;
            }

            logs.push({
              date: checkIn ? format(checkIn, 'dd-MMM-yyyy') : '',
              checkInStr: checkIn ? format(checkIn, 'HH:mm') : '',
              checkOutStr: checkOut ? format(checkOut, 'HH:mm') : '',
              worked: session.worked_hours || calculateWorkedHours(checkIn, checkOut),
              checkInEdited: session.checkInEdited || false,
              checkOutEdited: session.checkOutEdited || false,
            });
          });
        });
      }

      const sortedLogs = sortData(logs);
      setAttendanceData(sortedLogs);
      setTotalHours(calculateTotalHours(sortedLogs));
    } catch (error) {
      console.error("Error fetching TeamMember attendance:", error);
      setError('Failed to fetch attendance data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, startDate, endDate, sortData, calculateWorkedHours, calculateTotalHours]);

  // Admin/Manager: Fetch attendance data for all users
  const fetchAdminAttendanceData = useCallback(async (selectedDate) => {
    setLoading(true);
    setAttendanceData([]);
    try {
      const yearMonth = format(selectedDate, 'yyyy-MM');
      const day = format(selectedDate, 'd');
      const allUsers = await getDocs(collection(db, "users_01"));
      const logs = [];

      const attendancePromises = allUsers.docs.map(userDoc => {
        const userId = userDoc.id;
        return getDoc(doc(db, "users_01", userId, "attendance", yearMonth)).then(attendanceSnap => ({
          userId,
          userData: userDoc.data(),
          attendanceSnap
        }));
      });

      const results = await Promise.all(attendancePromises);

      for (const { userId, userData, attendanceSnap } of results) {
        if (!attendanceSnap.exists()) continue;
        const daysMap = attendanceSnap.data().days || {};
        const dayData = daysMap[day];
        if (!dayData?.sessions?.length) continue;

        dayData.sessions.forEach((session, index) => {
          const checkIn = session.checkIn?.toDate?.() || 
                         (session.checkIn instanceof Date ? session.checkIn : null);
          const checkOut = session.checkOut?.toDate?.() || 
                          (session.checkOut instanceof Date ? session.checkOut : null);

          logs.push({
            userName: userData.name,
            checkInStr: checkIn ? format(checkIn, 'HH:mm') : '',
            checkOutStr: checkOut ? format(checkOut, 'HH:mm') : '',
            worked: session.worked_hours || calculateWorkedHours(checkIn, checkOut),
            userId,
            sessionId: `${yearMonth}-${day}-${index}`,
            checkInTime: checkIn?.getTime() || 0,
            originalCheckIn: checkIn,
            originalCheckOut: checkOut,
            checkInEdited: session.checkInEdited || false,
            checkOutEdited: session.checkOutEdited || false,
          });
        });
      }

      setAttendanceData(logs.sort((a, b) => b.checkInTime - a.checkInTime));
      setTableKey(prev => prev + 1);
    } catch (error) {
      console.error("Error fetching admin attendance data:", error);
    } finally {
      setLoading(false);
    }
  }, [calculateWorkedHours]);

  // Debounced fetch function
  const debouncedFetchAttendance = useMemo(() =>
    debounce((newDate) => fetchAdminAttendanceData(newDate), 300),
    [fetchAdminAttendanceData]
  );

  // Save edited attendance (Admin/Manager)
  const saveEdit = async (record) => {
    try {
      const parts = record.sessionId.split('-');
      if (parts.length !== 4) return;
      
      const yearMonth = `${parts[0]}-${parts[1]}`;
      const day = parts[2];
      const index = parseInt(parts[3]);
      const userId = record.userId;

      const userAttendanceRef = doc(db, "users_01", userId, "attendance", yearMonth);
      const userAttendanceSnap = await getDoc(userAttendanceRef);

      let days = {};
      let dayData = { sessions: [], isClockedIn: false };
      if (userAttendanceSnap.exists()) {
        days = { ...userAttendanceSnap.data().days };
        dayData = days[day] ? { ...days[day] } : dayData;
      }

      const sessions = [...dayData.sessions];
      if (index >= sessions.length) return;

      const [checkInHour, checkInMinute] = editData.checkInStr.split(':').map(Number);
      const [checkOutHour, checkOutMinute] = editData.checkOutStr.split(':').map(Number);

      const newCheckIn = new Date(record.originalCheckIn || date);
      newCheckIn.setHours(checkInHour, checkInMinute);
      const newCheckOut = new Date(record.originalCheckOut || newCheckIn);
      newCheckOut.setHours(checkOutHour, checkOutMinute);

      const now = new Date();
      if (isAfter(newCheckIn, now)) {
        alert("Check-in time cannot be in the future!");
        setErrors(prev => ({ ...prev, checkInStr: "Check-in time cannot be in the future" }));
        return;
      }
      if (isAfter(newCheckOut, now)) {
        alert("Check-out time cannot be in the future!");
        setErrors(prev => ({ ...prev, checkOutStr: "Check-out time cannot be in the future" }));
        return;
      }
      if (isBefore(newCheckOut, newCheckIn)) {
        alert("Check-out time must be after check-in time!");
        setErrors(prev => ({ ...prev, checkOutStr: "Check-out must be after check-in" }));
        return;
      }

      const newWorkedHours = calculateWorkedHours(newCheckIn, newCheckOut);
      const isCheckInEdited = editData.checkInStr !== record.checkInStr;
      const isCheckOutEdited = editData.checkOutStr !== record.checkOutStr;

      sessions[index] = {
        ...sessions[index],
        checkIn: Timestamp.fromDate(newCheckIn),
        checkOut: Timestamp.fromDate(newCheckOut),
        worked_hours: newWorkedHours,
        editedBy: user?.role || "Admin",
        editedAt: Timestamp.now(),
        checkInEdited: isCheckInEdited ? true : sessions[index].checkInEdited || false,
        checkOutEdited: isCheckOutEdited ? true : sessions[index].checkOutEdited || false,
      };

      dayData.sessions = sessions;
      days[day] = dayData;

      await setDoc(userAttendanceRef, { 
        days,
        metadata: {
          created: userAttendanceSnap.exists() 
            ? userAttendanceSnap.data().metadata?.created || serverTimestamp() 
            : serverTimestamp(),
          lastUpdated: serverTimestamp()
        }
      }, { merge: true });
      
      setEditing(null);
      setEditData({});
      fetchAdminAttendanceData(date);
    } catch (error) {
      console.error("Error updating attendance:", error);
    }
  };

  // Delete shift (Admin/Manager)
  const deleteShift = async (record) => {
    if (!window.confirm(`Delete shift for ${record.userName}?`)) return;
    setLoading(true);
    try {
      const parts = record.sessionId.split('-');
      if (parts.length !== 4) return;
      
      const yearMonth = `${parts[0]}-${parts[1]}`;
      const day = parts[2];
      const index = parseInt(parts[3]);
      const userId = record.userId;

      const userAttendanceRef = doc(db, "users_01", userId, "attendance", yearMonth);
      const userAttendanceSnap = await getDoc(userAttendanceRef);
      if (!userAttendanceSnap.exists()) return;

      const userData = userAttendanceSnap.data();
      const days = { ...userData.days };
      const dayData = { ...days[day] };
      const sessions = [...dayData.sessions];

      sessions.splice(index, 1);
      if (sessions.length === 0) {
        delete days[day];
      } else {
        dayData.sessions = sessions;
        days[day] = dayData;
      }

      await setDoc(userAttendanceRef, { 
        days,
        metadata: {
          created: userData.metadata?.created || serverTimestamp(),
          lastUpdated: serverTimestamp()
        }
      }, { merge: true });
      
      setAttendanceData([]);
      await fetchAdminAttendanceData(date);
      setTableKey(prev => prev + 1);
    } catch (error) {
      console.error("Error deleting shift:", error);
    } finally {
      setLoading(false);
    }
  };

  // Validate new attendance (Admin/Manager)
  const validateNewAttendance = () => {
    const newErrors = { userId: "", checkInStr: "", checkOutStr: "", shiftEndDate: "" };
    let isValid = true;

    if (!newData.userId) {
      newErrors.userId = "User selection is required";
      isValid = false;
    }
    if (!newData.checkInStr) {
      newErrors.checkInStr = "Check-in time is required";
      isValid = false;
    }
    if (!newData.checkOutStr) {
      newErrors.checkOutStr = "Check-out time is required";
      isValid = false;
    }

    const startDateStr = format(shiftStartDate, 'yyyy-MM-dd');
    const endDateStr = format(shiftEndDate, 'yyyy-MM-dd');
    const nextDay = addDays(shiftStartDate, 1);
    const nextDayStr = format(nextDay, 'yyyy-MM-dd');

    if (endDateStr !== startDateStr && endDateStr !== nextDayStr) {
      newErrors.shiftEndDate = "Check-out date must be the same as check-in or the next day";
      isValid = false;
    }

    // Validate check-out time is not in the future
    const [checkOutHour, checkOutMinute] = newData.checkOutStr.split(':').map(Number);
    const checkOutDate = new Date(shiftEndDate);
    checkOutDate.setHours(checkOutHour, checkOutMinute);
    const now = new Date();
    if (isAfter(checkOutDate, now)) {
      newErrors.checkOutStr = "Check-out time cannot be in the future";
      isValid = false;
    }

    // Validate check-in time is not in the future
    const [checkInHour, checkInMinute] = newData.checkInStr.split(':').map(Number);
    const checkInDate = new Date(shiftStartDate);
    checkInDate.setHours(checkInHour, checkInMinute);
    if (isAfter(checkInDate, now)) {
      newErrors.checkInStr = "Check-in time cannot be in the future";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Add new attendance (Admin/Manager)
  const addNewAttendance = async () => {
    if (!validateNewAttendance()) return;
    try {
      const userId = newData.userId;
      const yearMonth = format(shiftStartDate, 'yyyy-MM');
      const day = format(shiftStartDate, 'd');

      const [checkInHour, checkInMinute] = newData.checkInStr.split(':').map(Number);
      const [checkOutHour, checkOutMinute] = newData.checkOutStr.split(':').map(Number);

      const checkInDate = new Date(shiftStartDate);
      checkInDate.setHours(checkInHour, checkInMinute);
      const checkOutDate = new Date(shiftEndDate);
      checkOutDate.setHours(checkOutHour, checkOutMinute);

      if (isBefore(checkOutDate, checkInDate)) {
        setErrors(prev => ({ ...prev, checkOutStr: "Check-out must be after check-in" }));
        alert("Check-out time must be after check-in time!");
        return;
      }

      const userAttendanceRef = doc(db, "users_01", userId, "attendance", yearMonth);
      const userAttendanceSnap = await getDoc(userAttendanceRef);

      let daysData = {};
      if (userAttendanceSnap.exists()) {
        daysData = userAttendanceSnap.data().days || {};
      }

      const dayData = daysData[day] || { sessions: [], isClockedIn: false };
      const newSession = {
        checkIn: Timestamp.fromDate(checkInDate),
        checkOut: Timestamp.fromDate(checkOutDate),
        worked_hours: calculateWorkedHours(checkInDate, checkOutDate),
        editedBy: user?.role || "Admin",
        editedAt: Timestamp.now(),
        checkInEdited: false,
        checkOutEdited: false,
        status: "closed"
      };

      dayData.sessions = [...dayData.sessions, newSession];
      daysData[day] = dayData;

      await setDoc(userAttendanceRef, { 
        days: daysData,
        metadata: {
          created: userAttendanceSnap.exists() 
            ? userAttendanceSnap.data().metadata?.created || serverTimestamp() 
            : serverTimestamp(),
          lastUpdated: serverTimestamp()
        }
      }, { merge: true });
      
      setAddingNew(false);
      setNewData({ userId: "", checkInStr: "", checkOutStr: "" });
      setErrors({ userId: "", checkInStr: "", checkOutStr: "", shiftEndDate: "" });
      setShiftEndDate(shiftStartDate);
      fetchAdminAttendanceData(date);
    } catch (error) {
      console.error("Error adding attendance:", error);
    }
  };

  // TeamMember: Handle date range filter
  const handleDateFilter = () => {
    if (startDate && endDate && isBefore(new Date(endDate), new Date(startDate))) {
      setError('End date cannot be before start date.');
      return;
    }
    fetchTeamMemberAttendance();
  };

  // TeamMember: Clear date filter
  const clearDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
    fetchTeamMemberAttendance();
  };

  // Effects
  useEffect(() => {
    setShiftEndDate(shiftStartDate);
  }, [shiftStartDate]);

  useEffect(() => {
    if (isTeamMember) {
      setEmployeeId(user?.employeeID || '');
      fetchTeamMemberAttendance();
    } else {
      fetchUsers();
      debouncedFetchAttendance(date);
    }
    return () => debouncedFetchAttendance.cancel();
  }, [date, fetchUsers, debouncedFetchAttendance, isTeamMember, user, fetchTeamMemberAttendance]);

  // TeamMember: Update sorted data when sortField or sortDirection changes
  useEffect(() => {
    if (isTeamMember && attendanceData.length > 0) {
      setAttendanceData(sortData(attendanceData));
    }
  }, [sortField, sortDirection, attendanceData, sortData, isTeamMember]);

  // Calculate editable date range
  const currentDate = new Date();
  const lastMonday = startOfWeek(currentDate, { weekStartsOn: 1 });
  const nextMonday = addWeeks(lastMonday, 1);
  const editableStart = isMonday(currentDate) ? subWeeks(lastMonday, 1) : lastMonday;
  const editableEnd = isMonday(currentDate) ? addDays(lastMonday, 1) : nextMonday;

  const isDateEditable = (dateToCheck) => {
    return isWithinInterval(dateToCheck, { start: editableStart, end: editableEnd });
  };
  
  const isEditableDate = isDateEditable(date);
  const isToday = isSameDay(date, new Date());

  // Permission flags
  const showActionsColumn = (isAdmin && isEditableDate) || (isManager && isToday);
  const canAddNew = isAdmin && isEditableDate;
  const canEdit = (isAdmin && isEditableDate) || (isManager && isToday);
  const canDelete = isAdmin && isEditableDate;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        {isTeamMember ? (
          // TeamMember UI
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">
                My Attendance
              </h1>
            </div>

            {/* TeamMember: Date Range Filter */}
            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <h2 className="text-sm font-medium text-gray-700 mb-3">Filter by Date Range</h2>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div>
                  <label htmlFor="startDate" className="block text-sm text-gray-600 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                    className="p-2 border rounded-md text-sm bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm text-gray-600 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                    className="p-2 border rounded-md text-sm bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDateFilter}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200"
                  >
                    Apply Filter
                  </button>
                  <button
                    onClick={clearDateFilter}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* TeamMember: Error Message */}
            {error && (
              <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* TeamMember: Employee Name */}
            {employeeName && (
              <div className="mb-6 text-sm text-gray-700">
                Showing attendance for: <span className="font-medium">{employeeName}</span>
              </div>
            )}

            {/* TeamMember: Total Work Hours */}
            {attendanceData.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-md shadow-sm">
                <h2 className="text-sm font-medium text-gray-700">
                  Total Work Hours: <span className="font-semibold">{totalHours}</span>
                </h2>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-blue-700"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center gap-1">
                          Date
                          {sortField === 'date' && (
                            sortDirection === 'asc' ? <FiArrowUp /> : <FiArrowDown />
                          )}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-blue-700"
                        onClick={() => handleSort('checkIn')}
                      >
                        <div className="flex items-center gap-1">
                          Check In
                          {sortField === 'checkIn' && (
                            sortDirection === 'asc' ? <FiArrowUp /> : <FiArrowDown />
                          )}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-blue-700"
                        onClick={() => handleSort('checkOut')}
                      >
                        <div className="flex items-center gap-1">
                          Check Out
                          {sortField === 'checkOut' && (
                            sortDirection === 'asc' ? <FiArrowUp /> : <FiArrowDown />
                          )}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-blue-700"
                        onClick={() => handleSort('duration')}
                      >
                        <div className="flex items-center gap-1">
                          Duration
                          {sortField === 'duration' && (
                            sortDirection === 'asc' ? <FiArrowUp /> : <FiArrowDown />
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceData.map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <span>{record.checkInStr || '--:--'}</span>
                            {record.checkInEdited && <span className="text-xs text-gray-400">(edited)</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <span>{record.checkOutStr || '--:--'}</span>
                            {record.checkOutEdited && <span className="text-xs text-gray-400">(edited)</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.worked}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {attendanceData.length === 0 && !error && (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    No attendance records found
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          // Admin/Manager UI
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">
                Attendance Management
              </h1>
              <div className="flex items-center gap-4">
                <input
                  type="date"
                  value={format(date, 'yyyy-MM-dd')}
                  onChange={(e) => setDate(new Date(e.target.value))}
                  className="p-2 border rounded-md text-sm bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {canAddNew && (
                  <button
                    onClick={() => setAddingNew(!addingNew)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                      addingNew 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {addingNew ? 'Cancel' : 'Add Attendance'}
                  </button>
                )}
              </div>
            </div>

            {isAdmin && (
              <div className="mb-6 text-sm text-gray-500 bg-blue-50 p-3 rounded-md">
                Editable date range: {format(editableStart, 'MMM dd')} - {format(addDays(editableEnd, -1), 'MMM dd')}
                {isManager && (
                  <span className="ml-2 text-orange-600">
                    (Manager can only edit today: {format(new Date(), 'MMM dd')})
                  </span>
                )}
              </div>
            )}

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table key={tableKey} className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      {showActionsColumn && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceData.map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.userName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editing === index ? (
                            <input
                              type="time"
                              value={editData.checkInStr}
                              onChange={(e) => setEditData({ ...editData, checkInStr: e.target.value })}
                              className="border rounded px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                          ) : (
                            <div className="flex items-center gap-1">
                              <span>{record.checkInStr || '--:--'}</span>
                              {record.checkInEdited && <span className="text-xs text-gray-400">(edited)</span>}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editing === index ? (
                            <input
                              type="time"
                              value={editData.checkOutStr}
                              onChange={(e) => setEditData({ ...editData, checkOutStr: e.target.value })}
                              className="border rounded px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                          ) : (
                            <div className="flex items-center gap-1">
                              <span>{record.checkOutStr || '--:--'}</span>
                              {record.checkOutEdited && <span className="text-xs text-gray-400">(edited)</span>}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.worked}</td>
                        {showActionsColumn && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {editing === index ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => saveEdit(record)}
                                  className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs hover:bg-green-200"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditing(null)}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs hover:bg-gray-200"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                {canEdit && (
                                  <button
                                    onClick={() => {
                                      setEditing(index);
                                      setEditData({
                                        checkInStr: record.checkInStr,
                                        checkOutStr: record.checkOutStr
                                      });
                                    }}
                                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs hover:bg-blue-200"
                                  >
                                    Edit
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => deleteShift(record)}
                                    className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs hover:bg-red-200"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {attendanceData.length === 0 && (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    No attendance records found for this date
                  </div>
                )}
              </div>
            )}

            {addingNew && (
              <div className="mt-6 p-6 bg-gray-50 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Attendance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">User</label>
                    <Select
                      options={userOptions}
                      value={userOptions.find(option => option.value === newData.userId) || null}
                      onChange={(selectedOption) =>
                        setNewData({ ...newData, userId: selectedOption ? selectedOption.value : '' })
                      }
                      placeholder="Select User"
                      isSearchable
                      className="text-sm"
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderColor: errors.userId ? 'red' : base.borderColor,
                          boxShadow: errors.userId ? '0 0 0 1px red' : base.boxShadow,
                          '&:hover': { borderColor: errors.userId ? 'red' : base.borderColor }
                        })
                      }}
                    />
                    {errors.userId && <p className="text-red-500 text-xs mt-1">{errors.userId}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Start Date & Time</label>
                    <input
                      type="date"
                      value={format(shiftStartDate, 'yyyy-MM-dd')}
                      onChange={(e) => {
                        const selectedDate = new Date(e.target.value);
                        if (isDateEditable(selectedDate)) {
                          setShiftStartDate(selectedDate);
                        }
                      }}
                      min={format(editableStart, 'yyyy-MM-dd')}
                      max={format(addDays(editableEnd, -1), 'yyyy-MM-dd')}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm p-2"
                    />
                    <input
                      type="time"
                      value={newData.checkInStr}
                      onChange={(e) => setNewData({ ...newData, checkInStr: e.target.value })}
                      className={`block w-full rounded-md border shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm p-2 ${errors.checkInStr ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.checkInStr && <p className="text-red-500 text-xs mt-1">{errors.checkInStr}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">End Date & Time</label>
                    <input
                      type="date"
                      value={format(shiftEndDate, 'yyyy-MM-dd')}
                      onChange={(e) => {
                        const selectedDate = new Date(e.target.value);
                        const startDateStr = format(shiftStartDate, 'yyyy-MM-dd');
                        const nextDay = addDays(shiftStartDate, 1);
                        const nextDayStr = format(nextDay, 'yyyy-MM-dd');
                        if ([startDateStr, nextDayStr].includes(format(selectedDate, 'yyyy-MM-dd'))) {
                          setShiftEndDate(selectedDate);
                          setErrors(prev => ({ ...prev, shiftEndDate: "" }));
                        } else {
                          setErrors(prev => ({ ...prev, shiftEndDate: "Check-out date must be the same as check-in or the next day" }));
                        }
                      }}
                      min={format(shiftStartDate, 'yyyy-MM-dd')}
                      max={format(addDays(shiftStartDate, 1), 'yyyy-MM-dd')}
                      className={`block w-full rounded-md border shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm p-2 ${errors.shiftEndDate ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    <input
                      type="time"
                      value={newData.checkOutStr}
                      onChange={(e) => setNewData({ ...newData, checkOutStr: e.target.value })}
                      className={`block w-full rounded-md border shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm p-2 ${errors.checkOutStr ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.checkOutStr && <p className="text-red-500 text-xs mt-1">{errors.checkOutStr}</p>}
                    {errors.shiftEndDate && <p className="text-red-500 text-xs mt-1">{errors.shiftEndDate}</p>}
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setAddingNew(false);
                      setErrors({ userId: "", checkInStr: "", checkOutStr: "", shiftEndDate: "" });
                      setShiftEndDate(shiftStartDate);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addNewAttendance}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                  >
                    Add Attendance
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Attendance;
