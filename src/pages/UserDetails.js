import React, { Fragment, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, arrayUnion } from 'firebase/firestore';
import { Dialog, Transition } from '@headlessui/react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../auth/AuthContext';
import { ROLES } from '../config/roles';

const displayValue = (value) => value || 'N/A';

// Define field access rules
const fieldAccessRules = {
    [ROLES.ADMIN]: {
        editable: [
            'name', 'email', 'phone', 'role', 'address', 'dob', 'document_number',
            'shareCode', 'bank_details.bank_name', 'bank_details.account_number',
            'bank_details.branch_name', 'customerID', 'employeeID'
        ]
    },
    [ROLES.MANAGER]: {
        editable: ['name', 'dob', 'address']
    },
    [ROLES.TEAMLEADER]: {
        editable: []
    }
};

const UserDetails = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [user, setUser] = useState(null);
    const [duplicateProfiles, setDuplicateProfiles] = useState([]);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isPhoneChangeAlertOpen, setIsPhoneChangeAlertOpen] = useState(false);
    const [newPhoneNumber, setNewPhoneNumber] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        dob: '',
        document_number: '',
        role: '',
        member_since: '',
        shareCode: '',
        bank_details: {
            account_number: '',
            bank_name: '',
            branch_name: ''
        },
        customerID: '',
        employeeID: ''
    });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const cancelButtonRef = useRef(null); // For initial focus in phone change dialog

    // Role checks
    const isAdmin = currentUser?.role === ROLES.ADMIN;
    const isManager = currentUser?.role === ROLES.MANAGER;
    const isTeamLeader = currentUser?.role === ROLES.TEAMLEADER;

    // Get editable fields for current user
    const currentUserRole = currentUser?.role || ROLES.TEAMMEMBER;
    const editableFields = fieldAccessRules[currentUserRole]?.editable || [];

    // Redirect unauthorized users
    useEffect(() => {
        if (currentUser?.role === ROLES.TEAMMEMBER) {
            navigate('/unauthorized', { replace: true });
        }
    }, [currentUser, navigate]);

    useEffect(() => {
        const auth = getAuth();

        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            if (!authUser) return;

            try {
                await authUser.reload();
                const refreshedUser = auth.currentUser;

                if (refreshedUser.emailVerified && !user?.emailVerified) {
                    const collectionName = user?.originalCollection || 'users_01';
                    const docId = user?.phone;

                    if (collectionName && docId) {
                        const docRef = doc(db, collectionName, docId);
                        await updateDoc(docRef, { emailVerified: true });
                        setUser((prev) => ({
                            ...prev,
                            emailVerified: true,
                        }));
                        console.log("Email verified status updated in Firestore.");
                    }
                }
            } catch (err) {
                console.error("Error checking or updating emailVerified:", err);
            }
        });

        return () => unsubscribe();
    }, [user?.emailVerified, user?.originalCollection, user?.phone]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                let profile = null;

                if (isAdmin) {
                    const [usersSnapshot, customersSnapshot] = await Promise.all([
                        getDocs(query(collection(db, 'users_01'), where('userId', '==', userId))),
                        getDocs(query(collection(db, 'customers'), where('userId', '==', userId)))
                    ]);

                    const employees = usersSnapshot.docs.map(doc => ({
                        ...doc.data(),
                        idType: 'employee',
                        originalRole: doc.data().role,
                        phone: doc.id,
                        originalCollection: 'users_01'
                    }));

                    const customers = customersSnapshot.docs.map(doc => ({
                        ...doc.data(),
                        idType: 'customer',
                        role: 'customer',
                        phone: doc.id,
                        originalCollection: 'customers'
                    }));

                    const allProfiles = [...employees, ...customers];

                    if (allProfiles.length > 1) {
                        setDuplicateProfiles(allProfiles);
                        return;
                    }

                    if (allProfiles.length === 0) {
                        setError('User not found');
                        return;
                    }

                    profile = allProfiles[0];
                } else {
                    const usersSnapshot = await getDocs(query(collection(db, 'users_01'), where('userId', '==', userId)));
                    const employees = usersSnapshot.docs.map(doc => ({
                        ...doc.data(),
                        idType: 'employee',
                        originalRole: doc.data().role,
                        phone: doc.id,
                        originalCollection: 'users_01'
                    }));

                    if (employees.length === 0) {
                        setError('User not found or access denied');
                        return;
                    }

                    profile = employees[0];
                    if (isManager && (profile.role === ROLES.ADMIN || profile.role === 'customer')) {
                        setError('Access denied: Managers can only view Team Leaders or Team Members');
                        return;
                    }
                    if (isTeamLeader && profile.role !== ROLES.TEAMMEMBER) {
                        setError('Access denied: Team Leaders can only view Team Members');
                        return;
                    }
                }

                setUser(profile);
                setFormData(prev => ({
                    ...prev,
                    ...profile,
                    bank_details: profile.bank_details || {},
                    customerID: profile.customerID || '',
                    employeeID: profile.employeeID || '',
                    role: profile.originalCollection === 'customers' ? 'customer' : profile.role
                }));
            } catch (err) {
                console.error('Error fetching user:', err);
                setError('Failed to load user data');
            }
        };

        fetchUser();
    }, [userId, isAdmin, isManager, isTeamLeader]);

    const trackEmployeeChanges = (originalData, newData) => {
        const changes = [];
        const fieldsToTrack = editableFields;

        fieldsToTrack.forEach(field => {
            const oldValue = originalData[field] ?? null;
            const newValue = newData[field] ?? null;
            if (oldValue !== newValue) {
                changes.push({
                    field,
                    oldValue,
                    newValue,
                    changedAt: new Date().toISOString(),
                    changedBy: currentUser?.role || 'admin'
                });
            }
        });

        return changes;
    };

    const handleProfileSelection = (selectedProfile) => {
        setUser(selectedProfile);
        setDuplicateProfiles([]);
        setFormData(prev => ({
            ...prev,
            ...selectedProfile,
            bank_details: selectedProfile.bank_details || {},
            customerID: selectedProfile.customerID || '',
            employeeID: selectedProfile.employeeID || '',
            role: selectedProfile.originalCollection === 'customers' ? 'customer' : selectedProfile.role
        }));
    };

    const handleEdit = () => setIsEditOpen(true);

    const handlePhoneChangeAlertConfirm = () => {
        setIsPhoneChangeAlertOpen(false);
        setIsEditOpen(false);
        navigate('/admin/user/changephoneNumber', { state: { oldPhone: user.phone } });
    };

    const formatShareCode = (value) => {
        const digits = value.replace(/\D/g, '').slice(0, 6);
        let formatted = '';
        for (let i = 0; i < digits.length; i++) {
            if (i === 2 || i === 4) formatted += '/';
            formatted += digits[i];
        }
        return formatted;
    };

    const handleShareCodeChange = (e) => {
        const formatted = formatShareCode(e.target.value);
        setFormData({ ...formData, shareCode: formatted });
        setError('');
    };

    const handleSave = async () => {
        try {
            const requiredFields = {
                name: 'Name is required',
                email: 'Email is required',
                phone: 'Phone number is required',
                role: 'Role is required'
            };

            for (const [field, message] of Object.entries(requiredFields)) {
                if (editableFields.includes(field) && !formData[field]) {
                    setError(message);
                    return;
                }
            }

            if (editableFields.includes('name') && !/^[A-Za-z\s]+$/.test(formData.name)) {
                setError('Full Name should only contain alphabets and spaces.');
                return;
            }

            if (isAdmin && !/^[^\s@]+@(gmail\.com|yahoo\.com|outlook\.com)$/.test(formData.email)) {
                setError('Invalid email format');
                return;
            }

            if (isAdmin && formData.role === 'customer' && !formData.customerID) {
                setError('Customer ID is required');
                return;
            }

            if (isAdmin && formData.role !== 'customer' && formData.employeeID) {
                const empIdQuery = query(
                    collection(db, 'users_01'),
                    where('employeeID', '==', formData.employeeID)
                );
                const empIdSnapshot = await getDocs(empIdQuery);
                if (
                    !empIdSnapshot.empty &&
                    empIdSnapshot.docs.some(docSnap => docSnap.id !== formData.phone)
                ) {
                    setError('This Employee ID is already in use by another user.');
                    return;
                }
            }

            if (isAdmin && formData.document_number && !/^\d{5}$/.test(formData.document_number)) {
                setError('Document Number must be exactly 5 digits.');
                return;
            }

            if (isAdmin && formData.bank_details.bank_name && !/^[a-zA-Z\s]+$/.test(formData.bank_details.bank_name)) {
                setError('Bank Name can only contain alphabets and spaces.');
                return;
            }

            if (isAdmin && formData.bank_details.branch_name && !/^[a-zA-Z\s]+$/.test(formData.bank_details.branch_name)) {
                setError('Branch Name can only contain alphabets and spaces.');
                return;
            }

            if (editableFields.includes('dob') && formData.dob) {
                const dobDate = new Date(formData.dob);
                const today = new Date();
                if (dobDate > today) {
                    setError('Date of Birth cannot be in the future');
                    return;
                }
                const dobYear = dobDate.getFullYear();
                if (dobYear > 2001) {
                    setError('Date of Birth year must be 2001 or earlier.');
                    return;
                }
            }

            if (isAdmin && formData.shareCode && !/^\d{2}\/\d{2}\/\d{2}$/.test(formData.shareCode)) {
                setError('Share Code must be in the format __/__/__ (e.g., 12/34/56).');
                return;
            }

            if (isAdmin && formData.bank_details.account_number && !/^\d{8}$/.test(formData.bank_details.account_number)) {
                setError('Account Number must be exactly 8 digits.');
                return;
            }

            if (editableFields.includes('address') && formData.address && formData.address.toLowerCase() === 'none') {
                setError('Address cannot be "none"');
                return;
            }

            if (isAdmin && formData.phone !== user.phone) {
                setNewPhoneNumber(formData.phone);
                setIsPhoneChangeAlertOpen(true);
                return;
            }

            const [customerDoc, employeeDoc] = await Promise.all([
                getDoc(doc(db, 'customers', user.phone)),
                getDoc(doc(db, 'users_01', user.phone))
            ]);

            const updates = [];
            let employeeChanges = [];
            let isConvertingToCustomer = false;

            const commonData = {
                name: editableFields.includes('name') ? formData.name : user.name,
                email: isAdmin ? formData.email : user.email,
                phone: isAdmin ? formData.phone : user.phone,
                address: editableFields.includes('address') ? formData.address : user.address,
                dob: editableFields.includes('dob') ? formData.dob : user.dob,
                document_number: isAdmin ? formData.document_number : user.document_number,
                bank_details: isAdmin ? formData.bank_details : user.bank_details || {},
                member_since: isAdmin ? (formData.member_since || new Date().toISOString()) : user.member_since,
                shareCode: isAdmin ? formData.shareCode : user.shareCode,
                updatedAt: new Date(),
                userId: user.userId,
                emailVerified: isAdmin ? false : user.emailVerified
            };

            if (employeeDoc.exists()) {
                const existingEmployeeData = employeeDoc.data();
                const employeeUpdate = {
                    ...commonData,
                    role: isAdmin ? (formData.role !== 'customer' ? formData.role : existingEmployeeData.role) : user.role,
                    employeeID: isAdmin ? formData.employeeID : existingEmployeeData.employeeID
                };

                employeeChanges = trackEmployeeChanges(existingEmployeeData, employeeUpdate);
                if (employeeChanges.length > 0) {
                    employeeUpdate.changeField = arrayUnion(...employeeChanges);
                }

                updates.push(updateDoc(doc(db, 'users_01', user.phone), employeeUpdate));
            }

            if ((isAdmin || isManager) && customerDoc.exists()) {
                const existingCustomerData = customerDoc.data();
                const customerUpdate = {
                    ...commonData,
                    role: 'customer',
                    customerID: isAdmin ? formData.customerID : existingCustomerData.customerID
                };
                delete customerUpdate.employeeID;
                delete customerUpdate.changeField;

                updates.push(updateDoc(doc(db, 'customers', user.phone), customerUpdate));
            }

            if (isAdmin && !customerDoc.exists() && formData.role === 'customer') {
                const customerData = {
                    ...commonData,
                    role: 'customer',
                    customerID: formData.customerID
                };
                delete customerData.employeeID;
                delete customerData.changeField;

                updates.push(setDoc(doc(db, 'customers', formData.phone), customerData));
            }

            if (isAdmin && !employeeDoc.exists() && formData.role !== 'customer') {
                const employeeData = {
                    ...commonData,
                    role: formData.role,
                    employeeID: formData.employeeID,
                    changeField: arrayUnion(...trackEmployeeChanges({}, formData))
                };

                updates.push(setDoc(doc(db, 'users_01', formData.phone), employeeData));
            }

            if (isAdmin && formData.role === 'customer' && employeeDoc?.exists()) {
                updates.push(
                    updateDoc(doc(db, 'users_01', formData.phone), {
                        originalRole: employeeDoc.data().role
                    })
                );
                isConvertingToCustomer = true;
            }

            if (isAdmin && formData.role !== 'customer' && customerDoc?.exists()) {
                updates.push(
                    updateDoc(doc(db, 'customers', user.phone), {
                        status: 'converted-to-employee',
                        convertedAt: new Date()
                    })
                );
            }

            await Promise.all(updates);

            setUser(prev => ({
                ...prev,
                ...commonData,
                role: isAdmin ? formData.role : prev.role,
                customerID: isAdmin && formData.role === 'customer' ? formData.customerID : prev.customerID,
                employeeID: isAdmin && formData.role !== 'customer' ? formData.employeeID : prev.employeeID,
                changeField: employeeDoc.exists() ? [...(prev.changeField || []), ...employeeChanges] : prev.changeField || [],
                originalRole: isConvertingToCustomer ? employeeDoc.data().role : prev.originalRole
            }));

            setSuccessMessage('User updated successfully!');
            setTimeout(() => navigate('/users'), 1000);
        } catch (err) {
            console.error('Update error:', err);
            setError(`Failed to update user: ${err.message}`);
        }
    };

    const ChangeAwareDisplay = ({ field, value, changes }) => {
        if (!changes || changes.length === 0) return <span>{displayValue(value)}</span>;

        const latestChange = changes
            .filter(c => c.field === field || c.field.startsWith(`${field}.`))
            .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))[0];

        if (!latestChange) return <span>{displayValue(value)}</span>;

        return (
            <div className="flex items-center gap-2">
                <span>{displayValue(latestChange.newValue)}</span>
                <span className="text-green-600 text-sm font-medium">(new)</span>
            </div>
        );
    };

    if (duplicateProfiles.length > 0) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white rounded-lg shadow p-6 space-y-4">
                    <h2 className="text-xl font-bold text-red-600">Duplicate Profiles Found</h2>
                    <p className="text-gray-600">Select which profile to view:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {duplicateProfiles.map((profile, index) => (
                            <button
                                key={index}
                                onClick={() => handleProfileSelection(profile)}
                                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium">
                                        {profile.idType === 'customer' ? '👤 Customer' : '👨‍💼 Employee'}
                                    </h3>
                                    <span className="text-sm text-gray-500">
                                        {new Date(profile.member_since).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="mt-2 space-y-1">
                                    <p className="text-sm">Phone: {profile.phone}</p>
                                    <p className="text-sm">
                                        ID: {profile.idType === 'customer' ? profile.customerID : profile.employeeID}
                                    </p>
                                    <p className="text-sm">Role: <span className="capitalize">{profile.role}</span></p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!user) return <div className="p-4 text-center">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">User Details</h1>
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="mr-2 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                    >
                        Go Back
                    </button>
                    {(isAdmin || isManager) && (
                        <button
                            onClick={handleEdit}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            Edit User
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">User ID</label>
                        <p className="mt-1 font-mono">{displayValue(user.userId)}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            {user.idType === 'customer' ? 'Customer ID' : 'Employee ID'}
                        </label>
                        <p className="mt-1 font-mono">
                            {displayValue(user.idType === 'customer' ? user.customerID : user.employeeID)}
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <div className="mt-1">
                            <ChangeAwareDisplay field="name" value={user.name} changes={user?.changeField || []} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <div className="mt-1 flex items-center gap-2">
                            <ChangeAwareDisplay field="email" value={user.email} changes={user?.changeField || []} />
                            {user?.emailVerified && (
                                <span className="text-green-600 text-sm font-semibold border border-green-600 px-2 py-0.5 rounded-full">
                                    Verified
                                </span>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <p className="mt-1">{displayValue(user.phone)}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <p className="mt-1 capitalize">{displayValue(user.role)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <div className="mt-1">
                            <ChangeAwareDisplay field="address" value={user.address} changes={user?.changeField || []} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                        <div className="mt-1">
                            <ChangeAwareDisplay field="dob" value={user.dob} changes={user?.changeField || []} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Document Number</label>
                        <div className="mt-1">
                            <ChangeAwareDisplay field="document_number" value={user.document_number} changes={user?.changeField || []} />
                            Emberson</div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Member Since</label>
                        <p className="mt-1">{displayValue(new Date(user.member_since).toLocaleDateString())}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Share Code</label>
                        <div className="mt-1">
                            <ChangeAwareDisplay field="shareCode" value={user.shareCode} changes={user?.changeField || []} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                        <div className="mt-1">
                            <ChangeAwareDisplay field="bank_details.bank_name" value={user.bank_details?.bank_name} changes={user?.changeField || []} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Account Number</label>
                        <div className="mt-1">
                            <ChangeAwareDisplay field="bank_details.account_number" value={user.bank_details?.account_number} changes={user?.changeField || []} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Branch Name</label>
                        <div className="mt-1">
                            <ChangeAwareDisplay field="bank_details.branch_name" value={user.bank_details?.branch_name} changes={user?.changeField || []} />
                        </div>
                    </div>
                </div>
            </div>

            <Transition appear show={isEditOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={() => setIsEditOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/40" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-2xl bg-white rounded-2xl p-8 shadow-xl">
                                    <Dialog.Title className="text-xl font-semibold mb-6">Edit User</Dialog.Title>
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Name*</label>
                                                <input
                                                    value={formData.name}
                                                    onChange={(e) => {
                                                        if (editableFields.includes('name')) {
                                                            setFormData({ ...formData, name: e.target.value });
                                                            setError('');
                                                        }
                                                    }}
                                                    disabled={!editableFields.includes('name')}
                                                    className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!editableFields.includes('name') ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
                                                        }`}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => {
                                                        if (isAdmin) {
                                                            setFormData({ ...formData, email: e.target.value });
                                                            setError('');
                                                        }
                                                    }}
                                                    disabled={!isAdmin}
                                                    className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isAdmin ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
                                                        }`}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone*</label>
                                                <input
                                                    value={formData.phone}
                                                    onChange={(e) => {
                                                        if (isAdmin) {
                                                            setFormData({ ...formData, phone: e.target.value });
                                                            setError('');
                                                        }
                                                    }}
                                                    disabled={!isAdmin}
                                                    className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isAdmin ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
                                                        }`}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Role*</label>
                                                <select
                                                    value={formData.role}
                                                    onChange={(e) => {
                                                        if (isAdmin) {
                                                            setFormData({ ...formData, role: e.target.value });
                                                            setError('');
                                                        }
                                                    }}
                                                    disabled={!isAdmin}
                                                    className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 !isAdmin ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                                                >
                                                    <option value="customer">Customer</option>
                                                    <option value="teammember">Team Member</option>
                                                    <option value="manager">Manager</option>
                                                    <option value="teamleader">Team Leader</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </div>
                                            {formData.role === 'customer' ? (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer ID*</label>
                                                    <input
                                                        value={formData.customerID}
                                                        onChange={(e) => {
                                                            if (isAdmin) {
                                                                setFormData({ ...formData, customerID: e.target.value });
                                                                setError('');
                                                            }
                                                        }}
                                                        disabled={!isAdmin}
                                                        className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isAdmin ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
                                                            }`}
                                                    />
                                                </div>
                                            ) : (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID*</label>
                                                    <input
                                                        value={formData.employeeID}
                                                        onChange={(e) => {
                                                            if (isAdmin) {
                                                                setFormData({ ...formData, employeeID: e.target.value });
                                                                setError('');
                                                            }
                                                        }}
                                                        disabled={!isAdmin}
                                                        className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isAdmin ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
                                                            }`}
                                                    />
                                                </div>
                                            )}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                                <input
                                                    value={formData.address}
                                                    onChange={(e) => {
                                                        if (editableFields.includes('address')) {
                                                            setFormData({ ...formData, address: e.target.value });
                                                            setError('');
                                                        }
                                                    }}
                                                    disabled={!editableFields.includes('address')}
                                                    className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!editableFields.includes('address') ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
                                                        }`}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                                <input
                                                    type="date"
                                                    value={formData.dob}
                                                    onChange={(e) => {
                                                        if (editableFields.includes('dob')) {
                                                            setFormData({ ...formData, dob: e.target.value });
                                                            setError('');
                                                        }
                                                    }}
                                                    disabled={!editableFields.includes('dob')}
                                                    className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!editableFields.includes('dob') ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
                                                        }`}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Document Number</label>
                                                <input
                                                    value={formData.document_number}
                                                    onChange={(e) => {
                                                        if (isAdmin) {
                                                            setFormData({ ...formData, document_number: e.target.value });
                                                            setError('');
                                                        }
                                                    }}
                                                    disabled={!isAdmin}
                                                    className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isAdmin ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
                                                        }`}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Share Code</label>
                                                <input
                                                    value={formData.shareCode}
                                                    onChange={handleShareCodeChange}
                                                    placeholder="e.g., 12/34/56"
                                                    maxLength={8}
                                                    disabled={!isAdmin}
                                                    className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isAdmin ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
                                                        }`}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                                                <input
                                                    value={formData.bank_details.bank_name}
                                                    onChange={(e) => {
                                                        if (isAdmin) {
                                                            setFormData({
                                                                ...formData,
                                                                bank_details: { ...formData.bank_details, bank_name: e.target.value }
                                                            });
                                                            setError('');
                                                        }
                                                    }}
                                                    disabled={!isAdmin}
                                                    className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isAdmin ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
                                                        }`}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                                                <input
                                                    value={formData.bank_details.account_number}
                                                    onChange={(e) => {
                                                        if (isAdmin) {
                                                            setFormData({
                                                                ...formData,
                                                                bank_details: { ...formData.bank_details, account_number: e.target.value }
                                                            });
                                                            setError('');
                                                        }
                                                    }}
                                                    disabled={!isAdmin}
                                                    className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isAdmin ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
                                                        }`}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                                                <input
                                                    value={formData.bank_details.branch_name}
                                                    onChange={(e) => {
                                                        if (isAdmin) {
                                                            setFormData({
                                                                ...formData,
                                                                bank_details: { ...formData.bank_details, branch_name: e.target.value }
                                                            });
                                                            setError('');
                                                        }
                                                    }}
                                                    disabled={!isAdmin}
                                                    className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isAdmin ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
                                                        }`}
                                                />
                                            </div>
                                        </div>
                                        {error && <p className="text-red-500 text-sm">{error}</p>}
                                        {successMessage && <p className="text-green-500 text-sm">{successMessage}</p>}
                                        <div className="flex justify-end space-x-3 mt-6">
                                            <button
                                                onClick={() => setIsEditOpen(false)}
                                                className="px-4 py-2 border rounded-md hover:bg-gray-100 text-gray-700"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            <Transition appear show={isPhoneChangeAlertOpen} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-20"
                    onClose={() => setIsPhoneChangeAlertOpen(false)}
                    initialFocus={cancelButtonRef}
                >
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/40" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
                                    <Dialog.Title className="text-lg font-semibold mb-4">Phone Number Change Detected</Dialog.Title>
                                    <div className="space-y-4">
                                        <p className="text-gray-600">
                                            You have changed the phone number from {user?.phone} to {newPhoneNumber}. Do you want to proceed with the phone number change?
                                        </p>
                                        {error && <p className="text-red-500 text-sm">{error}</p>}
                                        <div className="flex justify-end space-x-3">
                                            <button
                                                ref={cancelButtonRef}
                                                onClick={() => setIsPhoneChangeAlertOpen(false)}
                                                className="px-4 py-2 border rounded-md hover:bg-gray-100 text-gray-700"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handlePhoneChangeAlertConfirm}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                            >
                                                Confirm
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default UserDetails;