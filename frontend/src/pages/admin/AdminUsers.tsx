import { useEffect, useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  getAllUsers,
  getPlatformUserStats,
  getUserById,
  updateUserRole,
  deactivateUser,
  reactivateUser,
  sendUserNotification,
  getUserActivity,
} from '../../api/users';
import type {
  UserListItem,
  UserFilters,
  UserPagination,
  PlatformUserStats,
  UserDetail,
  ActivityLogEntry,
} from '../../types/user';
import { useToast } from '../../contexts/ToastContext';

export default function AdminUsers() {
  const { t } = useTranslation();
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  // List state
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [stats, setStats] = useState<PlatformUserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'USER' | 'SUPER_GURU'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Detail modal state
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [userActivity, setUserActivity] = useState<ActivityLogEntry[]>([]);
  const [detailTab, setDetailTab] = useState<'overview' | 'branches' | 'activity'>('overview');

  // Action dialogs
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Action forms
  const [roleForm, setRoleForm] = useState<{ role: 'USER' | 'SUPER_GURU'; reason: string }>({
    role: 'USER',
    reason: '',
  });
  const [deactivateReason, setDeactivateReason] = useState('');
  const [notificationForm, setNotificationForm] = useState({
    subject: '',
    message: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    actionUrl: '',
  });

  const parseErrorMessage = (err: unknown) => {
    if (axios.isAxiosError(err)) {
      return (err.response?.data as { error?: string })?.error ?? err.message;
    }
    return t('errors.generic');
  };

  const loadUsers = async () => {
    try {
      setLoading(true);

      const filters: UserFilters = {};
      if (search) filters.search = search;
      if (roleFilter !== 'all') filters.role = roleFilter;
      if (statusFilter !== 'all') filters.isActive = statusFilter === 'active';

      const pagination: UserPagination = {
        page: currentPage,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const result = await getAllUsers(filters, pagination);
      setUsers(result.users);
      setTotalPages(result.totalPages);
      setError(null);
    } catch (err) {
      console.error('Failed to load users', err);
      setError(parseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const platformStats = await getPlatformUserStats();
      setStats(platformStats);
    } catch (err) {
      console.error('Failed to load user stats', err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentPage, search, roleFilter, statusFilter]);

  useEffect(() => {
    loadStats();
  }, []);

  const handleViewUserDetail = async (userId: string) => {
    try {
      const [userDetail, activity] = await Promise.all([
        getUserById(userId),
        getUserActivity(userId, 50),
      ]);
      setSelectedUser(userDetail);
      setUserActivity(activity);
      setDetailTab('overview');

      // Initialize role form with current role
      setRoleForm({ role: userDetail.globalRole, reason: '' });
    } catch (err) {
      console.error('Failed to load user detail', err);
      showErrorToast(parseErrorMessage(err));
    }
  };

  const handleCloseDetail = () => {
    setSelectedUser(null);
    setUserActivity([]);
    setDetailTab('overview');
  };

  const handleChangeRole = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      const updatedUser = await updateUserRole(selectedUser.id, {
        globalRole: roleForm.role,
        reason: roleForm.reason || undefined,
      });

      setSelectedUser(updatedUser);
      showSuccessToast(t('admin.users.messages.roleUpdated'));
      setChangeRoleDialogOpen(false);
      setRoleForm({ role: updatedUser.globalRole, reason: '' });

      // Refresh user list
      loadUsers();
    } catch (err) {
      console.error('Failed to update user role', err);
      showErrorToast(parseErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      const updatedUser = await deactivateUser(selectedUser.id, {
        reason: deactivateReason,
      });

      setSelectedUser(updatedUser);
      showSuccessToast(t('admin.users.messages.userDeactivated'));
      setDeactivateDialogOpen(false);
      setDeactivateReason('');

      // Refresh user list
      loadUsers();
    } catch (err) {
      console.error('Failed to deactivate user', err);
      showErrorToast(parseErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      const updatedUser = await reactivateUser(selectedUser.id);

      setSelectedUser(updatedUser);
      showSuccessToast(t('admin.users.messages.userReactivated'));

      // Refresh user list
      loadUsers();
    } catch (err) {
      console.error('Failed to reactivate user', err);
      showErrorToast(parseErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendNotification = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      await sendUserNotification(selectedUser.id, {
        subject: notificationForm.subject,
        message: notificationForm.message,
        priority: notificationForm.priority,
        actionUrl: notificationForm.actionUrl || undefined,
      });

      showSuccessToast(t('admin.users.messages.notificationSent'));
      setNotificationDialogOpen(false);
      setNotificationForm({
        subject: '',
        message: '',
        priority: 'normal',
        actionUrl: '',
      });
    } catch (err) {
      console.error('Failed to send notification', err);
      showErrorToast(parseErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('common.never');
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AdminLayout
      title={t('admin.users.title')}
      description={t('admin.users.subtitle')}
    >
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{t('admin.users.stats.totalUsers')}</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{t('admin.users.stats.activeUsers')}</p>
                <p className="text-2xl font-bold text-slate-900">{stats.activeUsers}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{t('admin.users.stats.superGurus')}</p>
                <p className="text-2xl font-bold text-slate-900">{stats.superGuruCount}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{t('admin.users.stats.newUsers30d')}</p>
                <p className="text-2xl font-bold text-slate-900">{stats.newUsersLast30Days}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={t('admin.users.searchPlaceholder')}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as typeof roleFilter);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">{t('admin.users.filters.allRoles')}</option>
            <option value="USER">{t('admin.users.filters.users')}</option>
            <option value="SUPER_GURU">{t('admin.users.filters.superGurus')}</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">{t('admin.users.filters.allStatuses')}</option>
            <option value="active">{t('admin.users.filters.active')}</option>
            <option value="inactive">{t('admin.users.filters.inactive')}</option>
          </select>
        </div>
      </div>

      {/* User List */}
      {loading && !users.length ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-10 text-center">
          <p className="text-slate-600">{t('admin.users.noUsers')}</p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
            {users.map((user) => (
              <div
                key={user.id}
                className="p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {user.fullName[0].toUpperCase()}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900 truncate">{user.fullName}</h3>
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            user.globalRole === 'SUPER_GURU'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {user.globalRole === 'SUPER_GURU' ? t('roles.superGuru') : t('roles.user')}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            user.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {user.isActive ? t('common.active') : t('common.inactive')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 truncate">{user.email}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {t('admin.users.lastLogin')}: {formatDate(user.lastLogin)} • {t('admin.users.joined')}: {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => handleViewUserDetail(user.id)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex-shrink-0"
                  >
                    {t('admin.users.viewDetails')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common.previous')}
              </button>
              <span className="px-4 py-2 text-sm text-slate-600">
                {t('common.pageOf', { current: currentPage, total: totalPages })}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common.next')}
              </button>
            </div>
          )}
        </>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedUser.fullName}</h2>
                <p className="text-sm text-slate-600">{selectedUser.email}</p>
              </div>
              <button
                onClick={handleCloseDetail}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 px-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setDetailTab('overview')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    detailTab === 'overview'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t('admin.users.tabs.overview')}
                </button>
                <button
                  onClick={() => setDetailTab('branches')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    detailTab === 'branches'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t('admin.users.tabs.branches')} ({selectedUser.branches.length})
                </button>
                <button
                  onClick={() => setDetailTab('activity')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    detailTab === 'activity'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t('admin.users.tabs.activity')}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {detailTab === 'overview' && (
                <div className="space-y-6">
                  {/* Profile Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">{t('admin.users.detail.profile')}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-600">{t('admin.users.detail.role')}:</span>
                        <span className="ml-2 font-medium">{selectedUser.globalRole === 'SUPER_GURU' ? t('roles.superGuru') : t('roles.user')}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">{t('admin.users.detail.status')}:</span>
                        <span className={`ml-2 font-medium ${selectedUser.isActive ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedUser.isActive ? t('common.active') : t('common.inactive')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600">{t('admin.users.detail.emailVerified')}:</span>
                        <span className="ml-2 font-medium">{selectedUser.emailVerified ? t('common.yes') : t('common.no')}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">{t('admin.users.detail.twoFactor')}:</span>
                        <span className="ml-2 font-medium">{selectedUser.twoFactorEnabled ? t('common.yes') : t('common.no')}</span>
                      </div>
                      {selectedUser.birthYear && (
                        <div>
                          <span className="text-slate-600">{t('admin.users.detail.birthYear')}:</span>
                          <span className="ml-2 font-medium">{selectedUser.birthYear}</span>
                        </div>
                      )}
                      {selectedUser.currentLocation && (
                        <div>
                          <span className="text-slate-600">{t('admin.users.detail.location')}:</span>
                          <span className="ml-2 font-medium">{selectedUser.currentLocation}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Statistics */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">{t('admin.users.detail.statistics')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-600">{t('admin.users.detail.totalBranches')}</p>
                        <p className="text-xl font-bold text-slate-900">{selectedUser.stats.totalBranches}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-600">{t('admin.users.detail.contributions')}</p>
                        <p className="text-xl font-bold text-slate-900">{selectedUser.stats.totalContributions}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-600">{t('admin.users.detail.stories')}</p>
                        <p className="text-xl font-bold text-slate-900">{selectedUser.stats.storiesCount}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-600">{t('admin.users.detail.persons')}</p>
                        <p className="text-xl font-bold text-slate-900">{selectedUser.stats.personsCreated}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">{t('admin.users.detail.actions')}</h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setChangeRoleDialogOpen(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                      >
                        {t('admin.users.actions.changeRole')}
                      </button>

                      {selectedUser.isActive ? (
                        <button
                          onClick={() => setDeactivateDialogOpen(true)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                        >
                          {t('admin.users.actions.deactivate')}
                        </button>
                      ) : (
                        <button
                          onClick={handleReactivate}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                        >
                          {actionLoading ? t('common.loading') : t('admin.users.actions.reactivate')}
                        </button>
                      )}

                      <button
                        onClick={() => setNotificationDialogOpen(true)}
                        className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 text-sm font-medium"
                      >
                        {t('admin.users.actions.sendNotification')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'branches' && (
                <div className="space-y-3">
                  {selectedUser.branches.length === 0 ? (
                    <p className="text-slate-600 text-center py-8">{t('admin.users.detail.noBranches')}</p>
                  ) : (
                    selectedUser.branches.map((branch) => (
                      <div key={branch.branchId} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-slate-900">{branch.branchName}</h4>
                            <p className="text-sm text-slate-600">
                              {t('admin.users.detail.branchRole')}: <span className="font-medium">{branch.role}</span>
                            </p>
                            <p className="text-xs text-slate-500">{t('admin.users.detail.joinedAt')}: {formatDate(branch.joinedAt)}</p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              branch.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {branch.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {detailTab === 'activity' && (
                <div className="space-y-3">
                  {userActivity.length === 0 ? (
                    <p className="text-slate-600 text-center py-8">{t('admin.users.detail.noActivity')}</p>
                  ) : (
                    userActivity.map((activity) => (
                      <div key={activity.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">{activity.actionType}</span>
                              <span className="text-xs text-slate-500">{activity.entityType}</span>
                            </div>
                            {activity.fieldChanged && (
                              <p className="text-sm text-slate-600 mt-1">
                                {activity.fieldChanged}: <span className="text-red-600">{activity.oldValue}</span> → <span className="text-green-600">{activity.newValue}</span>
                              </p>
                            )}
                            {activity.performedBy && (
                              <p className="text-xs text-slate-500 mt-1">
                                {t('admin.users.detail.performedBy')}: {activity.performedBy.fullName}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 flex-shrink-0">
                            {formatDateTime(activity.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Change Role Dialog */}
      {changeRoleDialogOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">{t('admin.users.dialogs.changeRole.title')}</h3>
            <form onSubmit={handleChangeRole} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('admin.users.dialogs.changeRole.currentRole')}
                </label>
                <p className="text-sm text-slate-600">{selectedUser.globalRole === 'SUPER_GURU' ? t('roles.superGuru') : t('roles.user')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('admin.users.dialogs.changeRole.newRole')}
                </label>
                <select
                  value={roleForm.role}
                  onChange={(e) => setRoleForm({ ...roleForm, role: e.target.value as 'USER' | 'SUPER_GURU' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="USER">{t('roles.user')}</option>
                  <option value="SUPER_GURU">{t('roles.superGuru')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('admin.users.dialogs.changeRole.reason')}
                </label>
                <textarea
                  value={roleForm.reason}
                  onChange={(e) => setRoleForm({ ...roleForm, reason: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder={t('admin.users.dialogs.changeRole.reasonPlaceholder')}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setChangeRoleDialogOpen(false);
                    setRoleForm({ role: selectedUser.globalRole, reason: '' });
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {actionLoading ? t('common.loading') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Dialog */}
      {deactivateDialogOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">{t('admin.users.dialogs.deactivate.title')}</h3>
            <form onSubmit={handleDeactivate} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">{t('admin.users.dialogs.deactivate.warning')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('admin.users.dialogs.deactivate.reason')} *
                </label>
                <textarea
                  value={deactivateReason}
                  onChange={(e) => setDeactivateReason(e.target.value)}
                  rows={4}
                  required
                  minLength={10}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder={t('admin.users.dialogs.deactivate.reasonPlaceholder')}
                />
                <p className="text-xs text-slate-500 mt-1">{t('admin.users.dialogs.deactivate.minLength')}</p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeactivateDialogOpen(false);
                    setDeactivateReason('');
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || deactivateReason.length < 10}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? t('common.loading') : t('admin.users.actions.deactivate')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Notification Dialog */}
      {notificationDialogOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">{t('admin.users.dialogs.notification.title')}</h3>
            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('admin.users.dialogs.notification.subject')} *
                </label>
                <input
                  type="text"
                  value={notificationForm.subject}
                  onChange={(e) => setNotificationForm({ ...notificationForm, subject: e.target.value })}
                  required
                  maxLength={200}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder={t('admin.users.dialogs.notification.subjectPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('admin.users.dialogs.notification.message')} *
                </label>
                <textarea
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                  rows={4}
                  required
                  maxLength={2000}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder={t('admin.users.dialogs.notification.messagePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('admin.users.dialogs.notification.priority')}
                </label>
                <select
                  value={notificationForm.priority}
                  onChange={(e) => setNotificationForm({ ...notificationForm, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="low">{t('admin.users.dialogs.notification.priorityLow')}</option>
                  <option value="normal">{t('admin.users.dialogs.notification.priorityNormal')}</option>
                  <option value="high">{t('admin.users.dialogs.notification.priorityHigh')}</option>
                  <option value="urgent">{t('admin.users.dialogs.notification.priorityUrgent')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('admin.users.dialogs.notification.actionUrl')}
                </label>
                <input
                  type="url"
                  value={notificationForm.actionUrl}
                  onChange={(e) => setNotificationForm({ ...notificationForm, actionUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder={t('admin.users.dialogs.notification.actionUrlPlaceholder')}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNotificationDialogOpen(false);
                    setNotificationForm({
                      subject: '',
                      message: '',
                      priority: 'normal',
                      actionUrl: '',
                    });
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {actionLoading ? t('common.loading') : t('admin.users.dialogs.notification.send')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
