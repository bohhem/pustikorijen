import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { updateMemberRole } from '../../api/branch';
import { useToast } from '../../contexts/ToastContext';
import type { BranchMember } from '../../types/branch';

interface MemberManagementSectionProps {
  branchId: string;
  members: BranchMember[];
  currentUserId: string;
  isGuru: boolean;
  onMemberUpdated: () => void;
}

export default function MemberManagementSection({
  branchId,
  members,
  currentUserId,
  isGuru,
  onMemberUpdated,
}: MemberManagementSectionProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

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
      onMemberUpdated();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('branchDetail.roleUpdateFailed'));
    } finally {
      setUpdatingMemberId(null);
    }
  };

  // Separate members by role and status
  const activeGurus = members.filter(m => m.role === 'guru' && m.status === 'active');
  const activeMembers = members.filter(m => m.role === 'member' && m.status === 'active');
  const pendingMembers = members.filter(m => m.status === 'pending');

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">{t('branchDetail.members')}</h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Gurus Section */}
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
                      {member.user?.fullName[0] || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.user?.fullName || 'Unknown'}
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

        {/* Active Members Section */}
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
                      {member.user?.fullName[0] || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.user?.fullName || 'Unknown'}
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

        {/* Pending Members Section */}
        {isGuru && pendingMembers.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Pending Requests ({pendingMembers.length})
            </h3>
            <div className="space-y-2">
              {pendingMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold">
                      {member.user?.fullName[0] || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.user?.fullName || 'Unknown'}</p>
                      {member.user?.email && (
                        <p className="text-sm text-gray-600">{member.user.email}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-yellow-700 font-medium">Pending Approval</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {members.length === 0 && (
          <p className="text-gray-500 text-center py-8">No members yet.</p>
        )}
      </div>
    </div>
  );
}
