import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { GlobalRole } from '../../types/auth';

type UserRole = GlobalRole;

interface SuperGuruRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

const DEFAULT_ALLOWED_ROLES: UserRole[] = ['SUPER_GURU', 'ADMIN', 'REGIONAL_GURU'];

export default function SuperGuruRoute({ children, allowedRoles = DEFAULT_ALLOWED_ROLES }: SuperGuruRouteProps) {
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

  if (!allowedRoles.includes(user.globalRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
