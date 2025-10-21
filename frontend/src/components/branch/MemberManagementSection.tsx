import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { updateMemberRole, approveJoinRequest, rejectJoinRequest } from '../../api/branch';
import { useToast } from '../../contexts/ToastContext';
import type { BranchMember } from '../../types/branch';

interface MemberManagementSectionProps {
  branchId: string;
  members: BranchMember[];
  pendingRequests: BranchMember[];
  currentUserId: string;
  isGuru: boolean;
  onRefresh: () => void;
}

export default function MemberManagementSection({
  branchId,
  members,
  pendingRequests,
  currentUserId,
  isGuru,
  onRefresh,
}: MemberManagementSectionProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'guru' ? 'member' : 'guru';
    const confirmMessage = newRole === 'guru'
      ? t('branchDetail.confirmPromote')
      : t('branchDetail.confirmDemote');

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setUpdatingMemberId(userId);
    try {
      await updateMemberRole(branchId, userId, newRole);
      toast.success(t('branchDetail.roleUpdated'));
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('branchDetail.roleUpdateFailed'));
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleApproveRequest = async (userId: string) => {
    setProcessingRequestId(userId);
    try {
      await approveJoinRequest(branchId, userId);
      toast.success(t('branchDetail.requestApproved'));
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('branchDetail.requestActionFailed'));
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectRequest = async (userId: string) => {
    setProcessingRequestId(userId);
    try {
      await rejectJoinRequest(branchId, userId);
      toast.success(t('branchDetail.requestRejected'));
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('branchDetail.requestActionFailed'));
    } finally {
      setProcessingRequestId(null);
    }
  };

  const activeGurus = members.filter(m => m.role === 'guru' && m.status === 'active');
  const activeMembers = members.filter(m => m.role === 'member' && m.status === 'active');

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">{t('branchDetail.members')}</h2>
      </div>

      <div className="p-6 space-y-6">
        {activeGurus.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              {t('branchDetail.role.guru')}s ({activeGurus.length})
            </h3>
            <div className="space-y-2">
              {activeGurus.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                      {member.user?.fullName?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.user?.fullName || t('branchDetail.unknownUser')}
                        {member.userId === currentUserId && (
                          <span className="ml-2 text-xs text-gray-500">({t('common.you')})</span>
                        )}
                      </p>
                      {member.user?.email && (
                        <p className="text-sm text-gray-600">{member.user.email}</p>
                      )}
                    </div>
                  </div>
                  {isGuru && member.userId !== currentUserId && (
                    <button
                      onClick={() => handleRoleChange(member.userId, member.role)}
                      disabled={updatingMemberId === member.userId}
                      className="px-3 py-1 text-sm text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100 rounded transition disabled:opacity-50"
                    >
                      {updatingMemberId === member.userId ? t('common.loading') : t('branchDetail.demoteToMember')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeMembers.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              {t('branchDetail.role.member')}s ({activeMembers.length})
            </h3>
            <div className="space-y-2">
              {activeMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold">
                      {member.user?.fullName?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.user?.fullName || t('branchDetail.unknownUser')}
                        {member.userId === currentUserId && (
                          <span className="ml-2 text-xs text-gray-500">({t('common.you')})</span>
                        )}
                      </p>
                      {member.user?.email && (
                        <p className="text-sm text-gray-600">{member.user.email}</p>
                      )}
                    </div>
                  </div>
                  {isGuru && (
                    <button
                      onClick={() => handleRoleChange(member.userId, member.role)}
                      disabled={updatingMemberId === member.userId}
                      className="px-3 py-1 text-sm text-green-700 hover:text-green-900 hover:bg-green-50 rounded transition disabled:opacity-50"
                    >
                      {updatingMemberId === member.userId ? t('common.loading') : t('branchDetail.promoteToGuru')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {isGuru && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center justify-between">
              <span>{t('branchDetail.pendingRequestsTitle', { count: pendingRequests.length })}</span>
              <span className="text-xs font-medium text-gray-500">
                {t('branchDetail.pendingRequestsCaption')}
              </span>
            </h3>
            {pendingRequests.length > 0 ? (
              <div className="space-y-2">
                {pendingRequests.map((member) => (
                  <div
                    key={member.id}
                    className="p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold">
                          {member.user?.fullName?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.user?.fullName || t('branchDetail.unknownUser')}</p>
                          {member.user?.email && (
                            <p className="text-sm text-gray-600">{member.user.email}</p>
                          )}
                          {member.joinMessage && (
                            <p className="text-sm text-yellow-800 italic mt-2 border-l-2 border-yellow-300 pl-3">
                              “{member.joinMessage}”
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-yellow-700 uppercase mt-1">
                        {t('branchDetail.pendingStatus')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleApproveRequest(member.userId)}
                        disabled={processingRequestId === member.userId}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50"
                      >
                        {processingRequestId === member.userId
                          ? t('common.loading')
                          : t('branchDetail.approveRequest')}
                      </button>
                      <button
                        onClick={() => handleRejectRequest(member.userId)}
                        disabled={processingRequestId === member.userId}
                        className="px-3 py-1 text-sm border border-red-600 text-red-600 rounded hover:bg-red-50 transition disabled:opacity-50"
                      >
                        {processingRequestId === member.userId
                          ? t('common.loading')
                          : t('branchDetail.rejectRequest')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">{t('branchDetail.noPendingRequests')}</p>
            )}
          </div>
        )}

        {members.length === 0 && (
          <p className="text-gray-500 text-center py-8">{t('branchDetail.noMembersYet')}</p>
        )}
      </div>
    </div>
  );
}
