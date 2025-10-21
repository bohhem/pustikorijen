import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface SuperGuruRouteProps {
  children: ReactNode;
}

export default function SuperGuruRoute({ children }: SuperGuruRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const allowedRoles: Array<UserRole> = ['SUPER_GURU', 'ADMIN'];

  if (!allowedRoles.includes(user.globalRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

type UserRole = 'USER' | 'SUPER_GURU' | 'ADMIN';
