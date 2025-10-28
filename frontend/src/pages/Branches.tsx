import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getBranches } from '../api/branch';
import Layout from '../components/layout/Layout';
import type { Branch } from '../types/branch';
import { formatBranchLocation } from '../utils/location';
import { formatDistanceToNow } from 'date-fns';
import { enUS, de, bs } from 'date-fns/locale';

export default function Branches() {
  const { t, i18n } = useTranslation();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'de':
        return de;
      case 'bs':
        return bs;
      default:
        return enUS;
    }
  };

  const formatLastActive = (lastLogin: string | null | undefined) => {
    if (!lastLogin) {
      return t('branches.neverLoggedIn');
    }
    return formatDistanceToNow(new Date(lastLogin), {
      addSuffix: true,
      locale: getDateLocale(),
    });
  };

  useEffect(() => {
    loadBranches();
  }, [page, search]);

  const loadBranches = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getBranches({ page, search: search || undefined });
      setBranches(response.branches);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.error || t('branches.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadBranches();
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('branches.title')}</h1>
          <Link
            to="/branches/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {t('branches.create')}
          </Link>
        </div>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('branches.searchPlaceholder')}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              {t('common.search')}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : branches.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">{t('branches.noBranches')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {branches.map((branch) => (
                <Link
                  key={branch.id}
                  to={`/branches/${branch.id}`}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4 sm:p-6 flex flex-col"
                >
                  <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{branch.surname}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{formatBranchLocation(branch)}</p>
                    </div>
                    {branch.isVerified && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 flex-shrink-0">
                        {t('dashboard.verified')}
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-gray-700 mb-3 sm:mb-4 flex-grow">
                    <p className="font-mono text-xs text-gray-500 mb-2 truncate">{branch.id}</p>
                    {branch.description && (
                      <p className="line-clamp-2 text-xs sm:text-sm">{branch.description}</p>
                    )}
                  </div>

                  {branch.foundedBy && (
                    <div className="text-xs text-gray-600 mb-3 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-1 mb-1 min-w-0">
                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium flex-shrink-0">{t('branches.foundedBy')}:</span>
                        <span className="truncate">{branch.foundedBy.fullName}</span>
                      </div>
                      <div className="flex items-center gap-1 min-w-0">
                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium flex-shrink-0">{t('branches.lastActive')}:</span>
                        <span className="truncate">{formatLastActive(branch.foundedBy.lastLogin)}</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 border-t pt-3 sm:pt-4">
                    <div className="text-center">
                      <div className="font-semibold text-sm sm:text-base">{branch._count?.members || 0}</div>
                      <div className="text-xs sm:text-sm truncate">{t('branches.members').toLowerCase()}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-sm sm:text-base">{branch.totalPeople}</div>
                      <div className="text-xs sm:text-sm truncate">{t('branches.totalPeople').toLowerCase()}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-sm sm:text-base">{branch.totalGenerations}</div>
                      <div className="text-xs sm:text-sm truncate">{t('branches.totalGenerations').toLowerCase()}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 sm:px-4 py-2 bg-white rounded-md shadow disabled:opacity-50 text-sm sm:text-base touch-manipulation"
                >
                  {t('pagination.previous')}
                </button>
                <span className="px-3 sm:px-4 py-2 bg-white rounded-md shadow text-sm sm:text-base">
                  {t('pagination.page')} {page} {t('pagination.of')} {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 sm:px-4 py-2 bg-white rounded-md shadow disabled:opacity-50 text-sm sm:text-base touch-manipulation"
                >
                  {t('pagination.next')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
