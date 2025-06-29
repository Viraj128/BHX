import { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FiChevronDown, FiChevronUp, FiSearch, FiCalendar, FiUser } from 'react-icons/fi';

export default function HACCPFormViewerShop() {
  const [forms, setForms] = useState([]);
  const [groupedForms, setGroupedForms] = useState({});
  const [searchId, setSearchId] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [expandedImages, setExpandedImages] = useState({});
  const [expandedDates, setExpandedDates] = useState({});
  const [employeeDetails, setEmployeeDetails] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForms = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "haccpForms"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        const formsData = [];
        const employeeIds = new Set();
        
        // First pass: collect all employee IDs and process forms
        querySnapshot.forEach(doc => {
          const formData = doc.data();
          let timestamp;
          try {
            if (formData.timestamp?.toDate) {
              timestamp = formData.timestamp.toDate();
            } else if (typeof formData.timestamp === 'string') {
              timestamp = new Date(formData.timestamp);
              if (isNaN(timestamp.getTime())) {
                console.warn(`Invalid timestamp string for doc ${doc.id}: ${formData.timestamp}`);
                timestamp = new Date();
              }
            } else {
              console.warn(`Unexpected timestamp format for doc ${doc.id}:`, formData.timestamp);
              timestamp = new Date();
            }
          } catch (error) {
            console.error(`Error parsing timestamp for doc ${doc.id}:`, error);
            timestamp = new Date();
          }

          formsData.push({
            id: doc.id,
            ...formData,
            timestamp
          });
          if (formData.user) employeeIds.add(formData.user);
        });
        
   
        setForms(formsData);
        groupFormsByDate(formsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

  useEffect(() => {
    groupFormsByDate(forms);
  }, [searchId, filterDate, forms]);

  const groupFormsByDate = (formsData) => {
    const filtered = formsData.filter(form => {
      const userId = (form.user || "").toLowerCase();
      const userDetails = employeeDetails[form.user] || {};
      const userName = (userDetails.name || "").toLowerCase();
      const userEmployeeId = (userDetails.employeeID || "").toLowerCase();
      const entryDate = form.timestamp?.toISOString()?.slice(0, 10) || '';
      
      const idMatch = !searchId || 
        userId.includes(searchId.toLowerCase()) || 
        userName.includes(searchId.toLowerCase()) ||
        userEmployeeId.includes(searchId.toLowerCase());
      const dateMatch = !filterDate || entryDate === filterDate;
      
      return idMatch && dateMatch;
    });

    const grouped = filtered.reduce((acc, form) => {
      const date = form.date || form.timestamp?.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(form);
      return acc;
    }, {});

    setGroupedForms(grouped);
  };

  const toggleImage = (formId, questionKey) => {
    setExpandedImages(prev => ({
      ...prev,
      [`${formId}-${questionKey}`]: !prev[`${formId}-${questionKey}`]
    }));
  };

  const toggleDate = (date) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  const getTimeOfDay = (form) => {
    return form.day || (() => {
      if (!form.timestamp) return '';
      const hour = form.timestamp.getHours();
      if (hour >= 5 && hour < 12) return 'Morning';
      if (hour >= 12 && hour < 17) return 'Afternoon';
      if (hour >= 17 && hour < 21) return 'Evening';
      return 'Night';
    })();
  };

  const getTotalForms = () => {
    return Object.values(groupedForms).reduce((total, forms) => total + forms.length, 0);
  };

  const SkeletonLoader = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="w-full p-4 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="p-4 border-t border-gray-200 animate-pulse">
            <div className="space-y-4">
              {[...Array(8)].map((_, j) => (
                <div key={j} className="pt-2">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3 mt-2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-gray-800">HACCP Log Report</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-2/3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by ID, Name or Employee ID"
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="text-gray-400" />
                </div>
                <input
                  type="date"
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          {!loading && (
            <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg">
              Showing {getTotalForms()} reports across {Object.keys(groupedForms).length} days
            </div>
          )}
        </div>
        {loading && <SkeletonLoader />}
        {!loading && (
          <div className="space-y-4">
            {Object.entries(groupedForms).map(([date, dateForms]) => (
              <div key={date} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <button 
                  onClick={() => toggleDate(date)}
                  className="w-full flex justify-between items-center p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-800">{date}</span>
                    <span className="ml-3 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {dateForms.length} {dateForms.length === 1 ? 'report' : 'reports'}
                    </span>
                  </div>
                  {expandedDates[date] ? (
                    <FiChevronUp className="text-gray-500" />
                  ) : (
                    <FiChevronDown className="text-gray-500" />
                  )}
                </button>
                {expandedDates[date] && (
                  <div className="divide-y divide-gray-200">
                    {dateForms.map(form => {
                      const userDetails = employeeDetails[form.user] || {};
                      return (
                        <div key={form.id} className="p-4">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <FiUser className="text-gray-400" />
                                <div>
                                  <span className="text-sm text-gray-500">Employee: </span>
                                  <span className="font-semibold text-gray-800">
                                    {userDetails.name} (ID: {form.user})
                                  </span>
                                </div>
                              </div>
                             
                            </div>
                            <div className="text-right">
                              <span className="text-sm text-gray-500">Form No: </span>
                              <span className="font-semibold text-gray-800">{form.form}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-3 ml-6">
                            <span>{form.timestamp?.toLocaleTimeString()}</span>
                            <span>•</span>
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                              {getTimeOfDay(form)}
                            </span>
                          </div>
                          <div className="space-y-3">
                            {Object.entries(form.responses || {})
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([key, response]) => (
                              <div key={key} className="pt-2 pl-2 border-l-2 border-blue-200">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-medium text-gray-700">{response.question}</h4>
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                    {response.category}
                                  </span>
                                </div>
                                <div className="mt-1">
                                  <span className="font-semibold">Answer: </span>
                                  <span className={`font-bold ${response.answer === 'No' ? 'text-red-600' : 'text-green-600'}`}>
                                    {response.answer}
                                  </span>
                                </div>
                                {response.comment && (
                                  <p className="mt-1 text-gray-600 text-sm italic pl-3 border-l border-gray-200">
                                    {response.comment}
                                  </p>
                                )}
                                {response.image && (
                                  <div className="mt-2">
                                    <button
                                      onClick={() => toggleImage(form.id, key)}
                                      className="text-blue-600 text-sm flex items-center hover:underline"
                                    >
                                      {expandedImages[`${form.id}-${key}`] ? 'Hide Image' : 'View Image'}
                                    </button>
                                    {expandedImages[`${form.id}-${key}`] && (
                                      <div className="mt-2 p-2 bg-gray-50 rounded-lg inline-block">
                                        <img
                                          src={response.image}
                                          alt="Submission"
                                          className="max-w-full md:max-w-md border rounded-lg"
                                          loading="lazy"
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            {Object.keys(groupedForms).length === 0 && !loading && (
              <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-gray-200">
                <p className="text-gray-500">No reports found matching your criteria</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}