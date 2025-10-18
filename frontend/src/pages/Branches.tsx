import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBranches } from '../api/branch';
import Layout from '../components/layout/Layout';
import type { Branch } from '../types/branch';

export default function Branches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
      setError(err.response?.data?.error || 'Failed to load branches');
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
          <h1 className="text-3xl font-bold text-gray-900">Family Branches</h1>
          <Link
            to="/branches/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Create Branch
          </Link>
        </div>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by surname, city, or region..."
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Search
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
            <p className="text-gray-600">No branches found. Be the first to create one!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {branches.map((branch) => (
                <Link
                  key={branch.id}
                  to={`/branches/${branch.id}`}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{branch.surname}</h3>
                      <p className="text-sm text-gray-600">
                        {branch.cityName}, {branch.region || branch.country}
                      </p>
                    </div>
                    {branch.isVerified && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-gray-700 mb-4">
                    <p className="font-mono text-xs text-gray-500 mb-2">{branch.id}</p>
                    {branch.description && (
                      <p className="line-clamp-2">{branch.description}</p>
                    )}
                  </div>

                  <div className="flex gap-4 text-sm text-gray-600 border-t pt-4">
                    <div>
                      <span className="font-semibold">{branch._count?.members || 0}</span> members
                    </div>
                    <div>
                      <span className="font-semibold">{branch.totalPeople}</span> people
                    </div>
                    <div>
                      <span className="font-semibold">{branch.totalGenerations}</span> generations
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white rounded-md shadow disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 bg-white rounded-md shadow">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white rounded-md shadow disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
