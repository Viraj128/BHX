import React, { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, doc, getDoc, setDoc, query, where, getDocs } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";

const initialState = {
  name: "",
  phone: "",
  email: "",
  dob: "",
  customerID: "",
  employeeID: "",
  address: "",
  member_since: "",
  role: "customer",
  bank_details: {
    account_number: "",
    bank_name: "",
    branch_name: "",
  },
  document_number: "",
  shareCode: "",
  countryCode: "+91",
};

const AddUser = () => {
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const showError = (message) => {
    setError(message);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (formData.role === "customer") {
      setFormData((prev) => ({ ...prev, employeeID: "" }));
    } else {
      setFormData((prev) => ({ ...prev, customerID: "" }));
    }
  }, [formData.role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "shareCode") {
      // Remove non-digits and limit to 6 digits
      let digits = value.replace(/[^\d]/g, "").slice(0, 6);
      // Format as __/__/__ (e.g., 123456 -> 12/34/56)
      let formatted = "";
      if (digits.length > 0) formatted = digits.slice(0, 2);
      if (digits.length > 2) formatted += "/" + digits.slice(2, 4);
      if (digits.length > 4) formatted += "/" + digits.slice(4, 6);
      setFormData((prev) => ({
        ...prev,
        shareCode: formatted,
      }));
    } else if (name.startsWith("bank_")) {
      const field = name.replace("bank_", "");
      setFormData((prev) => ({
        ...prev,
        bank_details: { ...prev.bank_details, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    if (!formData.name) return showError("Full Name is required."), false;
    if (!/^[A-Za-z\s]+$/.test(formData.name))
      return showError("Full Name should only contain alphabets and spaces."), false;
    if (!formData.phone || !/^\d{10}$/.test(formData.phone))
      return showError("Phone number must be exactly 10 digits."), false;

    if (formData.email && !/^[^\s@]+@(gmail\.com|yahoo\.com|outlook\.com)$/.test(formData.email)) {
      showError("Please enter a valid email.");
      return false;
    }
    if (!formData.dob) return showError("Date of Birth is required."), false;
    const birthYear = new Date(formData.dob).getFullYear();
    if (birthYear > 2001) return showError("Date of Birth should be 2001 or earlier."), false;
    if (!/^[A-Za-z\s]+$/.test(formData.bank_details.bank_name))
      return showError("Bank name should only contain alphabets."), false;
    if (!/^\d{8}$/.test(formData.bank_details.account_number))
      return showError("Bank account number must be exactly 8 digits."), false;
    if (!/^\d{5}$/.test(formData.document_number))
      return showError("Document number must be exactly 5 digits."), false;
    // Updated validation: shareCode must be exactly 6 digits (ignoring slashes)
    const shareCodeDigits = formData.shareCode.replace(/[^\d]/g, "");
    if (formData.shareCode && !/^\d{6}$/.test(shareCodeDigits))
      return showError("Share code must be exactly 6 digits."), false;

    if (formData.role === "customer") {
      if (!formData.customerID || !/^[0-9]{9}$/.test(formData.customerID))
        return showError("Customer ID must be 9 digits."), false;
    } else {
      if (!formData.employeeID || !/^[0-9]{5}$/.test(formData.employeeID))
        return showError("Employee ID must be 5 digits."), false;
    }

    return true;
  };

  const generateCustomerID = () => Math.floor(100000000 + Math.random() * 900000000).toString();
  const generateEmployeeID = () => Math.floor(10000 + Math.random() * 90000).toString();

  const generateUniqueUserId = async () => {
    let isUnique = false;
    let userId;
    while (!isUnique) {
      userId = Math.floor(100000000 + Math.random() * 900000000).toString();
      const usersQuery = query(collection(db, "users_01"), where("userId", "==", userId));
      const customersQuery = query(collection(db, "customers"), where("userId", "==", userId));

      try {
        const [usersSnapshot, customersSnapshot] = await Promise.all([
          getDocs(usersQuery),
          getDocs(customersQuery),
        ]);
        if (usersSnapshot.empty && customersSnapshot.empty) {
          isUnique = true;
        }
      } catch (err) {
        console.error("Error checking unique user ID:", err);
        throw new Error("Failed to verify unique user ID. Please try again.");
      }
    }
    return userId;
  };

  const checkForDuplicates = async (docId) => {
    try {
      const usersDoc = await getDoc(doc(db, "users_01", docId));
      const customersDoc = await getDoc(doc(db, "customers", docId));
      if (usersDoc.exists() || customersDoc.exists()) {
        showError("A user with this phone number already exists.");
        return true;
      }

      if (formData.email) {
        const emailQuery = query(collection(db, "users_01"), where("email", "==", formData.email));
        const emailSnapshot = await getDocs(emailQuery);
        if (!emailSnapshot.empty) {
          showError("A user with this email already exists.");
          return true;
        }
      }

      if (formData.role === "customer") {
        const customerIDQuery = query(
          collection(db, "customers"),
          where("customerID", "==", formData.customerID)
        );
        const customerIDInUsersQuery = query(
          collection(db, "users_01"),
          where("customerID", "==", formData.customerID)
        );
        const [customerIDSnapshot, customerIDUsersSnapshot] = await Promise.all([
          getDocs(customerIDQuery),
          getDocs(customerIDInUsersQuery),
        ]);
        if (!customerIDSnapshot.empty || !customerIDUsersSnapshot.empty) {
          showError("Customer ID already exists.");
          return true;
        }
      } else {
        const employeeIDQuery = query(
          collection(db, "users_01"),
          where("employeeID", "==", formData.employeeID)
        );
        const employeeIDInCustomersQuery = query(
          collection(db, "customers"),
          where("employeeID", "==", formData.employeeID)
        );
        const [employeeIDSnapshot, employeeIDCustomersSnapshot] = await Promise.all([
          getDocs(employeeIDQuery),
          getDocs(employeeIDInCustomersQuery),
        ]);
        if (!employeeIDSnapshot.empty || !employeeIDCustomersSnapshot.empty) {
          showError("Employee ID already exists.");
          return true;
        }
      }

      return false;
    } catch (err) {
      console.error("Error checking for duplicates:", err);
      showError("Error checking for existing users. Please try again.");
      return true;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    showError("");

    if (!validateForm()) return;
    const docId = formData.phone;

    if (await checkForDuplicates(docId)) return;

    try {
      const auth = getAuth();

      //step 1:Create user in firebase Auth
      const userCredentials = await createUserWithEmailAndPassword(auth, formData.email, formData.phone); // using phone as password for simplicity

      // step 2:send verfication email
      await sendEmailVerification(userCredentials.user);

      const userId = await generateUniqueUserId();

      const userData = {
        name: formData.name,
        phone: docId,
        email: formData.email,
        dob: formData.dob,
        address: formData.address,
        member_since: new Date().toISOString(),
        created_at: Timestamp.now(),
        role: formData.role,
        type: formData.role !== "customer" && { type: "employee" },
        bank_details: formData.bank_details,
        document_number: formData.document_number,
        shareCode: formData.shareCode,
        countryCode: formData.countryCode,
        userId: userId,
        ...(formData.role === "customer"
          ? { customerID: formData.customerID }
          : { employeeID: formData.employeeID }
        ),
        ...(formData.role !== "customer" && { active: true }),
        emailVerified: false, // Track verification status
      };

      if (formData.role === "customer") {
        await setDoc(doc(db, "customers", docId), userData);
      } else {
        await setDoc(doc(db, "users_01", docId), userData);
      }

      alert("User added successfully!.Verification email sent!");
      setFormData(initialState);

      navigate("/users");
    } catch (err) {
      console.error("Error adding user:", err);

      if (err.code === "auth/email-already-in-use") {
        showError("This email is already in use. Please use a different email");
      } else {
        showError("Error adding user. Please try again.");
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <button
        className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors mb-6"
        onClick={() => navigate("/users")}
      >
        Back to Users
      </button>

      <h2 className="text-3xl font-bold text-gray-800 mb-6">Add User</h2>
      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <div className="flex">
              <select
                name="countryCode"
                value={formData.countryCode}
                onChange={handleChange}
                className="w-1/4 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="+44">+44 (UK)</option>
                <option value="+91">+91 (India)</option>
              </select>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number"
                required
                className="w-3/4 px-4 py-2 border-t border-b border-r border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.role === "customer" ? "Customer ID" : "Employee ID"}
            </label>
            <div className="flex">
              <input
                name={formData.role === "customer" ? "customerID" : "employeeID"}
                value={formData.role === "customer" ? formData.customerID : formData.employeeID}
                onChange={handleChange}
                placeholder={formData.role === "customer" ? "Customer ID" : "Employee ID"}
                required
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() =>
                  formData.role === "customer"
                    ? setFormData((prev) => ({ ...prev, customerID: generateCustomerID() }))
                    : setFormData((prev) => ({ ...prev, employeeID: generateEmployeeID() }))
                }
                className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition-colors"
              >
                Auto-Generate
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Address"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select 
              name="role" 
              value={formData.role} 
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="teamleader">Team Leader</option>
              <option value="teammember">Team Member</option>
              <option value="customer">Customer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Number</label>
            <input
              name="bank_account_number"
              value={formData.bank_details.account_number}
              onChange={handleChange}
              placeholder="Account Number"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
            <input
              name="bank_bank_name"
              value={formData.bank_details.bank_name}
              onChange={handleChange}
              placeholder="Bank Name"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
            <input
              name="bank_branch_name"
              value={formData.bank_details.branch_name}
              onChange={handleChange}
              placeholder="Branch Name"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Number</label>
            <input
              name="document_number"
              value={formData.document_number}
              onChange={handleChange}
              placeholder="Document Number"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Share Code</label>
            <input
              name="shareCode"
              value={formData.shareCode}
              onChange={handleChange}
              placeholder="12/34/56"
              pattern="\d{2}/\d{2}/\d{2}"
              title="Share code must be 6 digits in the format 12/34/56"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-8">
          <button 
            type="submit"
            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add User
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddUser;