import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBranchById, getBranchMembers, requestJoinBranch } from '../api/branch';
import { useAuth } from '../contexts/AuthContext';
import type { Branch, BranchMember } from '../types/branch';

export default function BranchDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [members, setMembers] = useState<BranchMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      loadBranchData();
    }
  }, [id]);

  const loadBranchData = async () => {
    if (!id) return;

    setIsLoading(true);
    setError('');

    try {
      const [branchData, membersData] = await Promise.all([
        getBranchById(id),
        getBranchMembers(id),
      ]);
      setBranch(branchData);
      setMembers(membersData);
    } catch (err: any) {
      setError('Failed to load branch details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRequest = async () => {
    if (!id) return;

    setJoinLoading(true);
    setError('');

    try {
      await requestJoinBranch(id);
      setJoinSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit join request');
    } finally {
      setJoinLoading(false);
    }
  };

  const isMember = members.some((m) => m.userId === user?.id && m.status === 'active');
  const hasPendingRequest = members.some((m) => m.userId === user?.id && m.status === 'pending');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading branch...</p>
        </div>
      </div>
    );
  }

  if (error && !branch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <Link to="/branches" className="mt-4 text-indigo-600 hover:text-indigo-800">
            Back to branches
          </Link>
        </div>
      </div>
    );
  }

  if (!branch) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-gray-900">{branch.surname}</h1>
                {branch.isVerified && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    ✓ Verified
                  </span>
                )}
              </div>
              <p className="mt-1 text-lg text-gray-600">
                {branch.cityName}, {branch.region || branch.country}
              </p>
              <p className="mt-1 text-sm text-gray-500">Branch ID: {branch.id}</p>
            </div>

            {user && !isMember && !hasPendingRequest && (
              <button
                onClick={handleJoinRequest}
                disabled={joinLoading || joinSuccess}
                className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joinLoading ? 'Requesting...' : joinSuccess ? 'Request Sent!' : 'Request to Join'}
              </button>
            )}

            {hasPendingRequest && (
              <span className="px-6 py-2 text-sm font-medium text-yellow-800 bg-yellow-100 rounded-md">
                Join Request Pending
              </span>
            )}

            {isMember && (
              <span className="px-6 py-2 text-sm font-medium text-green-800 bg-green-100 rounded-md">
                ✓ Member
              </span>
            )}
          </div>

          {branch.description && (
            <div className="mt-4 prose max-w-none">
              <p className="text-gray-700">{branch.description}</p>
            </div>
          )}

          {/* Statistics */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Members</p>
              <p className="text-2xl font-bold text-gray-900">{branch._count?.members || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">People</p>
              <p className="text-2xl font-bold text-gray-900">{branch._count?.persons || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Generations</p>
              <p className="text-2xl font-bold text-gray-900">{branch.totalGenerations}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Stories</p>
              <p className="text-2xl font-bold text-gray-900">{branch._count?.stories || 0}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {joinSuccess && (
          <div className="rounded-md bg-green-50 p-4 mb-6">
            <div className="text-sm text-green-700">
              Your join request has been submitted! Branch administrators will review it soon.
            </div>
          </div>
        )}

        {/* Members */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Members ({members.length})</h2>

          {members.length === 0 ? (
            <p className="text-gray-500">No members yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{member.user?.fullName}</h3>
                      {member.user?.currentLocation && (
                        <p className="text-sm text-gray-500">{member.user.currentLocation}</p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        member.role === 'guru'
                          ? 'bg-purple-100 text-purple-800'
                          : member.role === 'editor'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {member.role}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Founder Info */}
        {branch.foundedBy && (
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h2 className="text-sm font-medium text-gray-500 mb-2">Founded By</h2>
            <p className="text-gray-900">{branch.foundedBy.fullName}</p>
            <p className="text-sm text-gray-500">
              {new Date(branch.createdAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
