import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import UserMenu from './UserMenu';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isSuperGuru = user && (user.globalRole === 'SUPER_GURU' || user.globalRole === 'ADMIN');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <span className="text-xl sm:text-2xl">🌳</span>
              <h1 className="text-base sm:text-xl font-bold text-gray-900 hidden xs:block">Pustikorijen</h1>
            </Link>

            {/* Main navigation - hidden on mobile */}
            {user && (
              <div className="hidden md:flex items-center gap-4">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/') && !isActive('/branches')
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {t('navigation.dashboard')}
                </Link>
                <Link
                  to="/branches"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/branches')
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {t('navigation.branches')}
                </Link>
                {isSuperGuru && (
                  <Link
                    to="/admin"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/admin')
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {t('navigation.admin')}
                  </Link>
                )}
              </div>
            )}

            {/* User menu and Language Switcher */}
            <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
              <LanguageSwitcher />
              {user && <UserMenu onLogout={handleLogout} />}
            </div>
          </div>
        </div>

        {/* Mobile navigation */}
        {user && (
          <div className="md:hidden border-t border-gray-200 bg-gray-50">
            <div className="px-2 py-2 flex gap-2 overflow-x-auto">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive('/') && !isActive('/branches')
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 bg-white hover:bg-gray-100'
                }`}
              >
                {t('navigation.dashboard')}
              </Link>
              <Link
                to="/branches"
                className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive('/branches')
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 bg-white hover:bg-gray-100'
                }`}
              >
                {t('navigation.branches')}
              </Link>
              {isSuperGuru && (
                <Link
                  to="/admin"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive('/admin')
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-700 bg-white hover:bg-gray-100'
                  }`}
                >
                  {t('navigation.admin')}
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Pustikorijen - Connecting Bosnian families across generations and borders
          </p>
        </div>
      </footer>
    </div>
  );
}
