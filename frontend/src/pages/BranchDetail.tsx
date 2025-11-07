import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getBranchById,
  getBranchMembers,
  requestJoinBranch,
  getPendingJoinRequests,
  getPersonLinks,
  approvePersonLinkRequest,
  rejectPersonLinkRequest,
  updateBranch,
} from '../api/branch';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Layout from '../components/layout/Layout';
import MemberManagementSection from '../components/branch/MemberManagementSection';
import PendingPersonLinks from '../components/branch/PendingPersonLinks';
import EditBranchModal from '../components/branch/EditBranchModal';
import ConnectedFamiliesSection from '../components/branch/ConnectedFamiliesSection';
import PersonClaimsSection from '../components/branch/PersonClaimsSection';
import type { Branch, BranchMember, PersonLinkRecord, UpdateBranchInput } from '../types/branch';
import { formatBranchLocation } from '../utils/location';

export default function BranchDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [members, setMembers] = useState<BranchMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<BranchMember[]>([]);
  const [pendingPersonLinks, setPendingPersonLinks] = useState<PersonLinkRecord[]>([]);
  const pendingLinksRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const isSuperGuru = useMemo(
    () => (user?.globalRole ? ['SUPER_GURU', 'ADMIN', 'REGIONAL_GURU'].includes(user.globalRole) : false),
    [user?.globalRole]
  );
  const isMember = useMemo(() => members.some(m => m.userId === user?.id && m.status === 'active'), [members, user?.id]);
  const isGuru = useMemo(
    () => members.some(m => m.userId === user?.id && m.role === 'guru' && m.status === 'active'),
    [members, user?.id]
  );
  const canViewProtectedTools = useMemo(() => isMember || isSuperGuru, [isMember, isSuperGuru]);
  const canModerateBranch = useMemo(() => isGuru || isSuperGuru, [isGuru, isSuperGuru]);

  const loadBranch = useCallback(async () => {
    if (!id) {
      return;
    }
    try {
      const data = await getBranchById(id);
      setBranch(data);
    } catch (err: any) {
      setError(err.response?.data?.error || t('branches.loadError'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  const loadMembers = useCallback(async () => {
    if (!id) {
      return;
    }

    try {
      const data = await getBranchMembers(id);
      setMembers(data);
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  }, [id]);

  const loadPendingRequests = useCallback(async () => {
    if (!id || !canModerateBranch) {
      setPendingRequests([]);
      return;
    }

    try {
      const requests = await getPendingJoinRequests(id);
      setPendingRequests(requests);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setPendingRequests([]);
      } else {
        console.error('Failed to load pending requests:', err);
      }
    }
  }, [id, canModerateBranch]);

  const loadPendingPersonLinks = useCallback(async () => {
    if (!id || !canModerateBranch) {
      setPendingPersonLinks([]);
      return;
    }

    try {
      const links = await getPersonLinks(id, 'pending');
      setPendingPersonLinks(links);
    } catch (err) {
      console.error('Failed to load person link requests:', err);
      setPendingPersonLinks([]);
    }
  }, [id, canModerateBranch]);

  useEffect(() => {
    void loadBranch();
    void loadMembers();
  }, [loadBranch, loadMembers]);

  useEffect(() => {
    void loadPendingRequests();
    void loadPendingPersonLinks();
  }, [loadPendingRequests, loadPendingPersonLinks]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await requestJoinBranch(id!);
      toast.success(t('branchDetail.joinRequestSubmitted'));
      await loadMembers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('branchDetail.joinRequestFailed'));
    } finally {
      setJoining(false);
    }
  };

  const handleMemberRefresh = useCallback(async () => {
    await Promise.all([loadMembers(), loadPendingRequests(), loadPendingPersonLinks()]);
  }, [loadMembers, loadPendingRequests, loadPendingPersonLinks]);

  const handleApprovePersonLink = useCallback(
    async (linkId: string) => {
      if (!id) return;
      try {
        await approvePersonLinkRequest(id, linkId);
        toast.success(t('branchDetail.linkApproved'));
        await loadPendingPersonLinks();
      } catch (err: any) {
        toast.error(err?.response?.data?.error || t('branchDetail.linkApprovalFailed'));
      }
    },
    [id, loadPendingPersonLinks, t, toast]
  );

  const handleRejectPersonLink = useCallback(
    async (linkId: string) => {
      if (!id) return;
      try {
        await rejectPersonLinkRequest(id, linkId);
        toast.success(t('branchDetail.linkRejected'));
        await loadPendingPersonLinks();
      } catch (err: any) {
        toast.error(err?.response?.data?.error || t('branchDetail.linkRejectionFailed'));
      }
    },
    [id, loadPendingPersonLinks, t, toast]
  );

  const handleBranchSave = useCallback(
    async (changes: UpdateBranchInput) => {
      if (!id) {
        throw new Error('Branch not found');
      }
      try {
        const { branch: updated } = await updateBranch(id, changes);
        setBranch(updated);
        toast.success(t('branchDetail.edit.success'));
        setEditModalOpen(false);
      } catch (err) {
        throw err;
      }
    },
    [id, toast, t]
  );

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !branch) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600">{error || t('branches.branchNotFound')}</p>
            <button onClick={() => navigate('/branches')} className="mt-4 text-indigo-600">
              {t('branchDetail.backToBranches')}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-8 mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{branch.surname} {t('branchDetail.family')}</h1>
              <p className="text-gray-600">{formatBranchLocation(branch)}</p>
              <p className="text-sm text-gray-500 font-mono mt-2">{branch.id}</p>
            </div>
            <div className="flex items-center gap-3">
              {canModerateBranch && (
                <button
                  type="button"
                  onClick={() => setEditModalOpen(true)}
                  className="px-4 py-2 border border-indigo-200 text-indigo-700 rounded-md hover:bg-indigo-50 font-medium transition"
                >
                  {t('branchDetail.edit.openButton')}
                </button>
              )}
              {!isMember && !isSuperGuru && user && (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {joining ? t('branchDetail.requesting') : t('branchDetail.requestToJoin')}
                </button>
              )}
            </div>
          </div>

          {branch.description && (
            <div className="mb-6">
              <h2 className="font-semibold text-gray-900 mb-2">{t('branchDetail.about')}</h2>
              <p className="text-gray-700">{branch.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t">
            <div>
              <p className="text-sm text-gray-600">{t('branches.members')}</p>
              <p className="text-2xl font-bold">{members.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('branches.totalPeople')}</p>
              <p className="text-2xl font-bold">{branch.totalPeople}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('branches.totalGenerations')}</p>
              <p className="text-2xl font-bold">{branch.totalGenerations}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('branches.stories')}</p>
              <p className="text-2xl font-bold">{branch._count?.stories || 0}</p>
            </div>
          </div>

          {canViewProtectedTools && (
            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-3 gap-3">
                <Link
                  to={`/branches/${branch.id}/tree`}
                  className="text-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                >
                  🌳 {t('branchDetail.treeView')}
                </Link>
                <Link
                  to={`/branches/${branch.id}/persons`}
                  className="text-center px-4 py-2 border border-indigo-600 text-indigo-600 rounded-md hover:bg-indigo-50 transition"
                >
                  📋 {t('branchDetail.listView')}
                </Link>
                {isGuru && (
                  <Link
                    to={`/branches/${branch.id}/persons/create`}
                    className="text-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                  >
                    ➕ {t('persons.create')}
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6 mt-8">
          {canModerateBranch && (
            <ConnectedFamiliesSection
              branchId={branch.id}
              canModerate={canModerateBranch}
              onShowPendingLinks={() => {
                if (pendingLinksRef.current) {
                  pendingLinksRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            />
          )}
          {canModerateBranch && (
            <PersonClaimsSection branchId={branch.id} canModerate={canModerateBranch} />
          )}

          {canModerateBranch && (
            <MemberManagementSection
              branchId={branch.id}
              members={members}
              pendingRequests={pendingRequests}
              currentUserId={user?.id || ''}
              isGuru={canModerateBranch}
              onRefresh={handleMemberRefresh}
            />
          )}

          {canModerateBranch && (
            <div ref={pendingLinksRef} id="pending-person-links">
              <PendingPersonLinks
                branchId={branch.id}
                links={pendingPersonLinks}
                onApprove={handleApprovePersonLink}
                onReject={handleRejectPersonLink}
              />
            </div>
          )}
        </div>
      </div>
      <EditBranchModal
        branch={branch}
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleBranchSave}
      />
    </Layout>
  );
}
