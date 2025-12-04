import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Loading';

export default function RoleGuard({ children, allowedRoles = [] }) {
  const { profile, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(profile?.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#121212]">
        <div className="bg-white dark:bg-neutral-900 p-8 rounded-xl shadow-soft max-w-md w-full text-center border border-gray-200 dark:border-neutral-800">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Required role: {allowedRoles.join(', ')}
          </p>
        </div>
      </div>
    );
  }

  return children;
}
