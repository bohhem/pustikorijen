import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { getBranches } from '../../api/branch';
import { formatBranchLocation } from '../../utils/location';
import type { Branch } from '../../types/branch';

interface BranchMembershipInfo extends Branch {
  userRole?: string;
  joinedAt?: string;
}

export default function MyBranchesTab() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [branches, setBranches] = useState<BranchMembershipInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadBranches = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all branches - in future, add API endpoint for user's branches only
        const data = await getBranches({ page: 1, limit: 100 });

        // Filter branches where user is founder or member
        // For now, we can only check founder - in future, check members array
        const userBranches = data.branches.filter(
          (branch) => branch.foundedBy?.id === user.id
        );

        setBranches(userBranches);
      } catch (err: any) {
        console.error('Failed to load branches:', err);
        setError(err.response?.data?.error || t('profile.branches.loadError'));
      } finally {
        setLoading(false);
      }
    };

    loadBranches();
  }, [user, t]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">{t('profile.branches.noBranches')}</h3>
        <p className="mt-1 text-sm text-gray-500">{t('profile.branches.noBranchesDesc')}</p>
        <div className="mt-6">
          <Link
            to="/branches/create"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {t('profile.branches.createBranch')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t('profile.branches.title')}</h3>
          <p className="mt-1 text-sm text-gray-600">
            {t('profile.branches.count', { count: branches.length })}
          </p>
        </div>
        <Link
          to="/branches/create"
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
        >
          {t('profile.branches.createNew')}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {branches.map((branch) => (
          <Link
            key={branch.id}
            to={`/branches/${branch.id}`}
            className="block bg-white border border-gray-200 rounded-lg p-5 hover:border-indigo-300 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="text-lg font-semibold text-gray-900">{branch.surname}</h4>
                  {branch.foundedBy?.id === user?.id && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {t('profile.branches.founder')}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600">{formatBranchLocation(branch)}</p>
                {branch.description && (
                  <p className="mt-2 text-sm text-gray-700 line-clamp-2">{branch.description}</p>
                )}
              </div>
              <div className="ml-4 text-right">
                <p className="text-xs text-gray-500">{t('profile.branches.branchId')}</p>
                <p className="text-xs font-mono text-gray-700">{branch.id}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span>{branch._count?.members || 0} {t('profile.branches.members')}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span>{branch._count?.persons || 0} {t('profile.branches.people')}</span>
              </div>
              {branch.createdAt && (
                <div className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    {t('profile.branches.created')}{' '}
                    {new Date(branch.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
