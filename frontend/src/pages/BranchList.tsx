import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBranches } from '../api/branch';
import type { Branch } from '../types/branch';
import { formatBranchLocation } from '../utils/location';

export default function BranchList() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadBranches();
  }, [page, search]);

  const loadBranches = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await getBranches({ page, limit: 12, search: search || undefined });
      setBranches(result.branches);
      setTotalPages(result.pagination.totalPages);
    } catch (err: any) {
      setError('Failed to load branches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadBranches();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Family Branches</h1>
              <p className="mt-1 text-sm text-gray-600">
                Discover and join family branches from across Bosnia and Herzegovina
              </p>
            </div>
            <Link
              to="/branches/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Branch
            </Link>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by surname, city, or region..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Search
              </button>
            </div>
          </form>

          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading branches...</p>
            </div>
          ) : branches.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-600">No branches found. Be the first to create one!</p>
              <Link
                to="/branches/create"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Create Branch
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {branches.map((branch) => (
                  <Link
                    key={branch.id}
                    to={`/branches/${branch.id}`}
                    className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow"
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">{branch.surname}</h3>
                        {branch.isVerified && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{formatBranchLocation(branch)}</p>
                      <p className="mt-2 text-xs text-gray-400">Branch ID: {branch.id}</p>
                      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <div>
                            <span className="font-medium text-gray-900">{branch._count?.members || 0}</span>
                            <span className="ml-1">members</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">{branch._count?.persons || 0}</span>
                            <span className="ml-1">people</span>
                          </div>
                        </div>
                      </div>
                      {branch.description && (
                        <p className="mt-3 text-sm text-gray-600 line-clamp-2">{branch.description}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center space-x-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
