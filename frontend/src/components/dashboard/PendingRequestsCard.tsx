import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { getBranches, getBranchMembers, getPendingJoinRequests, getPersonLinks, getPersonClaims } from '../../api/branch';
import type { BranchMember, PersonLinkRecord, PersonClaim } from '../../types/branch';

interface PendingRequest {
  id: string;
  type: 'join' | 'person-link' | 'person-claim' | 'my-join';
  branchId: string;
  branchSurname: string;
  userName?: string;
  personName?: string;
  message?: string;
  createdAt: string;
}

export default function PendingRequestsCard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadPendingRequests = async () => {
      setLoading(true);
      try {
        // Get all branches
        const { branches } = await getBranches({ page: 1, limit: 100 });

        const allRequests: PendingRequest[] = [];

        // For each branch, check if user is a Guru and fetch pending requests
        for (const branch of branches) {
          // Get members to check user's role
          const members = await getBranchMembers(branch.id);
          const userMembership = members.find(m => m.userId === user.id);

          // If user is Guru, fetch pending join requests and person link requests
          const isGuru = userMembership?.role === 'guru';
          const isSuperGuru = ['SUPER_GURU', 'ADMIN', 'REGIONAL_GURU'].includes(user.globalRole);

          if (isGuru || isSuperGuru) {
            // Fetch pending join requests
            try {
              const joinRequests = await getPendingJoinRequests(branch.id);
              joinRequests.forEach((req: BranchMember) => {
                allRequests.push({
                  id: `join-${branch.id}-${req.userId}`,
                  type: 'join',
                  branchId: branch.id,
                  branchSurname: branch.surname,
                  userName: req.user?.fullName || req.userId,
                  message: req.joinMessage || undefined,
                  createdAt: req.joinedAt,
                });
              });
            } catch (err) {
              // User might not have permission
              console.error('Failed to load join requests for branch:', branch.id);
            }

            // Fetch pending person link requests
            try {
              const linkRequests = await getPersonLinks(branch.id, 'pending');
              linkRequests.forEach((link: PersonLinkRecord) => {
                allRequests.push({
                  id: `link-${link.id}`,
                  type: 'person-link',
                  branchId: branch.id,
                  branchSurname: branch.surname,
                  personName: link.displayName || link.person?.fullName || link.person?.id,
                  message: link.notes || undefined,
                  createdAt: link.createdAt,
                });
              });
            } catch (err) {
              console.error('Failed to load person link requests for branch:', branch.id);
            }

            // Fetch pending person identity claims
            try {
              const claims = await getPersonClaims(branch.id);
              claims.forEach((claim: PersonClaim) => {
                allRequests.push({
                  id: `claim-${claim.id}`,
                  type: 'person-claim',
                  branchId: branch.id,
                  branchSurname: branch.surname,
                  userName: claim.user.fullName,
                  personName: claim.personName,
                  message: claim.message || undefined,
                  createdAt: claim.createdAt,
                });
              });
            } catch (err) {
              console.error('Failed to load person claims for branch:', branch.id);
            }
          }

          // Check if user has a pending join request to this branch
          if (userMembership?.status === 'pending') {
            allRequests.push({
              id: `my-join-${branch.id}`,
              type: 'my-join',
              branchId: branch.id,
              branchSurname: branch.surname,
              message: userMembership.joinMessage || undefined,
              createdAt: userMembership.joinedAt,
            });
          }
        }

        // Sort by date (newest first)
        allRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setRequests(allRequests);
      } catch (err) {
        console.error('Failed to load pending requests:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPendingRequests();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.pendingRequests.title')}</h3>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.pendingRequests.title')}</h3>
        <p className="text-gray-600 text-center py-6">{t('dashboard.pendingRequests.noPending')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.pendingRequests.title')}</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            {requests.length}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {requests.slice(0, 5).map((request) => (
          <Link
            key={request.id}
            to={`/branches/${request.branchId}`}
            className="block border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {request.type === 'join' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {t('dashboard.pendingRequests.joinRequest')}
                    </span>
                  )}
                  {request.type === 'person-link' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      {t('dashboard.pendingRequests.linkRequest')}
                    </span>
                  )}
                  {request.type === 'person-claim' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                      {t('dashboard.pendingRequests.claimRequest')}
                    </span>
                  )}
                  {request.type === 'my-join' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                      {t('dashboard.pendingRequests.yourRequest')}
                    </span>
                  )}
                </div>

                <p className="text-sm font-medium text-gray-900">
                  {request.branchSurname} {t('dashboard.pendingRequests.branch')}
                </p>

                {request.userName && (
                  <p className="text-sm text-gray-600">
                    {t('dashboard.pendingRequests.from')}: {request.userName}
                  </p>
                )}

                {request.personName && (
                  <p className="text-sm text-gray-600">
                    {t('dashboard.pendingRequests.person')}: {request.personName}
                  </p>
                )}

                {request.message && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {request.message}
                  </p>
                )}
              </div>

              <div className="text-xs text-gray-500 whitespace-nowrap">
                {new Date(request.createdAt).toLocaleDateString()}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {requests.length > 5 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            {t('dashboard.pendingRequests.andMore', { count: requests.length - 5 })}
          </p>
        </div>
      )}
    </div>
  );
}
