import { useAuth } from '../auth/AuthContext';
import { ROLES } from '../config/roles';

const Dashboard = () => {
  const { user } = useAuth();

  const roleHeadings = {
    [ROLES.ADMIN]: 'I am Admin',
    [ROLES.MANAGER]: 'I am Manager',
    [ROLES.TEAMLEADER]: 'I am Team Leader',
    [ROLES.TEAMMEMBER]: 'I am Team Member',
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <h1 className="text-3xl font-bold">
        {roleHeadings[user?.role] || 'Welcome'}
      </h1>
    </div>
  );
};

export default Dashboard;
