import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getBranches } from '../api/branch';
import Layout from '../components/layout/Layout';
import type { Branch } from '../types/branch';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [recentBranches, setRecentBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentBranches();
  }, []);

  const loadRecentBranches = async () => {
    try {
      const response = await getBranches({ page: 1, limit: 4 });
      setRecentBranches(response.branches);
    } catch (err) {
      console.error('Failed to load branches:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Welcome Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('dashboard.welcome')}, {user?.fullName?.split(' ')[0]}! 👋
            </h2>
            <p className="text-gray-600">
              Pustikorijen - {t('dashboard.tagline')}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.quickActions')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/branches"
                className="flex items-start p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:shadow-md transition"
              >
                <div className="flex-shrink-0 text-3xl mr-4">🌳</div>
                <div>
                  <h4 className="text-sm font-semibold text-blue-900">{t('dashboard.browseBranches')}</h4>
                  <p className="text-xs text-blue-700 mt-1">{t('dashboard.findYourFamily')}</p>
                </div>
              </Link>

              <Link
                to="/branches/create"
                className="flex items-start p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 hover:shadow-md transition"
              >
                <div className="flex-shrink-0 text-3xl mr-4">➕</div>
                <div>
                  <h4 className="text-sm font-semibold text-green-900">{t('branches.create')}</h4>
                  <p className="text-xs text-green-700 mt-1">{t('dashboard.startYourTree')}</p>
                </div>
              </Link>

              <div className="flex items-start p-4 bg-purple-50 border border-purple-200 rounded-lg opacity-60 cursor-not-allowed">
                <div className="flex-shrink-0 text-3xl mr-4">📖</div>
                <div>
                  <h4 className="text-sm font-semibold text-purple-900">{t('branches.stories')}</h4>
                  <p className="text-xs text-purple-700 mt-1">{t('dashboard.comingSoon')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Overview */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.yourProfile')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-lg p-4">
                <dt className="text-xs font-medium text-indigo-700 uppercase tracking-wide">{t('auth.email')}</dt>
                <dd className="text-sm text-gray-900 mt-1 font-medium">{user?.email}</dd>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-lg p-4">
                <dt className="text-xs font-medium text-indigo-700 uppercase tracking-wide">{t('dashboard.language')}</dt>
                <dd className="text-sm text-gray-900 mt-1 font-medium">
                  {user?.preferredLanguage === 'bs' ? 'Bosanski' : user?.preferredLanguage === 'de' ? 'Deutsch' : 'English'}
                </dd>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-lg p-4">
                <dt className="text-xs font-medium text-indigo-700 uppercase tracking-wide">{t('dashboard.location')}</dt>
                <dd className="text-sm text-gray-900 mt-1 font-medium">
                  {user?.currentLocation || t('dashboard.notSpecified')}
                </dd>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-lg p-4">
                <dt className="text-xs font-medium text-indigo-700 uppercase tracking-wide">{t('dashboard.emailStatus')}</dt>
                <dd className="text-sm mt-1 font-medium flex items-center">
                  {user?.emailVerified ? (
                    <span className="text-green-700 flex items-center">
                      <span className="mr-1">✓</span> {t('dashboard.verified')}
                    </span>
                  ) : (
                    <span className="text-orange-700 flex items-center">
                      <span className="mr-1">⚠</span> {t('dashboard.notVerified')}
                    </span>
                  )}
                </dd>
              </div>
            </div>
          </div>

          {/* Recent Branches */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.recentBranches')}</h3>
              <Link to="/branches" className="text-sm text-indigo-600 hover:text-indigo-800">
                {t('dashboard.viewAll')} →
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : recentBranches.length === 0 ? (
              <p className="text-gray-600 text-center py-8">{t('dashboard.noBranches')}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentBranches.map((branch) => (
                  <Link
                    key={branch.id}
                    to={`/branches/${branch.id}`}
                    className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{branch.surname}</h4>
                        <p className="text-sm text-gray-600">
                          {branch.cityName}, {branch.region || branch.country}
                        </p>
                      </div>
                      {branch.isVerified && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 text-xs text-gray-600 mt-3 pt-3 border-t">
                      <span><strong>{branch._count?.members || 0}</strong> {t('branches.members').toLowerCase()}</span>
                      <span><strong>{branch.totalPeople}</strong> {t('branches.totalPeople').toLowerCase()}</span>
                      <span><strong>{branch.totalGenerations}</strong> {t('dashboard.gen')}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
