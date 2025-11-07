import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminRegionSelector from '../../components/admin/AdminRegionSelector';
import {
  archiveAdminBranch,
  getAdminBranches,
  hardDeleteAdminBranch,
  unarchiveAdminBranch,
  updateAdminBranchRegion,
} from '../../api/admin';
import type {
  AdminBranchListItem,
  AdminBranchStatusFilter,
  AdminRegionTreeNode,
} from '../../types/admin';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatRegionPath } from '../../utils/location';

const STATUS_OPTIONS: Array<{ value: AdminBranchStatusFilter; labelKey: string }> = [
  { value: 'active', labelKey: 'admin.branches.status.active' },
  { value: 'archived', labelKey: 'admin.branches.status.archived' },
  { value: 'all', labelKey: 'admin.branches.status.all' },
];

const PAGE_SIZE = 20;

export default function AdminBranches() {
  const { t } = useTranslation();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const { user } = useAuth();
  const isFullAdmin = user?.globalRole === 'SUPER_GURU' || user?.globalRole === 'ADMIN';

  const [branches, setBranches] = useState<AdminBranchListItem[]>([]);
  const [status, setStatus] = useState<AdminBranchStatusFilter>('active');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilterMode, setRegionFilterMode] = useState<'all' | 'region' | 'unassigned'>('all');
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [regionFilterPath, setRegionFilterPath] = useState<AdminRegionTreeNode[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [totals, setTotals] = useState({ active: 0, archived: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [assignRegionModalOpen, setAssignRegionModalOpen] = useState(false);
  const [assignRegionMode, setAssignRegionMode] = useState<'region' | 'unassigned'>('region');
  const [assignRegionId, setAssignRegionId] = useState<string | null>(null);
  const [assignRegionPath, setAssignRegionPath] = useState<AdminRegionTreeNode[]>([]);
  const [assignRegionError, setAssignRegionError] = useState<string | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const parseErrorMessage = (err: unknown) => {
    if (axios.isAxiosError(err)) {
      return (err.response?.data as { error?: string })?.error ?? err.message;
    }
    return t('errors.generic');
  };

  const regionFilterParam = useMemo(() => {
    if (regionFilterMode === 'unassigned') {
      return 'unassigned';
    }
    if (regionFilterMode === 'region') {
      return selectedRegionId ?? undefined;
    }
    return undefined;
  }, [regionFilterMode, selectedRegionId]);
  const hasSelection = selectedBranchIds.length > 0;
  const allVisibleSelected = useMemo(
    () => branches.length > 0 && branches.every((branch) => selectedBranchIds.includes(branch.id)),
    [branches, selectedBranchIds]
  );

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAdminBranches({
        page,
        limit: PAGE_SIZE,
        status,
        search: searchQuery || undefined,
        regionId: regionFilterParam,
      });
      setBranches(response.branches);
      setPagination(response.pagination);
      setTotals(response.totals);
      setSelectedBranchIds((prev) => prev.filter((id) => response.branches.some((branch) => branch.id === id)));
    } catch (error) {
      console.error('Failed to load admin branches', error);
      showErrorToast(t('admin.branches.loadError'));
    } finally {
      setLoading(false);
    }
  }, [page, status, searchQuery, regionFilterParam, showErrorToast, t]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleStatusChange = (nextStatus: AdminBranchStatusFilter) => {
    if (status === nextStatus) {
      return;
    }
    setStatus(nextStatus);
    setPage(1);
  };

  const handleRegionSelectorChange = (regionId: string | null, meta: { path: AdminRegionTreeNode[] }) => {
    if (!regionId) {
      clearRegionSelection();
      return;
    }
    setSelectedRegionId(regionId);
    setRegionFilterPath(meta.path);
    setRegionFilterMode('region');
    setPage(1);
  };

  const handleRegionFilterModeChange = (mode: 'all' | 'unassigned') => {
    setRegionFilterMode(mode);
    setSelectedRegionId(null);
    setRegionFilterPath([]);
    setPage(1);
  };

  const clearRegionSelection = () => {
    setRegionFilterMode('all');
    setSelectedRegionId(null);
    setRegionFilterPath([]);
    setPage(1);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  const handleArchive = async (branch: AdminBranchListItem) => {
    if (!window.confirm(t('admin.branches.archiveConfirm'))) {
      return;
    }

    const reasonInput = window.prompt(t('admin.branches.archiveReasonPrompt'), branch.archivedReason ?? '');
    const reason = reasonInput && reasonInput.trim().length > 0 ? reasonInput.trim() : null;

    try {
      await archiveAdminBranch(branch.id, reason);
      showSuccessToast(t('admin.branches.archiveSuccess'));
      await fetchBranches();
    } catch (error) {
      console.error('Failed to archive branch', error);
      showErrorToast(t('admin.branches.archiveError'));
    }
  };

  const handleUnarchive = async (branch: AdminBranchListItem) => {
    if (!window.confirm(t('admin.branches.unarchiveConfirm'))) {
      return;
    }

    try {
      await unarchiveAdminBranch(branch.id);
      showSuccessToast(t('admin.branches.unarchiveSuccess'));
      await fetchBranches();
    } catch (error) {
      console.error('Failed to unarchive branch', error);
      showErrorToast(t('admin.branches.unarchiveError'));
    }
  };

  const handleDelete = async (branch: AdminBranchListItem) => {
    if (!window.confirm(t('admin.branches.deleteConfirm'))) {
      return;
    }

    try {
      await hardDeleteAdminBranch(branch.id);
      showSuccessToast(t('admin.branches.deleteSuccess'));
      const nextPage = page > 1 && branches.length === 1 ? page - 1 : page;
      if (nextPage !== page) {
        setPage(nextPage);
      } else {
        await fetchBranches();
      }
    } catch (error) {
      console.error('Failed to permanently delete branch', error);
      showErrorToast(t('admin.branches.deleteError'));
    }
  };

  const handlePrevPage = () => {
    if (page <= 1) {
      return;
    }
    setPage((current) => Math.max(1, current - 1));
  };

  const handleNextPage = () => {
    if (page >= pagination.totalPages) {
      return;
    }
    setPage((current) => current + 1);
  };

  const toggleSelectAll = () => {
    if (!branches.length) {
      setSelectedBranchIds([]);
      return;
    }

    const allIds = branches.map((branch) => branch.id);
    const allSelected = allIds.every((id) => selectedBranchIds.includes(id));
    setSelectedBranchIds(allSelected ? [] : allIds);
  };

  const toggleSelectBranch = (branchId: string) => {
    setSelectedBranchIds((prev) =>
      prev.includes(branchId) ? prev.filter((id) => id !== branchId) : [...prev, branchId]
    );
  };

  const openAssignRegionModal = () => {
    setAssignRegionError(null);
    setAssignRegionMode('region');
    setAssignRegionId(null);
    setAssignRegionPath([]);
    setAssignRegionModalOpen(true);
  };

  const closeAssignRegionModal = () => {
    if (bulkActionLoading) return;
    setAssignRegionModalOpen(false);
    setAssignRegionError(null);
    setAssignRegionId(null);
    setAssignRegionPath([]);
  };

  const handleApplyRegion = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedBranchIds.length) {
      setAssignRegionError(t('admin.branches.assignRegion.noSelection'));
      return;
    }
    if (assignRegionMode === 'region' && !assignRegionId) {
      setAssignRegionError(t('admin.branches.assignRegion.selectRegion'));
      return;
    }
    if (assignRegionMode === 'unassigned' && !isFullAdmin) {
      setAssignRegionError(t('admin.branches.assignRegion.unassignedNotAllowed'));
      return;
    }

    const payload = {
      regionId: assignRegionMode === 'region' ? assignRegionId : null,
    };

    try {
      setBulkActionLoading(true);
      await Promise.all(selectedBranchIds.map((branchId) => updateAdminBranchRegion(branchId, payload)));
      showSuccessToast(t('admin.branches.assignRegion.success', { count: selectedBranchIds.length }));
      setSelectedBranchIds([]);
      closeAssignRegionModal();
      await fetchBranches();
    } catch (error) {
      const message = parseErrorMessage(error);
      setAssignRegionError(message);
      showErrorToast(message);
    } finally {
      setBulkActionLoading(false);
    }
  };

  return (
    <>
      <AdminLayout
      title={t('admin.branches.title')}
      description={t('admin.branches.subtitle')}
    >
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleStatusChange(option.value)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                    status === option.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {t(option.labelKey)}
                  {option.value === 'active' && totals.active > 0 && (
                    <span className="ml-2 text-xs font-semibold text-indigo-600">{totals.active}</span>
                  )}
                  {option.value === 'archived' && totals.archived > 0 && (
                    <span className="ml-2 text-xs font-semibold text-rose-600">{totals.archived}</span>
                  )}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={t('admin.branches.searchPlaceholder')}
                className="flex-1 md:w-64 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                {t('admin.branches.searchAction')}
              </button>
            </form>
          </div>

          <div className="px-4 sm:px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-slate-600">
              {t('admin.branches.resultsSummary', {
                total: pagination.total,
                page: pagination.page,
                totalPages: Math.max(1, pagination.totalPages),
              })}
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <p>
                  {t('admin.branches.selectionSummary', {
                    count: selectedBranchIds.length,
                  })}
                </p>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  {allVisibleSelected
                    ? t('admin.branches.selectionActions.clear')
                    : t('admin.branches.selectionActions.selectAll')}
                </button>
              </div>
              <button
                type="button"
                disabled={!hasSelection}
                onClick={openAssignRegionModal}
                className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-semibold rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('admin.branches.actions.assignRegion')}
              </button>
            </div>

            <div className="flex flex-col gap-2 text-sm w-full">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-500">{t('admin.branches.filters.regionLabel')}</span>
                <button
                  type="button"
                  onClick={() => handleRegionFilterModeChange('all')}
                  className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition ${
                    regionFilterMode === 'all'
                      ? 'border-indigo-500 text-indigo-700 bg-indigo-50'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t('admin.branches.filters.allRegions')}
                </button>
                {isFullAdmin && (
                  <button
                    type="button"
                    onClick={() => handleRegionFilterModeChange('unassigned')}
                    className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition ${
                      regionFilterMode === 'unassigned'
                        ? 'border-amber-500 text-amber-700 bg-amber-50'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t('admin.branches.filters.unassignedRegion')}
                  </button>
                )}
                {regionFilterMode === 'region' && selectedRegionId && (
                  <button
                    type="button"
                    onClick={clearRegionSelection}
                    className="px-2 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    {t('common.clear')}
                  </button>
                )}
              </div>
              {regionFilterMode !== 'unassigned' && (
                <AdminRegionSelector
                  value={selectedRegionId}
                  onChange={handleRegionSelectorChange}
                  disabled={loading}
                  placeholder={t('admin.branches.filters.regionPlaceholder')}
                />
              )}
              {regionFilterMode === 'region' && selectedRegionId && regionFilterPath.length > 0 && (
                <p className="text-xs text-slate-500">
                  {t('admin.branches.filters.activeRegion', { path: formatRegionPath(regionFilterPath) })}
                </p>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    {t('admin.branches.table.branch')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    {t('admin.branches.table.people')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    {t('admin.branches.table.visibility')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    {t('admin.branches.table.updated')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                    {t('admin.branches.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {!loading && branches.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                      {t('admin.branches.noResults')}
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                      {t('admin.branches.loading')}
                    </td>
                  </tr>
                )}

                {!loading &&
                  branches.map((branch) => {
                    const archived = Boolean(branch.archivedAt);
                    const archivedDate = archived && branch.archivedAt ? new Date(branch.archivedAt) : null;
                    const updatedDate = new Date(branch.updatedAt);
                    const regionTrail =
                      branch.adminRegionPath && branch.adminRegionPath.length > 0
                        ? formatRegionPath(branch.adminRegionPath)
                        : branch.adminRegion?.name ?? '';
                    const locationLine = branch.cityName
                      ? [branch.cityName, regionTrail || branch.country].filter(Boolean).join(' • ')
                      : regionTrail || branch.country || t('admin.branches.unknownLocation');

                    return (
                      <tr key={branch.id} className={archived ? 'bg-rose-50/50' : ''}>
                        <td className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            checked={selectedBranchIds.includes(branch.id)}
                            onChange={() => toggleSelectBranch(branch.id)}
                          />
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-semibold text-slate-900">{branch.surname}</span>
                              {branch.isVerified && (
                                <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  {t('admin.branches.verifiedBadge')}
                                </span>
                              )}
                              {archived && (
                                <span className="text-xs font-medium text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                                  {t('admin.branches.archivedBadge')}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-600">
                              {locationLine}
                            </div>
                            {regionTrail && (
                              <div className="text-xs text-slate-500">
                                {t('admin.branches.regionPathLabel', { path: regionTrail })}
                              </div>
                            )}
                            {archived && (
                              <div className="text-xs text-rose-600">
                                {archivedDate
                                  ? t('admin.branches.archivedMeta', {
                                      date: archivedDate.toLocaleDateString(),
                                      by: branch.archivedBy?.fullName ?? branch.archivedBy?.id ?? t('admin.branches.archivedUnknownUser'),
                                    })
                                  : t('admin.branches.archivedUnknownDate')}
                                {branch.archivedReason && (
                                  <span className="block text-rose-500 mt-0.5">
                                    {t('admin.branches.archivedReasonLabel', { reason: branch.archivedReason })}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          <div className="flex flex-col gap-1">
                            <span>{t('admin.branches.personCount', { count: branch.totalPeople })}</span>
                            <span className="text-xs text-slate-500">
                              {t('admin.branches.memberCount', { count: branch.memberCount })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700 capitalize">{branch.visibility.replace('_', ' ')}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {updatedDate.toLocaleDateString()} • {updatedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 text-right text-sm">
                          <div className="flex justify-end gap-2">
                            {!archived && (
                              <button
                                type="button"
                                onClick={() => handleArchive(branch)}
                                className="px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100"
                              >
                                {t('admin.branches.actions.archive')}
                              </button>
                            )}
                            {archived && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleUnarchive(branch)}
                                  className="px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                >
                                  {t('admin.branches.actions.unarchive')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(branch)}
                                  className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100"
                                >
                                  {t('admin.branches.actions.delete')}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="px-4 sm:px-6 py-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-600">
            <div>
              {t('admin.branches.paginationSummary', {
                start: Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total),
                end: Math.min(pagination.page * pagination.limit, pagination.total),
                total: pagination.total,
              })}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={page <= 1 || loading}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('admin.branches.paginationPrev')}
              </button>
              <span className="px-3 py-1.5 text-slate-600">
                {page} / {Math.max(1, pagination.totalPages)}
              </span>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={page >= pagination.totalPages || loading}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('admin.branches.paginationNext')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>

      {assignRegionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {t('admin.branches.assignRegion.title')}
              </h3>
              <p className="text-sm text-slate-600">
                {t('admin.branches.assignRegion.subtitle', { count: selectedBranchIds.length })}
              </p>
            </div>

            <form onSubmit={handleApplyRegion} className="space-y-4">
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAssignRegionMode('region')}
                  className={`px-3 py-1.5 rounded-full border transition ${
                    assignRegionMode === 'region'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t('admin.branches.assignRegion.modeRegion')}
                </button>
                {isFullAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setAssignRegionMode('unassigned');
                      setAssignRegionId(null);
                      setAssignRegionPath([]);
                    }}
                    className={`px-3 py-1.5 rounded-full border transition ${
                      assignRegionMode === 'unassigned'
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t('admin.branches.assignRegion.modeUnassigned')}
                  </button>
                )}
              </div>

              {assignRegionMode === 'region' ? (
                <>
                  <AdminRegionSelector
                    value={assignRegionId}
                    onChange={(regionId, meta) => {
                      setAssignRegionId(regionId);
                      setAssignRegionPath(meta.path);
                    }}
                    disabled={bulkActionLoading}
                    required
                  />
                  {assignRegionId && assignRegionPath.length > 0 && (
                    <p className="text-xs text-slate-500">
                      {t('admin.branches.assignRegion.selectedPath', { path: formatRegionPath(assignRegionPath) })}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-600">
                  {t('admin.branches.assignRegion.unassignedDescription')}
                </p>
              )}

              {assignRegionError && (
                <p className="text-sm text-rose-600">{assignRegionError}</p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeAssignRegionModal}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                  disabled={bulkActionLoading}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={bulkActionLoading}
                  className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {bulkActionLoading ? t('common.saving') : t('admin.branches.assignRegion.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
