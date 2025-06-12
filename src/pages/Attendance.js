// import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import {
//   format,
//   addWeeks,
//   startOfWeek,
//   isWithinInterval,
//   isBefore,
//   isAfter,
//   isMonday,
//   subWeeks,
//   addDays,
//   isSameDay
// } from 'date-fns';
// import {
//   collection,
//   getDocs,
//   doc,
//   updateDoc,
//   setDoc,
//   getDoc,
//   serverTimestamp,
//   Timestamp,
//   query,
//   where
// } from 'firebase/firestore';
// import { db } from '../firebase/config';
// import debounce from 'lodash/debounce';
// import Select from 'react-select';
// import { useAuth } from '../auth/AuthContext';
// import { ROLES } from '../config/roles';
// import { FiArrowUp, FiArrowDown, FiUsers, FiUser } from 'react-icons/fi';
// import MemberAttendance from './MemberAttendance';

// const Attendance = () => {
//   const { user } = useAuth();
//   const [date, setDate] = useState(new Date());
//   const [attendanceData, setAttendanceData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [editing, setEditing] = useState(null);
//   const [editData, setEditData] = useState({ checkInStr: '', checkOutStr: '' });
//   const [addingNew, setAddingNew] = useState(false);
//   const [newData, setNewData] = useState({ userId: '', checkInStr: '', checkOutStr: '' });
//   const [users, setUsers] = useState([]);
//   const [shiftStartDate, setShiftStartDate] = useState(new Date());
//   const [shiftEndDate, setShiftEndDate] = useState(new Date());
//   const [errors, setErrors] = useState({ userId: '', checkInStr: '', checkOutStr: '', shiftEndDate: '' });
//   const [tableKey, setTableKey] = useState(0);
//   const [activeTab, setActiveTab] = useState('team'); // 'team' or 'personal'

//   // TeamMember-specific state
//   const [employeeId, setEmployeeId] = useState('');
//   const [employeeName, setEmployeeName] = useState('');
//   const [startDate, setStartDate] = useState(null);
//   const [endDate, setEndDate] = useState(null);
//   const [totalHours, setTotalHours] = useState('0h 0m');
//   const [sortField, setSortField] = useState('date');
//   const [sortDirection, setSortDirection] = useState('desc');
//   const [error, setError] = useState('');

//   // Determine user roles
//   const isAdmin = user?.role === ROLES.ADMIN;
//   const isManager = user?.role === ROLES.MANAGER;
//   const isTeamMember = user?.role === ROLES.TEAMMEMBER;
//   const isTeamLeader = user?.role === ROLES.TEAMLEADER;

//   // Should show tabs (for managers and team leaders)
//   const showTabs = isManager || isTeamLeader;

//   // Fetch users for Admin/Manager/TeamLeader
//   const fetchUsers = useCallback(async () => {
//     try {
//       const userCollection = collection(db, "users_01");
//       const userSnapshot = await getDocs(userCollection);
//       const userList = userSnapshot.docs
//         .map(doc => ({
//           id: doc.id,
//           ...doc.data()
//         }))
//         .filter(user => [
//           ROLES.TEAMMEMBER,
//           ROLES.MANAGER,
//           ROLES.TEAMLEADER,
//           ROLES.ADMIN
//         ].includes(user.role));
//       setUsers(userList);
//     } catch (error) {
//       console.error("Error fetching users:", error);
//     }
//   }, []);

//   // User options for select
//   const userOptions = useMemo(() =>
//     users.map(user => ({
//       value: user.id,
//       label: user.name
//     })),
//     [users]);

//   // Calculate worked hours
//   const calculateWorkedHours = useMemo(() => {
//     return (checkIn, checkOut) => {
//       if (!checkIn || !checkOut) return "Incomplete";
//       if (isBefore(checkOut, checkIn)) return "Invalid";
//       let duration = checkOut - checkIn;
//       const maxDuration = 24 * 60 * 60 * 1000;
//       if (duration > maxDuration) duration = maxDuration;
//       if (duration >= 12.5 * 60 * 60 * 1000) {
//         duration -= 60 * 60 * 1000;
//       } else if (duration >= 4.5 * 60 * 60 * 1000) {
//         duration -= 30 * 60 * 1000;
//       }
//       const hrs = Math.floor(duration / (1000 * 60 * 60));
//       const mins = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
//       return `${hrs}h ${mins}m`;
//     };
//   }, []);

//   // TeamMember: Calculate total work hours from worked_hours
//   const calculateTotalHours = useCallback((data) => {
//     let totalMinutes = 0;
//     data.forEach((record) => {
//       if (record.worked && record.worked !== 'N/A') {
//         const match = record.worked.match(/^(\d+)h\s*(\d+)m$/);
//         if (match) {
//           const hours = parseInt(match[1], 10);
//           const minutes = parseInt(match[2], 10);
//           totalMinutes += hours * 60 + minutes;
//         }
//       }
//     });
//     const hours = Math.floor(totalMinutes / 60);
//     const minutes = totalMinutes % 60;
//     return `${hours}h ${minutes}m`;
//   }, []);

//   // TeamMember: Parse duration to minutes for sorting
//   const parseDurationToMinutes = useCallback((duration) => {
//     if (!duration || duration === 'N/A') return 0;
//     const match = duration.match(/^(\d+)h\s*(\d+)m$/);
//     if (match) {
//       const hours = parseInt(match[1], 10);
//       const minutes = parseInt(match[2], 10);
//       return hours * 60 + minutes;
//     }
//     return 0;
//   }, []);

//   // TeamMember: Parse time for sorting
//   const parseTime = useCallback((time) => {
//     if (!time || time === '--:--') return '00:00';
//     return time;
//   }, []);

//  // TeamMember: Sort attendance data
// const sortData = useCallback((data) => {
//   return [...data].sort((a, b) => {
//     let valueA, valueB;
//     switch (sortField) {
//       case 'date':
//         // Handle undefined or invalid dates
//         if (!a.date || typeof a.date !== 'string' || !b.date || typeof b.date !== 'string') {
//           return sortDirection === 'asc' ? (a.date ? 1 : -1) : (a.date ? -1 : 1);
//         }
//         try {
//           valueA = new Date(a.date.split('-').reverse().join('-'));
//           valueB = new Date(b.date.split('-').reverse().join('-'));
//           if (isNaN(valueA) || isNaN(valueB)) {
//             return sortDirection === 'asc' ? (isNaN(valueA) ? 1 : -1) : (isNaN(valueA) ? -1 : 1);
//           }
//         } catch {
//           return sortDirection === 'asc' ? (a.date ? 1 : -1) : (a.date ? -1 : 1);
//         }
//         break;
//       case 'checkIn':
//         valueA = parseTime(a.checkInStr);
//         valueB = parseTime(b.checkInStr);
//         break;
//       case 'checkOut':
//         valueA = parseTime(a.checkOutStr);
//         valueB = parseTime(b.checkOutStr);
//         break;
//       case 'duration':
//         valueA = parseDurationToMinutes(a.worked);
//         valueB = parseDurationToMinutes(b.worked);
//         break;
//       default:
//         return 0;
//     }
//     if (sortDirection === 'asc') {
//       return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
//     } else {
//       return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
//     }
//   });
// }, [sortField, sortDirection, parseTime, parseDurationToMinutes]);


//   // TeamMember: Handle sort toggle
//   const handleSort = useCallback((field) => {
//     if (sortField === field) {
//       setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
//     } else {
//       setSortField(field);
//       setSortDirection('asc');
//     }
//   }, [sortField, sortDirection]);

//   // TeamMember: Fetch attendance for the logged-in user
//   const fetchPersonalAttendance = useCallback(async () => {
//     if (!user?.employeeID) {
//       setError('Employee ID not found in user profile.');
//       return;
//     }
//     setLoading(true);
//     setError('');
//     setAttendanceData([]);
//     setEmployeeName(user?.name || '');
//     setTotalHours('0h 0m');

//     try {
//       const usersQuery = query(
//         collection(db, "users_01"),
//         where("employeeID", "==", user.employeeID.trim())
//       );
//       const usersSnapshot = await getDocs(usersQuery);

//       if (usersSnapshot.empty) {
//         setError('Employee ID not found.');
//         setLoading(false);
//         return;
//       }

//       const userDoc = usersSnapshot.docs[0];
//       const phoneNum = userDoc.id;
//       setEmployeeName(userDoc.data().name || user.employeeID);

//       const attendanceCollection = collection(db, "users_01", phoneNum, "attendance");
//       const attendanceSnapshots = await getDocs(attendanceCollection);

//       let logs = [];

//       for (const attendanceDoc of attendanceSnapshots.docs) {
//         const yearMonth = attendanceDoc.id;
//         const daysMap = attendanceDoc.data().days || {};

//         Object.keys(daysMap).forEach((day) => {
//           const dayData = daysMap[day];
//           if (!dayData?.sessions?.length) return;

//           dayData.sessions.forEach((session) => {
//             const checkIn = session.checkIn?.toDate?.() ||
//               (session.checkIn instanceof Date ? session.checkIn : null);
//             const checkOut = session.checkOut?.toDate?.() ||
//               (session.checkOut instanceof Date ? session.checkOut : null);

//             if (startDate && endDate) {
//               const recordDate = new Date(checkIn);
//               recordDate.setHours(0, 0, 0, 0);
//               const start = new Date(startDate);
//               start.setHours(0, 0, 0, 0);
//               const end = new Date(endDate);
//               end.setHours(23, 59, 59, 999);
//               if (recordDate < start || recordDate > end) return;
//             }

//             logs.push({
//               date: checkIn ? format(checkIn, 'dd-MMM-yyyy') : '',
//               checkInStr: checkIn ? format(checkIn, 'HH:mm') : '',
//               checkOutStr: checkOut ? format(checkOut, 'HH:mm') : '',
//               worked: session.worked_hours || calculateWorkedHours(checkIn, checkOut),
//               checkInEdited: session.checkInEdited || false,
//               checkOutEdited: session.checkOutEdited || false,
//             });
//           });
//         });
//       }

//       const sortedLogs = sortData(logs);
//       setAttendanceData(sortedLogs);
//       setTotalHours(calculateTotalHours(sortedLogs));
//     } catch (error) {
//       console.error("Error fetching attendance data:", error);
//       setError('Failed to fetch attendance data. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   }, [user, startDate, endDate, sortData, calculateWorkedHours, calculateTotalHours]);

//   // Admin/Manager/TeamLeader: Fetch attendance data for all users
//   const fetchTeamAttendanceData = useCallback(async (selectedDate) => {
//     setLoading(true);
//     setAttendanceData([]);
//     try {
//       const yearMonth = format(selectedDate, 'yyyy-MM');
//       const day = format(selectedDate, 'd');
//       const allUsers = await getDocs(collection(db, "users_01"));
//       const logs = [];

//       const attendancePromises = allUsers.docs.map(userDoc => {
//         const userId = userDoc.id;
//         return getDoc(doc(db, "users_01", userId, "attendance", yearMonth)).then(attendanceSnap => ({
//           userId,
//           userData: userDoc.data(),
//           attendanceSnap
//         }));
//       });

//       const results = await Promise.all(attendancePromises);

//       for (const { userId, userData, attendanceSnap } of results) {
//         if (!attendanceSnap.exists()) continue;
//         const daysMap = attendanceSnap.data().days || {};
//         const dayData = daysMap[day];
//         if (!dayData?.sessions?.length) continue;

//         dayData.sessions.forEach((session, index) => {
//           const checkIn = session.checkIn?.toDate?.() ||
//             (session.checkIn instanceof Date ? session.checkIn : null);
//           const checkOut = session.checkOut?.toDate?.() ||
//             (session.checkOut instanceof Date ? session.checkOut : null);

//           logs.push({
//             userName: userData.name,
//             checkInStr: checkIn ? format(checkIn, 'HH:mm') : '',
//             checkOutStr: checkOut ? format(checkOut, 'HH:mm') : '',
//             worked: session.worked_hours || calculateWorkedHours(checkIn, checkOut),
//             userId,
//             sessionId: `${yearMonth}-${day}-${index}`,
//             checkInTime: checkIn?.getTime() || 0,
//             originalCheckIn: checkIn,
//             originalCheckOut: checkOut,
//             checkInEdited: session.checkInEdited || false,
//             checkOutEdited: session.checkOutEdited || false,
//           });
//         });
//       }

//       setAttendanceData(logs.sort((a, b) => b.checkInTime - a.checkInTime));
//       setTableKey(prev => prev + 1);
//     } catch (error) {
//       console.error("Error fetching team attendance data:", error);
//     } finally {
//       setLoading(false);
//     }
//   }, [calculateWorkedHours]);

//   // Debounced fetch function for team view
//   const debouncedFetchTeamAttendance = useMemo(() =>
//     debounce((newDate) => fetchTeamAttendanceData(newDate), 300),
//     [fetchTeamAttendanceData]
//   );

//   // Save edited attendance (Admin/Manager/TeamLeader)
//   const saveEdit = async (record) => {
//     try {
//       const parts = record.sessionId.split('-');
//       if (parts.length !== 4) {
//         throw new Error('Invalid session ID format');
//       }

//       const yearMonth = `${parts[0]}-${parts[1]}`;
//       const day = parts[2];
//       const index = parseInt(parts[3]);
//       const userId = record.userId;

//       const userAttendanceRef = doc(db, 'users_01', userId, 'attendance', yearMonth);
//       const userAttendanceSnap = await getDoc(userAttendanceRef);

//       let days = {};
//       let dayData = { sessions: [], isClockedIn: false };
//       if (userAttendanceSnap.exists()) {
//         days = { ...userAttendanceSnap.data().days };
//         dayData = days[day] ? { ...days[day] } : dayData;
//       }

//       const sessions = [...dayData.sessions];
//       if (index >= sessions.length) {
//         throw new Error('Invalid session index');
//       }

//       const [checkInHour, checkInMinute] = editData.checkInStr.split(':').map(Number);
//       const newCheckIn = new Date(record.originalCheckIn || date);
//       newCheckIn.setHours(checkInHour, checkInMinute, 0, 0);

//       let newCheckOut = null;
//       let workedHours = 'Incomplete';
//       let status = 'open';

//       if (editData.checkOutStr) {
//         const [checkOutHour, checkOutMinute] = editData.checkOutStr.split(':').map(Number);
//         newCheckOut = new Date(record.originalCheckOut || newCheckIn);
//         newCheckOut.setHours(checkOutHour, checkOutMinute, 0, 0);
//         workedHours = calculateWorkedHours(newCheckIn, newCheckOut);
//         status = 'closed';
//       }

//       const now = new Date();
//       if (isAfter(newCheckIn, now)) {
//         alert('Check-in time cannot be in the future!');
//         setErrors(prev => ({ ...prev, checkInStr: 'Check-in time cannot be in the future' }));
//         return;
//       }
//       if (newCheckOut && isAfter(newCheckOut, now)) {
//         alert('Check-out time cannot be in the future!');
//         setErrors(prev => ({ ...prev, checkOutStr: 'Check-out time cannot be in the future' }));
//         return;
//       }
//       if (newCheckOut && isBefore(newCheckOut, newCheckIn)) {
//         alert('Check-out time must be after check-in time!');
//         setErrors(prev => ({ ...prev, checkOutStr: 'Check-out must be after check-in' }));
//         return;
//       }

//       // Check for overlaps, excluding the current session
//       const overlapCheck = await checkOverlapAndClockIn(userId, newCheckIn, newCheckOut, day, yearMonth, index);
//       if (!overlapCheck.isValid) {
//         alert(overlapCheck.error);
//         setErrors(prev => ({ ...prev, checkInStr: overlapCheck.error }));
//         return;
//       }

//       const isCheckInEdited = editData.checkInStr !== record.checkInStr;
//       const isCheckOutEdited = editData.checkOutStr !== record.checkOutStr;

//       sessions[index] = {
//         ...sessions[index],
//         checkIn: Timestamp.fromDate(newCheckIn),
//         checkOut: newCheckOut ? Timestamp.fromDate(newCheckOut) : null,
//         worked_hours: workedHours,
//         editedBy: user?.role || 'Admin',
//         editedAt: Timestamp.now(),
//         checkInEdited: isCheckInEdited ? true : sessions[index].checkInEdited || false,
//         checkOutEdited: isCheckOutEdited ? true : sessions[index].checkOutEdited || false,
//         status,
//       };

//       // Update isClockedIn based on all sessions
//       dayData.isClockedIn = sessions.some(session => session.status === 'open');
//       dayData.sessions = sessions;
//       days[day] = dayData;

//       await setDoc(
//         userAttendanceRef,
//         {
//           days,
//           metadata: {
//             created: userAttendanceSnap.exists()
//               ? userAttendanceSnap.data().metadata?.created || serverTimestamp()
//               : serverTimestamp(),
//             lastUpdated: serverTimestamp(),
//           },
//         },
//         { merge: true }
//       );

//       setEditing(null);
//       setEditData({});
//       fetchTeamAttendanceData(date);
//     } catch (error) {
//       console.error('Error updating attendance:', error);
//       alert(`Failed to update attendance: ${error.message}`);
//     }
//   };

//   // Delete shift
//   const deleteShift = async (record) => {
//     if (!window.confirm(`Delete shift for ${record.userName}?`)) return;
//     setLoading(true);
//     try {
//       const parts = record.sessionId.split('-');
//       if (parts.length !== 4) {
//         console.error("Invalid sessionId format:", record.sessionId);
//         return;
//       }
//       const yearMonth = `${parts[0]}-${parts[1]}`;
//       const day = parts[2];
//       const index = parseInt(parts[3]);
//       const userId = record.userId;

//       const userAttendanceRef = doc(db, "users_01", userId, "attendance", yearMonth);
//       const userAttendanceSnap = await getDoc(userAttendanceRef);
//       if (!userAttendanceSnap.exists()) {
//         console.warn("No attendance document found for deletion");
//         return;
//       }

//       const userData = userAttendanceSnap.data();
//       const days = { ...userData.days };
//       const dayData = { ...days[day] };
//       const sessions = [...dayData.sessions];

//       sessions.splice(index, 1);
//       if (sessions.length === 0) {
//         delete days[day];
//       } else {
//         dayData.sessions = sessions;
//         days[day] = {
//           ...dayData,
//           metadata: {
//             created: dayData.metadata?.created || serverTimestamp(),
//             lastUpdated: serverTimestamp()
//           }
//         };
//       }

//       await updateDoc(userAttendanceRef, { days });
//       setAttendanceData([]);
//       await fetchTeamAttendanceData(date);
//       setTableKey(prev => prev + 1);
//     } catch (error) {
//       console.error("Error deleting shift:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Check for overlapping sessions and clock-in status
//   const checkOverlapAndClockIn = async (userId, checkInDate, checkOutDate, day, yearMonth, excludeIndex = -1) => {
//     try {
//       const userAttendanceRef = doc(db, "users_01", userId, "attendance", yearMonth);
//       const userAttendanceSnap = await getDoc(userAttendanceRef);
//       let existingSessions = [];

//       if (userAttendanceSnap.exists()) {
//         const daysData = userAttendanceSnap.data().days || {};
//         const dayData = daysData[day] || { sessions: [], isClockedIn: false };
//         existingSessions = dayData.sessions || [];
//       }

//       // Normalize check-in and check-out dates
//       const newCheckIn = new Date(checkInDate);
//       newCheckIn.setMilliseconds(0);
//       const newCheckOut = checkOutDate ? new Date(checkOutDate) : null;
//       if (newCheckOut) newCheckOut.setMilliseconds(0);

//       for (let i = 0; i < existingSessions.length; i++) {
//         if (i === excludeIndex) continue; // Skip the session being edited

//         const existingCheckIn = existingSessions[i].checkIn?.toDate?.() || existingSessions[i].checkIn;
//         const existingCheckOut = existingSessions[i].checkOut?.toDate?.() || existingSessions[i].checkOut;

//         if (!existingCheckIn) continue; // Skip invalid sessions

//         // Normalize existing session dates
//         const exCheckIn = new Date(existingCheckIn);
//         exCheckIn.setMilliseconds(0);
//         const exCheckOut = existingCheckOut ? new Date(existingCheckOut) : null;
//         if (exCheckOut) exCheckOut.setMilliseconds(0);

//         // Only check for overlaps if new session has a check-out time
//         if (newCheckOut && exCheckOut) {
//           const isOverlap =
//             (newCheckIn >= exCheckIn && newCheckIn < exCheckOut) || // New check-in falls within existing session
//             (newCheckOut > exCheckIn && newCheckOut <= exCheckOut) || // New check-out falls within existing session
//             (newCheckIn <= exCheckIn && newCheckOut >= exCheckOut); // New session envelops existing session

//           if (isOverlap) {
//             return {
//               isValid: false,
//               error: `Session overlaps with existing session from ${format(
//                 exCheckIn,
//                 'HH:mm'
//               )} to ${format(exCheckOut, 'HH:mm')} on ${format(exCheckIn, 'dd-MMM-yyyy')}.`,
//             };
//           }
//         } else if (!newCheckOut && exCheckOut) {
//           // New session is open; check if check-in overlaps with existing closed session
//           if (newCheckIn >= exCheckIn && newCheckIn < exCheckOut) {
//             return {
//               isValid: false,
//               error: `Check-in at ${format(newCheckIn, 'HH:mm')} overlaps with existing session from ${format(
//                 exCheckIn,
//                 'HH:mm'
//               )} to ${format(exCheckOut, 'HH:mm')} on ${format(exCheckIn, 'dd-MMM-yyyy')}.`,
//             };
//           }
//         } else if (newCheckOut && !exCheckOut) {
//           // Existing session is open; check if new session overlaps with it
//           if (newCheckOut > exCheckIn && newCheckIn < exCheckIn) {
//             return {
//               isValid: false,
//               error: `Session overlaps with existing open session starting at ${format(
//                 exCheckIn,
//                 'HH:mm'
//               )} on ${format(exCheckIn, 'dd-MMM-yyyy')}.`,
//             };
//           }
//         } else if (!newCheckOut && !exCheckOut) {
//           // Both sessions are open; prevent multiple open sessions at the same time
//           if (isSameDay(newCheckIn, exCheckIn)) {
//             return {
//               isValid: false,
//               error: `Cannot add another open session when an open session already exists starting at ${format(
//                 exCheckIn,
//                 'HH:mm'
//               )} on ${format(exCheckIn, 'dd-MMM-yyyy')}.`,
//             };
//           }
//         }
//       }

//       return { isValid: true };
//     } catch (error) {
//       console.error('Error checking overlap:', error);
//       return { isValid: false, error: 'Failed to check for overlaps. Please try again.' };
//     }
//   };

//   // Validate new attendance (Admin/Manager/TeamLeader)
//   const validateNewAttendance = async () => {
//     const newErrors = { userId: '', checkInStr: '', checkOutStr: '', shiftEndDate: '' };
//     let isValid = true;

//     if (!newData.userId) {
//       newErrors.userId = 'User selection is required';
//       isValid = false;
//     }
//     if (!newData.checkInStr) {
//       newErrors.checkInStr = 'Check-in time is required';
//       isValid = false;
//     }
//     if (!isSameDay(shiftStartDate, new Date()) && !newData.checkOutStr) {
//       newErrors.checkOutStr = 'Check-out time is required for past dates';
//       isValid = false;
//     }

//     const startDateStr = format(shiftStartDate, 'yyyy-MM-dd');
//     const endDateStr = format(shiftEndDate, 'yyyy-MM-dd');
//     const nextDay = addDays(shiftStartDate, 1);
//     const nextDayStr = format(nextDay, 'yyyy-MM-dd');

//     if (newData.checkOutStr && endDateStr !== startDateStr && endDateStr !== nextDayStr) {
//       newErrors.shiftEndDate = 'Check-out date must be the same as check-in or the next day';
//       isValid = false;
//     }

//     const [checkInHour, checkInMinute] = newData.checkInStr.split(':').map(Number);
//     const checkInDate = new Date(shiftStartDate);
//     checkInDate.setHours(checkInHour, checkInMinute, 0, 0);

//     const now = new Date();
//     if (isAfter(checkInDate, now)) {
//       newErrors.checkInStr = 'Check-in time cannot be in the future';
//       isValid = false;
//     }

//     let checkOutDate = null;
//     if (newData.checkOutStr) {
//       const [checkOutHour, checkOutMinute] = newData.checkOutStr.split(':').map(Number);
//       checkOutDate = new Date(shiftEndDate);
//       checkOutDate.setHours(checkOutHour, checkOutMinute, 0, 0);

//       if (isAfter(checkOutDate, now)) {
//         newErrors.checkOutStr = 'Check-out time cannot be in the future';
//         isValid = false;
//       }
//       if (checkOutDate && isBefore(checkOutDate, checkInDate)) {
//         newErrors.checkOutStr = 'Check-out must be after check-in';
//         isValid = false;
//       }
//     }

//     if (isValid) {
//       const yearMonth = format(shiftStartDate, 'yyyy-MM');
//       const day = format(shiftStartDate, 'd');
//       const overlapCheck = await checkOverlapAndClockIn(newData.userId, checkInDate, checkOutDate, day, yearMonth);
//       if (!overlapCheck.isValid) {
//         newErrors.checkInStr = overlapCheck.error;
//         isValid = false;
//       }
//     }

//     setErrors(newErrors);
//     return isValid;
//   };

//   // Add new attendance (Admin/Manager/TeamLeader)
//   const addNewAttendance = async () => {
//     if (!(await validateNewAttendance())) return;
//     try {
//       const userId = newData.userId;
//       const yearMonth = format(shiftStartDate, 'yyyy-MM');
//       const day = format(shiftStartDate, 'd');

//       const [checkInHour, checkInMinute] = newData.checkInStr.split(':').map(Number);
//       const checkInDate = new Date(shiftStartDate);
//       checkInDate.setHours(checkInHour, checkInMinute, 0, 0);

//       let checkOutDate = null;
//       let workedHours = 'Incomplete';
//       let status = 'open';
//       let isClockedIn = true;

//       if (newData.checkOutStr) {
//         const [checkOutHour, checkOutMinute] = newData.checkOutStr.split(':').map(Number);
//         checkOutDate = new Date(shiftEndDate);
//         checkOutDate.setHours(checkOutHour, checkOutMinute, 0, 0);
//         workedHours = calculateWorkedHours(checkInDate, checkOutDate);
//         status = 'closed';
//         isClockedIn = false;
//       }

//       // Check for overlaps
//       const overlapCheck = await checkOverlapAndClockIn(userId, checkInDate, checkOutDate, day, yearMonth);
//       if (!overlapCheck.isValid) {
//         setErrors(prev => ({ ...prev, checkInStr: overlapCheck.error }));
//         alert(overlapCheck.error);
//         return;
//       }

//       const userAttendanceRef = doc(db, 'users_01', userId, 'attendance', yearMonth);
//       const userAttendanceSnap = await getDoc(userAttendanceRef);

//       let daysData = {};
//       if (userAttendanceSnap.exists()) {
//         daysData = userAttendanceSnap.data().days || {};
//       }

//       const dayData = daysData[day] || { sessions: [], isClockedIn: false };
//       const newSession = {
//         checkIn: Timestamp.fromDate(checkInDate),
//         checkOut: checkOutDate ? Timestamp.fromDate(checkOutDate) : null,
//         worked_hours: workedHours,
//         editedBy: user?.role || 'Admin',
//         editedAt: Timestamp.now(),
//         checkInEdited: false,
//         checkOutEdited: false,
//         status,
//       };

//       dayData.sessions = [...dayData.sessions, newSession];
//       // Update isClockedIn based on all sessions
//       dayData.isClockedIn = isClockedIn || dayData.sessions.some(session => session.status === 'open');
//       daysData[day] = dayData;

//       await setDoc(
//         userAttendanceRef,
//         {
//           days: daysData,
//           metadata: {
//             created: userAttendanceSnap.exists()
//               ? userAttendanceSnap.data().metadata?.created || serverTimestamp()
//               : serverTimestamp(),
//             lastUpdated: serverTimestamp(),
//           },
//         },
//         { merge: true }
//       );

//       setAddingNew(false);
//       setNewData({ userId: '', checkInStr: '', checkOutStr: '' });
//       setErrors({ userId: '', checkInStr: '', checkOutStr: '', shiftEndDate: '' });
//       setShiftEndDate(shiftStartDate);
//       fetchTeamAttendanceData(date);
//     } catch (error) {
//       console.error('Error adding attendance:', error);
//       alert('Failed to add attendance. Please try again.');
//     }
//   };

//   // Handle date range filter (personal view)
//   const handleDateFilter = () => {
//     if (startDate && endDate && isBefore(new Date(endDate), new Date(startDate))) {
//       setError('End date cannot be before start date.');
//       return;
//     }
//     fetchPersonalAttendance();
//   };

//   // Clear date filter (personal view)
//   const clearDateFilter = () => {
//     setStartDate(null);
//     setEndDate(null);
//     fetchPersonalAttendance();
//   };

//   // Calculate editable date range
//   const currentDate = new Date();
//   const lastMonday = startOfWeek(currentDate, { weekStartsOn: 1 });
//   const nextMonday = addWeeks(lastMonday, 1);
//   const editableStart = isMonday(currentDate) ? subWeeks(lastMonday, 1) : lastMonday;
//   const editableEnd = isMonday(currentDate) ? addDays(lastMonday, 1) : nextMonday;

//   const isDateEditable = (dateToCheck) => {
//     return isWithinInterval(dateToCheck, { start: editableStart, end: editableEnd });
//   };

//   const isEditableDate = isDateEditable(date);
//   const isToday = isSameDay(date, new Date());

//   // Permission flags
//   const showActionsColumn = (isAdmin && isEditableDate) || ((isManager) && isToday);
//   const canAddNew = isAdmin && isEditableDate;
//   const canEdit = (isAdmin && isEditableDate) || ((isManager) && isToday);
//   const canDelete = isAdmin && isEditableDate;

//   // Effects
//   useEffect(() => {
//     setShiftEndDate(shiftStartDate);
//   }, [shiftStartDate]);

//   useEffect(() => {
//     if (isTeamMember) {
//       fetchPersonalAttendance();
//     } else {
//       if (showTabs) {
//         if (activeTab === 'team') {
//           fetchUsers();
//           debouncedFetchTeamAttendance(date);
//         } else {
//           fetchPersonalAttendance();
//         }
//       } else {
//         // Admin view
//         fetchUsers();
//         debouncedFetchTeamAttendance(date);
//       }
//     }
//     return () => debouncedFetchTeamAttendance.cancel();
//   }, [date, fetchUsers, debouncedFetchTeamAttendance, isTeamMember, user, activeTab, showTabs]);

//   // Update sorted data when sortField or sortDirection changes (personal view)
//   useEffect(() => {
//     if ((isTeamMember || (showTabs && activeTab === 'personal')) && attendanceData.length > 0) {
//       setAttendanceData(sortData(attendanceData));
//     }
//   }, [sortField, sortDirection, attendanceData, sortData, isTeamMember, showTabs, activeTab]);

//   // ============================== UI COMPONENTS ============================== //

//   // Personal Attendance View (used by TeamMembers and as a tab for Managers/TeamLeaders)
//   const PersonalAttendanceView = () => (
//     <div className="w-full">
//       <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-800">My Attendance</h1>
//           <div className="mt-1 text-sm text-gray-600">
//             Employee ID: <span className="font-medium">{user?.employeeID || 'N/A'}</span>
//           </div>
//         </div>
//       </div>
// {/* 
//       <div className="mb-6 p-4 bg-gray-50 rounded-md">
//         <h2 className="text-sm font-medium text-gray-700 mb-3">Filter by Date Range</h2>
//         <div className="flex flex-col sm:flex-row gap-4 items-end">
//           <div>
//             <label htmlFor="startDate" className="block text-sm text-gray-600 mb-1">
//               Start Date
//             </label>
//             <input
//               type="date"
//               id="startDate"
//               value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
//               onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
//               className="p-2 border rounded-md text-sm bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>
//           <div>
//             <label htmlFor="endDate" className="block text-sm text-gray-600 mb-1">
//               End Date
//             </label>
//             <input
//               type="date"
//               id="endDate"
//               value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
//               onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
//               className="p-2 border rounded-md text-sm bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>
//           <div className="flex gap-2">
//             <button
//               onClick={handleDateFilter}
//               className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200"
//             >
//               Apply Filter
//             </button>
//             <button
//               onClick={clearDateFilter}
//               className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
//             >
//               Clear
//             </button>
//           </div>
//         </div>
//       </div> */}

//       {error && (
//         <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-md text-sm">
//           {error}
//         </div>
//       )}

//       {employeeName && (
//         <div className="mb-6 text-sm text-gray-700">
//           Showing attendance for: <span className="font-medium">{employeeName}</span>
//         </div>
//       )}

//       {attendanceData.length > 0 && (
//         <div className="mb-6 p-4 bg-gray-50 rounded-md shadow-sm">
//           <h2 className="text-sm font-medium text-gray-700">
//             Total Work Hours: <span className="font-semibold">{totalHours}</span>
//           </h2>
//         </div>
//       )}

//       {loading ? (
//         <div className="text-center py-8 text-gray-500">Loading...</div>
//       ) : (
//         <div className="overflow-x-auto rounded-lg border">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th
//                   className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-blue-700"
//                   onClick={() => handleSort('date')}
//                 >
//                   <div className="flex items-center gap-1">
//                     Date
//                     {sortField === 'date' && (
//                       sortDirection === 'asc' ? <FiArrowUp /> : <FiArrowDown />
//                     )}
//                   </div>
//                 </th>
//                 <th
//                   className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-blue-700"
//                   onClick={() => handleSort('checkIn')}
//                 >
//                   <div className="flex items-center gap-1">
//                     Check In
//                     {sortField === 'checkIn' && (
//                       sortDirection === 'asc' ? <FiArrowUp /> : <FiArrowDown />
//                     )}
//                   </div>
//                 </th>
//                 <th
//                   className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-blue-700"
//                   onClick={() => handleSort('checkOut')}
//                 >
//                   <div className="flex items-center gap-1">
//                     Check Out
//                     {sortField === 'checkOut' && (
//                       sortDirection === 'asc' ? <FiArrowUp /> : <FiArrowDown />
//                     )}
//                   </div>
//                 </th>
//                 <th
//                   className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-blue-700"
//                   onClick={() => handleSort('duration')}
//                 >
//                   <div className="flex items-center gap-1">
//                     Duration
//                     {sortField === 'duration' && (
//                       sortDirection === 'asc' ? <FiArrowUp /> : <FiArrowDown />
//                     )}
//                   </div>
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {attendanceData.map((record, index) => (
//                 <tr key={index} className="hover:bg-gray-50">
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.date}</td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                     <div className="flex items-center gap-1">
//                       <span>{record.checkInStr || '--:--'}</span>
//                       {record.checkInEdited && <span className="text-xs text-gray-400">(edited)</span>}
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                     <div className="flex items-center gap-1">
//                       <span>{record.checkOutStr || '--:--'}</span>
//                       {record.checkOutEdited && <span className="text-xs text-gray-400">(edited)</span>}
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.worked}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//           {attendanceData.length === 0 && !error && (
//             <div className="text-center py-6 text-gray-500 text-sm">
//               No attendance records found
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );

//   // Team Attendance View (for Admin, Manager, and TeamLeader)
//   const TeamAttendanceView = () => (
//     <div className="w-full">
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
//         <h1 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">
//           Team Attendance
//         </h1>
//         <div className="flex items-center gap-4">
//           <input
//             type="date"
//             value={format(date, 'yyyy-MM-dd')}
//             onChange={(e) => setDate(new Date(e.target.value))}
//             className="p-2 border rounded-md text-sm bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
//           />
//           {canAddNew && (
//             <button
//               onClick={() => setAddingNew(!addingNew)}
//               className={`px-4 py-2 rounded-md text-sm font-medium transition ${addingNew
//                 ? 'bg-red-100 text-red-700 hover:bg-red-200'
//                 : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
//                 }`}
//             >
//               {addingNew ? 'Cancel' : 'Add Attendance'}
//             </button>
//           )}
//         </div>
//       </div>

//       {addingNew && (
//         <div className="mt-6 p-6 bg-gray-50 rounded-lg shadow-sm">
//           <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Attendance</h3>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             <div className="space-y-2">
//               <label className="block text-sm font-medium text-gray-700">User</label>
//               <Select
//                 options={userOptions}
//                 value={userOptions.find(option => option.value === newData.userId) || null}
//                 onChange={(selectedOption) =>
//                   setNewData({ ...newData, userId: selectedOption ? selectedOption.value : '' })
//                 }
//                 placeholder="Select User"
//                 isSearchable
//                 className="text-sm"
//                 styles={{
//                   control: (base) => ({
//                     ...base,
//                     borderColor: errors.userId ? 'red' : base.borderColor,
//                     boxShadow: errors.userId ? '0 0 0 1px red' : base.boxShadow,
//                     '&:hover': { borderColor: errors.userId ? 'red' : base.borderColor },
//                   }),
//                 }}
//               />
//               {errors.userId && <p className="text-red-500 text-xs mt-1">{errors.userId}</p>}
//             </div>

//             <div className="space-y-2">
//               <label className="block text-sm font-medium text-gray-700">Start Date & Time</label>
//               <input
//                 type="date"
//                 value={format(shiftStartDate, 'yyyy-MM-dd')}
//                 onChange={(e) => {
//                   const selectedDate = new Date(e.target.value);
//                   if (isDateEditable(selectedDate)) {
//                     setShiftStartDate(selectedDate);
//                     setShiftEndDate(selectedDate);
//                     setNewData({ ...newData, checkOutStr: '' });
//                   }
//                 }}
//                 min={format(editableStart, 'yyyy-MM-dd')}
//                 max={format(addDays(editableEnd, -1), 'yyyy-MM-dd')}
//                 className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm p-2"
//               />
//               <input
//                 type="time"
//                 value={newData.checkInStr}
//                 onChange={(e) => setNewData({ ...newData, checkInStr: e.target.value })}
//                 className={`block w-full rounded-md border shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm p-2 ${errors.checkInStr ? 'border-red-500' : 'border-gray-300'}`}
//               />
//               {errors.checkInStr && <p className="text-red-500 text-xs mt-1">{errors.checkInStr}</p>}
//             </div>

//             <div className="space-y-2">
//               <label className="block text-sm font-medium text-gray-700">End Date & Time</label>
//               <input
//                 type="date"
//                 value={format(shiftEndDate, 'yyyy-MM-dd')}
//                 onChange={(e) => {
//                   const selectedDate = new Date(e.target.value);
//                   const startDateStr = format(shiftStartDate, 'yyyy-MM-dd');
//                   const nextDay = addDays(shiftStartDate, 1);
//                   const nextDayStr = format(nextDay, 'yyyy-MM-dd');
//                   if ([startDateStr, nextDayStr].includes(format(selectedDate, 'yyyy-MM-dd'))) {
//                     setShiftEndDate(selectedDate);
//                     setErrors(prev => ({ ...prev, shiftEndDate: '' }));
//                   } else {
//                     setErrors(prev => ({
//                       ...prev,
//                       shiftEndDate: 'Check-out date must be the same as check-in or the next day',
//                     }));
//                   }
//                 }}
//                 min={format(shiftStartDate, 'yyyy-MM-dd')}
//                 max={format(addDays(shiftStartDate, 1), 'yyyy-MM-dd')}
//                 className={`block w-full rounded-md border shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm p-2 ${errors.shiftEndDate ? 'border-red-500' : 'border-gray-300'}`}
//               />
//               <input
//                 type="time"
//                 value={newData.checkOutStr}
//                 onChange={(e) => setNewData({ ...newData, checkOutStr: e.target.value })}
//                 className={`block w-full rounded-md border shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm p-2 ${errors.checkOutStr ? 'border-red-500' : 'border-gray-300'}`}
//               />
//               {errors.checkOutStr && <p className="text-red-500 text-xs mt-1">{errors.checkOutStr}</p>}
//               {errors.shiftEndDate && <p className="text-red-500 text-xs mt-1">{errors.shiftEndDate}</p>}
//               {isSameDay(shiftStartDate, new Date()) && (
//                 <p className="text-gray-500 text-xs mt-1">
//                   Check-out time is optional for today (session will remain open).
//                 </p>
//               )}
//             </div>
//           </div>

//           <div className="mt-6 flex justify-end gap-4">
//             <button
//               onClick={() => {
//                 setAddingNew(false);
//                 setErrors({ userId: '', checkInStr: '', checkOutStr: '', shiftEndDate: '' });
//                 setShiftEndDate(shiftStartDate);
//                 setNewData({ userId: '', checkInStr: '', checkOutStr: '' });
//               }}
//               className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={addNewAttendance}
//               className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
//             >
//               Add Attendance
//             </button>
//           </div>
//         </div>
//       )}

//       {isAdmin && (
//         <div className="mb-6 text-sm text-gray-500 bg-blue-50 p-3 rounded-md">
//           Editable date range: {format(editableStart, 'MMM dd')} - {format(addDays(editableEnd, -1), 'MMM dd')}
//           {(isManager || isTeamLeader) && (
//             <span className="ml-2 text-orange-600">
//               (You can only edit today: {format(new Date(), 'MMM dd')})
//             </span>
//           )}
//         </div>
//       )}

//       {loading ? (
//         <div className="text-center py-8 text-gray-500">Loading...</div>
//       ) : (
//         <div className="overflow-x-auto rounded-lg border">
//           <table key={tableKey} className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
//                 {showActionsColumn && (
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                 )}
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {attendanceData.map((record, index) => (
//                 <tr key={index} className="hover:bg-gray-50">
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.userName}</td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                     {editing === index ? (
//                       <input
//                         type="time"
//                         value={editData.checkInStr}
//                         onChange={(e) => setEditData({ ...editData, checkInStr: e.target.value })}
//                         className="border rounded px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
//                       />
//                     ) : (
//                       <div className="flex items-center gap-1">
//                         <span>{record.checkInStr || '--:--'}</span>
//                         {record.checkInEdited && <span className="text-xs text-gray-400">(edited)</span>}
//                       </div>
//                     )}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                     {editing === index ? (
//                       <input
//                         type="time"
//                         value={editData.checkOutStr}
//                         onChange={(e) => setEditData({ ...editData, checkOutStr: e.target.value })}
//                         className="border rounded px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
//                       />
//                     ) : (
//                       <div className="flex items-center gap-1">
//                         <span>{record.checkOutStr || '--:--'}</span>
//                         {record.checkOutEdited && <span className="text-xs text-gray-400">(edited)</span>}
//                       </div>
//                     )}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.worked}</td>
//                   {showActionsColumn && (
//                     <td className="px-6 py-4 whitespace-nowrap text-sm">
//                       {editing === index ? (
//                         <div className="flex gap-2">
//                           <button
//                             onClick={() => saveEdit(record)}
//                             className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs hover:bg-green-200"
//                           >
//                             Save
//                           </button>
//                           <button
//                             onClick={() => setEditing(null)}
//                             className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs hover:bg-gray-200"
//                           >
//                             Cancel
//                           </button>
//                         </div>
//                       ) : (
//                         <div className="flex gap-2">
//                           {canEdit && (
//                             <button
//                               onClick={() => {
//                                 setEditing(index);
//                                 setEditData({
//                                   checkInStr: record.checkInStr,
//                                   checkOutStr: record.checkOutStr
//                                 });
//                               }}
//                               className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs hover:bg-blue-200"
//                             >
//                               Edit
//                             </button>
//                           )}
//                           {canDelete && (
//                             <button
//                               onClick={() => deleteShift(record)}
//                               className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs hover:bg-red-200"
//                             >
//                               Delete
//                             </button>
//                           )}
//                         </div>
//                       )}
//                     </td>
//                   )}
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//           {attendanceData.length === 0 && (
//             <div className="text-center py-6 text-gray-500 text-sm">
//               No attendance records found for this date
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );

//   // ============================== MAIN RENDER ============================== //
//   return (
//     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//       <div className="bg-white rounded-lg shadow-sm p-6">
//         {/* Tabs for Manager and TeamLeader */}
//         {showTabs && (
//           <div className="flex border-b border-gray-200 mb-6">
//             <button
//               className={`flex items-center px-4 py-3 text-sm font-medium rounded-t-md mr-2 ${activeTab === 'team' 
//                 ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500' 
//                 : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
//               onClick={() => setActiveTab('team')}
//             >
//               <FiUsers className="mr-2" />
//               Team Attendance
//             </button>
//             <button
//               className={`flex items-center px-4 py-3 text-sm font-medium rounded-t-md ${activeTab === 'personal' 
//                 ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500' 
//                 : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
//               onClick={() => setActiveTab('personal')}
//             >
//               <FiUser className="mr-2" />
//               My Attendance
//             </button>
//           </div>
//         )}

//         {/* Content Area */}
//         <div className="mt-4">
//           {isTeamMember ? (
//             <PersonalAttendanceView />
//           ) : showTabs ? (
//             activeTab === 'team' ? (
//               <TeamAttendanceView />
//             ) : (
//               <PersonalAttendanceView />
//             )
//           ) : (
//             <TeamAttendanceView />
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Attendance;

// in this remove all team member code ok and just keep team leader , manager and admin ok 

// adn also make one function that  currecnt user (manager ) can not edit his tattendance ok 

// and also 
// add one button in cirecule and and redirect to this page plase 
// and also remove personal attednace panel ok 

//   if (showMemberAttendance) {
//     return (
//       <div className="flex-1 p-6 overflow-auto">
//         <button
//           onClick={() => setshowMemberAttendance(false)}
//           className="bg-gray-500 text-white px-4 py-2 rounded shadow hover:bg-gray-600 mb-4"
//         >
//          Back
//         </button>
//         <MemberAttendance />
//       </div>
//     );
//   }


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
  updateDoc,
  setDoc,
  getDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import debounce from 'lodash/debounce';
import Select from 'react-select';
import { useAuth } from '../auth/AuthContext';
import { ROLES } from '../config/roles';
import { Link } from 'react-router-dom';


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

  // Determine user roles
  const isAdmin = user?.role === ROLES.ADMIN;
  const isManager = user?.role === ROLES.MANAGER;
  const isTeamLeader = user?.role === ROLES.TEAMLEADER;
  const isTeamMember = user?.role === ROLES.TEAMMEMBER;

  // Fetch users for Admin/Manager/TeamLeader
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
        duration -= 30 * 60 * 1000;
      }
      const hrs = Math.floor(duration / (1000 * 60 * 60));
      const mins = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
      return `${hrs}h ${mins}m`;
    };
  }, []);

  // Fetch team attendance data
  const fetchTeamAttendanceData = useCallback(async (selectedDate) => {
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
      console.error("Error fetching team attendance data:", error);
    } finally {
      setLoading(false);
    }
  }, [calculateWorkedHours]);

  // Debounced fetch function
  const debouncedFetchTeamAttendance = useMemo(() =>
    debounce((newDate) => fetchTeamAttendanceData(newDate), 300),
    [fetchTeamAttendanceData]
  );

  // Save edited attendance
  const saveEdit = async (record) => {
    // Prevent Manager from editing their own attendance
    if (isManager && record.userId === user.uid) {
      alert('Managers cannot edit their own attendance.');
      return;
    }

    try {
      const parts = record.sessionId.split('-');
      if (parts.length !== 4) {
        throw new Error('Invalid session ID format');
      }

      const yearMonth = `${parts[0]}-${parts[1]}`;
      const day = parts[2];
      const index = parseInt(parts[3]);
      const userId = record.userId;

      const userAttendanceRef = doc(db, 'users_01', userId, 'attendance', yearMonth);
      const userAttendanceSnap = await getDoc(userAttendanceRef);

      let days = {};
      let dayData = { sessions: [], isClockedIn: false };
      if (userAttendanceSnap.exists()) {
        days = { ...userAttendanceSnap.data().days };
        dayData = days[day] ? { ...days[day] } : dayData;
      }

      const sessions = [...dayData.sessions];
      if (index >= sessions.length) {
        throw new Error('Invalid session index');
      }

      const [checkInHour, checkInMinute] = editData.checkInStr.split(':').map(Number);
      const newCheckIn = new Date(record.originalCheckIn || date);
      newCheckIn.setHours(checkInHour, checkInMinute, 0, 0);

      let newCheckOut = null;
      let workedHours = 'Incomplete';
      let status = 'open';

      if (editData.checkOutStr) {
        const [checkOutHour, checkOutMinute] = editData.checkOutStr.split(':').map(Number);
        newCheckOut = new Date(record.originalCheckOut || newCheckIn);
        newCheckOut.setHours(checkOutHour, checkOutMinute, 0, 0);
        workedHours = calculateWorkedHours(newCheckIn, newCheckOut);
        status = 'closed';
      }

      const now = new Date();
      if (isAfter(newCheckIn, now)) {
        alert('Check-in time cannot be in the future!');
        setErrors(prev => ({ ...prev, checkInStr: 'Check-in time cannot be in the future' }));
        return;
      }
      if (newCheckOut && isAfter(newCheckOut, now)) {
        alert('Check-out time cannot be in the future!');
        setErrors(prev => ({ ...prev, checkOutStr: 'Check-out time cannot be in the future' }));
        return;
      }
      if (newCheckOut && isBefore(newCheckOut, newCheckIn)) {
        alert('Check-out time must be after check-in time!');
        setErrors(prev => ({ ...prev, checkOutStr: 'Check-out must be after check-in' }));
        return;
      }

      const overlapCheck = await checkOverlapAndClockIn(userId, newCheckIn, newCheckOut, day, yearMonth, index);
      if (!overlapCheck.isValid) {
        alert(overlapCheck.error);
        setErrors(prev => ({ ...prev, checkInStr: overlapCheck.error }));
        return;
      }

      const isCheckInEdited = editData.checkInStr !== record.checkInStr;
      const isCheckOutEdited = editData.checkOutStr !== record.checkOutStr;

      sessions[index] = {
        ...sessions[index],
        checkIn: Timestamp.fromDate(newCheckIn),
        checkOut: newCheckOut ? Timestamp.fromDate(newCheckOut) : null,
        worked_hours: workedHours,
        editedBy: user?.role || 'Admin',
        editedAt: Timestamp.now(),
        checkInEdited: isCheckInEdited ? true : sessions[index].checkInEdited || false,
        checkOutEdited: isCheckOutEdited ? true : sessions[index].checkOutEdited || false,
        status,
      };

      dayData.isClockedIn = sessions.some(session => session.status === 'open');
      dayData.sessions = sessions;
      days[day] = dayData;

      await setDoc(
        userAttendanceRef,
        {
          days,
          metadata: {
            created: userAttendanceSnap.exists()
              ? userAttendanceSnap.data().metadata?.created || serverTimestamp()
              : serverTimestamp(),
            lastUpdated: serverTimestamp(),
          },
        },
        { merge: true }
      );

      setEditing(null);
      setEditData({});
      fetchTeamAttendanceData(date);
    } catch (error) {
      console.error('Error updating attendance:', error);
      alert(`Failed to update attendance: ${error.message}`);
    }
  };

  // Delete shift
  const deleteShift = async (record) => {
    // Prevent Manager from deleting their own attendance
    if (isManager && record.userId === user.uid) {
      alert('Managers cannot delete their own attendance.');
      return;
    }

    if (!window.confirm(`Delete shift for ${record.userName}?`)) return;
    setLoading(true);
    try {
      const parts = record.sessionId.split('-');
      if (parts.length !== 4) {
        console.error("Invalid sessionId format:", record.sessionId);
        return;
      }
      const yearMonth = `${parts[0]}-${parts[1]}`;
      const day = parts[2];
      const index = parseInt(parts[3]);
      const userId = record.userId;

      const userAttendanceRef = doc(db, "users_01", userId, "attendance", yearMonth);
      const userAttendanceSnap = await getDoc(userAttendanceRef);
      if (!userAttendanceSnap.exists()) {
        console.warn("No attendance document found for deletion");
        return;
      }

      const userData = userAttendanceSnap.data();
      const days = { ...userData.days };
      const dayData = { ...days[day] };
      const sessions = [...dayData.sessions];

      sessions.splice(index, 1);
      if (sessions.length === 0) {
        delete days[day];
      } else {
        dayData.sessions = sessions;
        days[day] = {
          ...dayData,
          metadata: {
            created: dayData.metadata?.created || serverTimestamp(),
            lastUpdated: serverTimestamp()
          }
        };
      }

      await updateDoc(userAttendanceRef, { days });
      setAttendanceData([]);
      await fetchTeamAttendanceData(date);
      setTableKey(prev => prev + 1);
    } catch (error) {
      console.error("Error deleting shift:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check for overlapping sessions and clock-in status
  const checkOverlapAndClockIn = async (userId, checkInDate, checkOutDate, day, yearMonth, excludeIndex = -1) => {
    try {
      const userAttendanceRef = doc(db, "users_01", userId, "attendance", yearMonth);
      const userAttendanceSnap = await getDoc(userAttendanceRef);
      let existingSessions = [];

      if (userAttendanceSnap.exists()) {
        const daysData = userAttendanceSnap.data().days || {};
        const dayData = daysData[day] || { sessions: [], isClockedIn: false };
        existingSessions = dayData.sessions || [];
      }

      const newCheckIn = new Date(checkInDate);
      newCheckIn.setMilliseconds(0);
      const newCheckOut = checkOutDate ? new Date(checkOutDate) : null;
      if (newCheckOut) newCheckOut.setMilliseconds(0);

      for (let i = 0; i < existingSessions.length; i++) {
        if (i === excludeIndex) continue;

        const existingCheckIn = existingSessions[i].checkIn?.toDate?.() || existingSessions[i].checkIn;
        const existingCheckOut = existingSessions[i].checkOut?.toDate?.() || existingSessions[i].checkOut;

        if (!existingCheckIn) continue;

        const exCheckIn = new Date(existingCheckIn);
        exCheckIn.setMilliseconds(0);
        const exCheckOut = existingCheckOut ? new Date(existingCheckOut) : null;
        if (exCheckOut) exCheckOut.setMilliseconds(0);

        if (newCheckOut && exCheckOut) {
          const isOverlap =
            (newCheckIn >= exCheckIn && newCheckIn < exCheckOut) ||
            (newCheckOut > exCheckIn && newCheckOut <= exCheckOut) ||
            (newCheckIn <= exCheckIn && newCheckOut >= exCheckOut);

          if (isOverlap) {
            return {
              isValid: false,
              error: `Session overlaps with existing session from ${format(
                exCheckIn,
                'HH:mm'
              )} to ${format(exCheckOut, 'HH:mm')} on ${format(exCheckIn, 'dd-MMM-yyyy')}.`,
            };
          }
        } else if (!newCheckOut && exCheckOut) {
          if (newCheckIn >= exCheckIn && newCheckIn < exCheckOut) {
            return {
              isValid: false,
              error: `Check-in at ${format(newCheckIn, 'HH:mm')} overlaps with existing session from ${format(
                exCheckIn,
                'HH:mm'
              )} to ${format(exCheckOut, 'HH:mm')} on ${format(exCheckIn, 'dd-MMM-yyyy')}.`,
            };
          }
        } else if (newCheckOut && !exCheckOut) {
          if (newCheckOut > exCheckIn && newCheckIn < exCheckIn) {
            return {
              isValid: false,
              error: `Session overlaps with existing open session starting at ${format(
                exCheckIn,
                'HH:mm'
              )} on ${format(exCheckIn, 'dd-MMM-yyyy')}.`,
            };
          }
        } else if (!newCheckOut && !exCheckOut) {
          if (isSameDay(newCheckIn, exCheckIn)) {
            return {
              isValid: false,
              error: `Cannot add another open session when an open session already exists starting at ${format(
                exCheckIn,
                'HH:mm'
              )} on ${format(exCheckIn, 'dd-MMM-yyyy')}.`,
            };
          }
        }
      }

      return { isValid: true };
    } catch (error) {
      console.error('Error checking overlap:', error);
      return { isValid: false, error: 'Failed to check for overlaps. Please try again.' };
    }
  };

  // Validate new attendance
  const validateNewAttendance = async () => {
    const newErrors = { userId: '', checkInStr: '', checkOutStr: '', shiftEndDate: '' };
    let isValid = true;


    if (!newData.userId) {
      newErrors.userId = 'User selection is required';
      isValid = false;
    }
    if (!newData.checkInStr) {
      newErrors.checkInStr = 'Check-in time is required';
      isValid = false;
    }
    if (!isSameDay(shiftStartDate, new Date()) && !newData.checkOutStr) {
      newErrors.checkOutStr = 'Check-out time is required for past dates';
      isValid = false;
    }

    const startDateStr = format(shiftStartDate, 'yyyy-MM-dd');
    const endDateStr = format(shiftEndDate, 'yyyy-MM-dd');
    const nextDay = addDays(shiftStartDate, 1);
    const nextDayStr = format(nextDay, 'yyyy-MM-dd');

    if (newData.checkOutStr && endDateStr !== startDateStr && endDateStr !== nextDayStr) {
      newErrors.shiftEndDate = 'Check-out date must be the same as check-in or the next day';
      isValid = false;
    }

    const [checkInHour, checkInMinute] = newData.checkInStr.split(':').map(Number);
    const checkInDate = new Date(shiftStartDate);
    checkInDate.setHours(checkInHour, checkInMinute, 0, 0);

    const now = new Date();
    if (isAfter(checkInDate, now)) {
      newErrors.checkInStr = 'Check-in time cannot be in the future';
      isValid = false;
    }

    let checkOutDate = null;
    if (newData.checkOutStr) {
      const [checkOutHour, checkOutMinute] = newData.checkOutStr.split(':').map(Number);
      checkOutDate = new Date(shiftEndDate);
      checkOutDate.setHours(checkOutHour, checkOutMinute, 0, 0);

      if (isAfter(checkOutDate, now)) {
        newErrors.checkOutStr = 'Check-out time cannot be in the future';
        isValid = false;
      }
      if (checkOutDate && isBefore(checkOutDate, checkInDate)) {
        newErrors.checkOutStr = 'Check-out must be after check-in';
        isValid = false;
      }
    }

    if (isValid) {
      const yearMonth = format(shiftStartDate, 'yyyy-MM');
      const day = format(shiftStartDate, 'd');
      const overlapCheck = await checkOverlapAndClockIn(newData.userId, checkInDate, checkOutDate, day, yearMonth);
      if (!overlapCheck.isValid) {
        newErrors.checkInStr = overlapCheck.error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  // Add new attendance
  const addNewAttendance = async () => {
    if (!(await validateNewAttendance())) return;
    try {
      const userId = newData.userId;
      const yearMonth = format(shiftStartDate, 'yyyy-MM');
      const day = format(shiftStartDate, 'd');

      const [checkInHour, checkInMinute] = newData.checkInStr.split(':').map(Number);
      const checkInDate = new Date(shiftStartDate);
      checkInDate.setHours(checkInHour, checkInMinute, 0, 0);

      let checkOutDate = null;
      let workedHours = 'Incomplete';
      let status = 'open';
      let isClockedIn = true;

      if (newData.checkOutStr) {
        const [checkOutHour, checkOutMinute] = newData.checkOutStr.split(':').map(Number);
        checkOutDate = new Date(shiftEndDate);
        checkOutDate.setHours(checkOutHour, checkOutMinute, 0, 0);
        workedHours = calculateWorkedHours(checkInDate, checkOutDate);
        status = 'closed';
        isClockedIn = false;
      }

      const overlapCheck = await checkOverlapAndClockIn(userId, checkInDate, checkOutDate, day, yearMonth);
      if (!overlapCheck.isValid) {
        setErrors(prev => ({ ...prev, checkInStr: overlapCheck.error }));
        alert(overlapCheck.error);
        return;
      }

      const userAttendanceRef = doc(db, 'users_01', userId, 'attendance', yearMonth);
      const userAttendanceSnap = await getDoc(userAttendanceRef);

      let daysData = {};
      if (userAttendanceSnap.exists()) {
        daysData = userAttendanceSnap.data().days || {};
      }

      const dayData = daysData[day] || { sessions: [], isClockedIn: false };
      const newSession = {
        checkIn: Timestamp.fromDate(checkInDate),
        checkOut: checkOutDate ? Timestamp.fromDate(checkOutDate) : null,
        worked_hours: workedHours,
        editedBy: user?.role || 'Admin',
        editedAt: Timestamp.now(),
        checkInEdited: false,
        checkOutEdited: false,
        status,
      };

      dayData.sessions = [...dayData.sessions, newSession];
      dayData.isClockedIn = isClockedIn || dayData.sessions.some(session => session.status === 'open');
      daysData[day] = dayData;

      await setDoc(
        userAttendanceRef,
        {
          days: daysData,
          metadata: {
            created: userAttendanceSnap.exists()
              ? userAttendanceSnap.data().metadata?.created || serverTimestamp()
              : serverTimestamp(),
            lastUpdated: serverTimestamp(),
          },
        },
        { merge: true }
      );

      setAddingNew(false);
      setNewData({ userId: '', checkInStr: '', checkOutStr: '' });
      setErrors({ userId: '', checkInStr: '', checkOutStr: '', shiftEndDate: '' });
      setShiftEndDate(shiftStartDate);
      fetchTeamAttendanceData(date);
    } catch (error) {
      console.error('Error adding attendance:', error);
      alert('Failed to add attendance. Please try again.');
    }
  };

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

  // Effects
  useEffect(() => {
    setShiftEndDate(shiftStartDate);
  }, [shiftStartDate]);

  useEffect(() => {
    fetchUsers();
    debouncedFetchTeamAttendance(date);
    return () => debouncedFetchTeamAttendance.cancel();
  }, [date, fetchUsers, debouncedFetchTeamAttendance]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Team Attendance</h1>

          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={format(date, 'yyyy-MM-dd')}
                onChange={(e) => setDate(new Date(e.target.value))}
                className="p-2 border rounded-md text-sm bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              {(isTeamLeader || isTeamMember || isManager) && (
                <Link
                  to="/memberAttendance"
                  className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition"
                  title="View Your Attendance"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </Link>
              )}
            </div>
            {canAddNew && (
              <button
                onClick={() => setAddingNew(!addingNew)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${addingNew
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
              >
                {addingNew ? 'Cancel' : 'Add Attendance'}
              </button>
            )}
          </div>
        </div>

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
                      '&:hover': { borderColor: errors.userId ? 'red' : base.borderColor },
                    }),
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
                      setShiftEndDate(selectedDate);
                      setNewData({ ...newData, checkOutStr: '' });
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
                      setErrors(prev => ({ ...prev, shiftEndDate: '' }));
                    } else {
                      setErrors(prev => ({
                        ...prev,
                        shiftEndDate: 'Check-out date must be the same as check-in or the next day',
                      }));
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
                {isSameDay(shiftStartDate, new Date()) && (
                  <p className="text-gray-500 text-xs mt-1">
                    Check-out time is optional for today (session will remain open).
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => {
                  setAddingNew(false);
                  setErrors({ userId: '', checkInStr: '', checkOutStr: '', shiftEndDate: '' });
                  setShiftEndDate(shiftStartDate);
                  setNewData({ userId: '', checkInStr: '', checkOutStr: '' });
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

        {isAdmin && (
          <div className="mb-6 text-sm text-gray-500 bg-blue-50 p-3 rounded-md">
            Editable date range: {format(editableStart, 'MMM dd')} - {format(addDays(editableEnd, -1), 'MMM dd')}
            {(isManager || isTeamLeader) && (
              <span className="ml-2 text-orange-600">
                (You can only edit today: {format(new Date(), 'MMM dd')})
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
                                  // Prevent Manager from editing their own attendance
                                  if (isManager && record.userId === user.uid) {
                                    alert('Managers cannot edit their own attendance.');
                                    return;
                                  }
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
      </div>
    </div>
  );
};

export default Attendance;