import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBranchById, getBranchMembers, requestJoinBranch } from '../api/branch';
import { useAuth } from '../contexts/AuthContext';
import type { Branch, BranchMember } from '../types/branch';

export default function BranchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [members, setMembers] = useState<BranchMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (id) {
      loadBranch();
      loadMembers();
    }
  }, [id]);

  const loadBranch = async () => {
    try {
      const data = await getBranchById(id!);
      setBranch(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load branch');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const data = await getBranchMembers(id!);
      setMembers(data);
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      await requestJoinBranch(id!);
      alert('Join request submitted! A Guru will review your request.');
      loadMembers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit join request');
    } finally {
      setJoining(false);
    }
  };

  const isMember = members.some(m => m.userId === user?.id && m.status === 'active');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Branch not found'}</p>
          <button onClick={() => navigate('/branches')} className="mt-4 text-indigo-600">
            Back to Branches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{branch.surname} Family</h1>
              <p className="text-gray-600">{branch.cityName}, {branch.region || branch.country}</p>
              <p className="text-sm text-gray-500 font-mono mt-2">{branch.id}</p>
            </div>
            {!isMember && user && (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {joining ? 'Requesting...' : 'Request to Join'}
              </button>
            )}
          </div>

          {branch.description && (
            <div className="mb-6">
              <h2 className="font-semibold text-gray-900 mb-2">About</h2>
              <p className="text-gray-700">{branch.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t">
            <div>
              <p className="text-sm text-gray-600">Members</p>
              <p className="text-2xl font-bold">{branch._count?.members || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">People</p>
              <p className="text-2xl font-bold">{branch.totalPeople}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Generations</p>
              <p className="text-2xl font-bold">{branch.totalGenerations}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Stories</p>
              <p className="text-2xl font-bold">{branch._count?.stories || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Members ({members.length})</h2>
          <div className="space-y-3">
            {members.map(member => (
              <div key={member.id} className="flex justify-between items-center py-3 border-b last:border-0">
                <div>
                  <p className="font-medium">{member.user?.fullName}</p>
                  {member.user?.currentLocation && (
                    <p className="text-sm text-gray-600">{member.user.currentLocation}</p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  member.role === 'guru' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
