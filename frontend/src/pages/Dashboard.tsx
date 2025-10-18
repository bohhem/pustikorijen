import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Pustikorijen</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/branches"
                className="text-sm text-gray-700 hover:text-gray-900"
              >
                Branches
              </Link>
              <span className="text-sm text-gray-700">
                {user?.fullName}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to Pustikorijen!
            </h2>
            <p className="text-gray-600 mb-6">
              Connecting Bosnian families across generations and borders.
            </p>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-indigo-900 mb-2">
                Your Profile
              </h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-indigo-700">Name:</dt>
                  <dd className="text-sm text-gray-900">{user?.fullName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-indigo-700">Email:</dt>
                  <dd className="text-sm text-gray-900">{user?.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-indigo-700">Language:</dt>
                  <dd className="text-sm text-gray-900">
                    {user?.preferredLanguage === 'bs' ? 'Bosnian' : 'English'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-indigo-700">Email Verified:</dt>
                  <dd className="text-sm text-gray-900">
                    {user?.emailVerified ? 'Yes' : 'No'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  to="/branches"
                  className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
                >
                  <div className="flex-shrink-0">
                    <span className="text-3xl">🌳</span>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-blue-900">Browse Family Branches</h4>
                    <p className="text-sm text-blue-700">Discover and join family branches</p>
                  </div>
                </Link>

                <Link
                  to="/branches/create"
                  className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition"
                >
                  <div className="flex-shrink-0">
                    <span className="text-3xl">➕</span>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-green-900">Create Family Branch</h4>
                    <p className="text-sm text-green-700">Start your family tree</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
