import { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../auth/AuthContext';
import { ROLES, PATHS } from '../config/roles';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiX, FiSend } from 'react-icons/fi';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    customerCount: 0,
    roleCounts: {
      admin: 0,
      manager: 0,
      teamleader: 0,
      teammember: 0,
    },
  });
  const [alerts, setAlerts] = useState([]);
  const [showAlertPanel, setShowAlertPanel] = useState(false);
  const [newAlert, setNewAlert] = useState({
    message: '',
    recipient: 'all',
    urgent: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      // Fetch users data
      const usersSnapshot = await getDocs(collection(db, 'users_01'));
      const users = usersSnapshot.docs.map((doc) => doc.data());

      const counts = users.reduce((acc, user) => {
        const role = user.role?.toLowerCase() || '';
        return {
          ...acc,
          [role]: (acc[role] || 0) + 1,
        };
      }, {});

      // Fetch customers data
      const customersSnapshot = await getDocs(collection(db, 'customers'));
      const customerCount = customersSnapshot.docs.length;

      setStats({
        totalUsers: users.length + customerCount,
        customerCount,
        roleCounts: counts,
      });

      // Fetch alerts data
      await fetchAlerts();
    };

    fetchData();
  }, [user]);

  const fetchAlerts = async () => {
    const alertsSnapshot = await getDocs(collection(db, 'alerts'));
    const currentTime = new Date();
    const userAlerts = alertsSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter(
        (alert) =>
          (alert.recipient === 'all' ||
            alert.recipient === user.role ||
            alert.recipient === user.id) &&
          alert.expiration &&
          new Date(alert.expiration.toDate()) > currentTime
      );
    setAlerts(userAlerts);
  };

  const handleAddAlert = async () => {
    if (!newAlert.message) return;

    const timestamp = new Date();
    const expiration = new Date(timestamp.getTime() + 24 * 60 * 60 * 1000);

    await addDoc(collection(db, 'alerts'), {
      ...newAlert,
      sender: user.id,
      senderName: user.name,
      timestamp,
      expiration,
      read: false,
    });

    setNewAlert({ message: '', recipient: 'all', urgent: false });
    await fetchAlerts();
  };

  const handleDeleteAlert = async (alertId) => {
    await deleteDoc(doc(db, 'alerts', alertId));
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  const handleNavigateWithRole = (role) => {
    navigate(PATHS.USERS, { state: { filterRole: role } });
  };

  const handleNavigateToUsers = () => {
    navigate(PATHS.USERS);
  };

  const unreadAlertsCount = alerts.filter(alert => !alert.read).length;

  return (
    <div className="flex flex-col p-4 md:p-8 relative min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Combined Stats and Alerts Section */}
      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        {/* Stats Section - Left Side */}
        {user?.role !== ROLES.TEAMMEMBER && (
          <div className="lg:w-1/2">
            <h2 className="text-xl font-semibold mb-4">Counts</h2>
            
            {/* Admin View - Horizontal Layout */}
            {user?.role === ROLES.ADMIN && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <ClickableDashboardCard 
                    title="Total Users" 
                    value={stats.totalUsers} 
                    color="bg-blue-100"
                    onClick={handleNavigateToUsers}
                  />
                  <ClickableDashboardCard 
                    title="Admins" 
                    value={stats.roleCounts.admin || 0} 
                    color="bg-red-100"
                    onClick={() => handleNavigateWithRole('admin')}
                  />
                  <ClickableDashboardCard 
                    title="Managers" 
                    value={stats.roleCounts.manager || 0} 
                    color="bg-green-100"
                    onClick={() => handleNavigateWithRole('manager')}
                  />
                </div>
                <div className="space-y-4">
                  <ClickableDashboardCard 
                    title="Team Leaders" 
                    value={stats.roleCounts.teamleader || 0} 
                    color="bg-yellow-100"
                    onClick={() => handleNavigateWithRole('teamleader')}
                  />
                  <ClickableDashboardCard 
                    title="Team Members" 
                    value={stats.roleCounts.teammember || 0} 
                    color="bg-purple-100"
                    onClick={() => handleNavigateWithRole('teammember')}
                  />
                  <ClickableDashboardCard 
                    title="Customers" 
                    value={stats.customerCount} 
                    color="bg-indigo-100"
                    onClick={() => handleNavigateWithRole('customer')}
                  />
                </div>
              </div>
            )}

            {/* Manager View */}
            {user?.role === ROLES.MANAGER && (
              <div className="grid grid-cols-3 gap-4">
                <ClickableDashboardCard 
                  title="Total Team" 
                  value={(stats.roleCounts.teamleader || 0) + (stats.roleCounts.teammember || 0)} 
                  color="bg-blue-100"
                  onClick={handleNavigateToUsers}
                />
                <ClickableDashboardCard 
                  title="Team Leaders" 
                  value={stats.roleCounts.teamleader || 0} 
                  color="bg-green-100"
                  onClick={() => handleNavigateWithRole('teamleader')}
                />
                <ClickableDashboardCard 
                  title="Team Members" 
                  value={stats.roleCounts.teammember || 0} 
                  color="bg-purple-100"
                  onClick={() => handleNavigateWithRole('teammember')}
                />
              </div>
            )}

            {/* Team Leader View */}
            {user?.role === ROLES.TEAMLEADER && (
              <ClickableDashboardCard 
                title="Team Members" 
                value={stats.roleCounts.teammember || 0} 
                color="bg-blue-100"
                onClick={() => handleNavigateWithRole('teammember')}
              />
            )}
          </div>
        )}

        {/* Alerts Section - Right Side */}
        <div className={`${user?.role === ROLES.TEAMMEMBER ? 'w-full' : 'lg:w-1/2'}`}>
          <h2 className="text-xl font-semibold mb-4">Recent Updates</h2>
          <div className="space-y-3 mb-4">
            {alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg ${
                  alert.urgent ? 'bg-red-100 border-l-4 border-red-500' : 'bg-blue-50 border-l-4 border-blue-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <p className="font-medium">{alert.message}</p>
                  {user?.role === ROLES.ADMIN && (
                    <button 
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="text-gray-500 hover:text-red-500 ml-2"
                    >
                      <FiX />
                    </button>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {alert.senderName} • {new Date(alert.timestamp?.toDate()).toLocaleString()}
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="p-4 rounded-lg bg-gray-50 text-center text-gray-500">
                No recent updates
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Alert Button (Admin Only) */}
      {user?.role === ROLES.ADMIN && (
        <div className="fixed bottom-6 right-6 z-10">
          <button
            onClick={() => setShowAlertPanel(!showAlertPanel)}
            className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors relative"
          >
            <FiBell size={24} />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Alert Panel */}
          {showAlertPanel && (
            <div className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-blue-600 text-white p-3 flex justify-between items-center">
                <h3 className="font-semibold">Send Alert</h3>
                <button 
                  onClick={() => setShowAlertPanel(false)}
                  className="text-white hover:text-gray-200"
                >
                  <FiX size={20} />
                </button>
              </div>
              
              <div className="p-4">
                <textarea
                  className="w-full p-2 border rounded mb-3"
                  placeholder="Enter alert message"
                  value={newAlert.message}
                  onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                  rows={3}
                />
                <div className="flex flex-wrap gap-3 mb-3">
                  <select
                    className="p-2 border rounded flex-1 min-w-0"
                    value={newAlert.recipient}
                    onChange={(e) => setNewAlert({ ...newAlert, recipient: e.target.value })}
                  >
                    <option value="all">All (Non-Admins)</option>
                    <option value="manager">Managers</option>
                    <option value="teamleader">Team Leaders</option>
                    <option value="teammember">Team Members</option>
                  </select>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newAlert.urgent}
                      onChange={(e) => setNewAlert({ ...newAlert, urgent: e.target.checked })}
                    />
                    Urgent
                  </label>
                </div>
                <button
                  onClick={handleAddAlert}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full flex items-center justify-center gap-2"
                >
                  <FiSend /> Send Alert
                </button>
              </div>

              {/* Recent Alerts in Panel */}
              <div className="border-t border-gray-200 max-h-60 overflow-y-auto">
                <div className="p-3 bg-gray-50 font-medium text-sm">Recent Alerts</div>
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 border-b border-gray-100 ${
                        alert.urgent ? 'bg-red-50' : 'bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-sm">{alert.message}</p>
                        <button 
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="text-gray-400 hover:text-red-500 ml-2"
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex justify-between">
                        <span>To: {alert.recipient}</span>
                        <span>{new Date(alert.timestamp?.toDate()).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-sm text-gray-500">No alerts sent yet</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ClickableDashboardCard = ({ title, value, color, onClick }) => (
  <button 
    onClick={onClick}
    className={`${color} p-6 rounded-lg shadow-sm w-full text-left hover:shadow-md transition-shadow focus:outline-none`}
  >
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-3xl font-bold">{value || 0}</p>
  </button>
);

export default Dashboard;