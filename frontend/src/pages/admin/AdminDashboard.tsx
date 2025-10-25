import { FormEvent, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  assignSuperGuru,
  createAdminRegion,
  getAdminRegionsOverview,
  removeSuperGuruAssignment,
  updateSuperGuruAssignment,
} from '../../api/admin';
import type { AdminRegionOverview } from '../../types/admin';
import { useToast } from '../../contexts/ToastContext';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [regions, setRegions] = useState<AdminRegionOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createRegionOpen, setCreateRegionOpen] = useState(false);
  const [createRegionForm, setCreateRegionForm] = useState({
    name: '',
    code: '',
    country: '',
    description: '',
  });
  const [createRegionError, setCreateRegionError] = useState<string | null>(null);
  const [assigningRegionId, setAssigningRegionId] = useState<string | null>(null);
  const [assignForm, setAssignForm] = useState({ email: '', isPrimary: false });
  const [assignError, setAssignError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const parseErrorMessage = (err: unknown) => {
    if (axios.isAxiosError(err)) {
      return (err.response?.data as { error?: string })?.error ?? err.message;
    }
    return t('errors.generic');
  };

  useEffect(() => {
    const loadRegions = async () => {
      try {
        const response = await getAdminRegionsOverview();
        setRegions(response);
      } catch (err) {
        console.error('Failed to load admin regions', err);
        setError(t('admin.loadError'));
      } finally {
        setLoading(false);
      }
    };

    loadRegions();
  }, [t]);

  const summary = useMemo(() => {
    if (!regions.length) {
      return {
        regionCount: 0,
        branchCount: 0,
        activeMemberCount: 0,
        guruCount: 0,
      };
    }

    const branchCount = regions.reduce((total, region) => total + region.totalBranches, 0);
    const activeMemberCount = regions.reduce((total, region) => total + region.activeMemberCount, 0);
    const guruCount = regions.reduce((total, region) => total + region.gurus.length, 0);

    return {
      regionCount: regions.length,
      branchCount,
      activeMemberCount,
      guruCount,
    };
  }, [regions]);

  const handleCreateRegion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateRegionError(null);
    setActionLoading(true);

    try {
      const payload = {
        name: createRegionForm.name.trim(),
        code: createRegionForm.code.trim(),
        country: createRegionForm.country.trim() || undefined,
        description: createRegionForm.description.trim() || undefined,
      };

      const updatedRegions = await createAdminRegion(payload);
      setRegions(updatedRegions);
      showSuccessToast(t('admin.messages.regionCreated'));
      setCreateRegionOpen(false);
      setCreateRegionForm({ name: '', code: '', country: '', description: '' });
    } catch (err) {
      const message = parseErrorMessage(err);
      setCreateRegionError(message);
      showErrorToast(message);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleAssignForm = (regionId: string) => {
    if (assigningRegionId === regionId) {
      setAssigningRegionId(null);
      setAssignForm({ email: '', isPrimary: false });
      setAssignError(null);
      return;
    }

    setAssigningRegionId(regionId);
    setAssignForm({ email: '', isPrimary: false });
    setAssignError(null);
  };

  const handleAssignGuru = async (event: FormEvent<HTMLFormElement>, regionId: string) => {
    event.preventDefault();
    setAssignError(null);
    setActionLoading(true);

    try {
      const updatedRegions = await assignSuperGuru(regionId, assignForm);
      setRegions(updatedRegions);
      showSuccessToast(t('admin.messages.guruAssigned'));
      setAssigningRegionId(null);
      setAssignForm({ email: '', isPrimary: false });
    } catch (err) {
      const message = parseErrorMessage(err);
      setAssignError(message);
      showErrorToast(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetPrimary = async (regionId: string, assignmentId: string) => {
    setActionLoading(true);
    try {
      const updatedRegions = await updateSuperGuruAssignment(regionId, assignmentId, { isPrimary: true });
      setRegions(updatedRegions);
      showSuccessToast(t('admin.messages.primaryUpdated'));
    } catch (err) {
      const message = parseErrorMessage(err);
      showErrorToast(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveAssignment = async (regionId: string, assignmentId: string) => {
    setActionLoading(true);
    try {
      const updatedRegions = await removeSuperGuruAssignment(regionId, assignmentId);
      setRegions(updatedRegions);
      showSuccessToast(t('admin.messages.guruRemoved'));
    } catch (err) {
      const message = parseErrorMessage(err);
      showErrorToast(message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout title={t('admin.title')} description={t('admin.subtitle')}>
      {loading && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            <p className="text-slate-500">{t('common.loading')}</p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6">
          <p className="font-semibold">{t('admin.loadError')}</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{t('admin.manageRegions.title')}</h2>
                <p className="text-sm text-slate-500">{t('admin.manageRegions.subtitle')}</p>
              </div>
              <button
                type="button"
                onClick={() => setCreateRegionOpen((prev) => !prev)}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                {createRegionOpen ? t('admin.actions.cancel') : t('admin.actions.addRegion')}
              </button>
            </div>

            {createRegionOpen && (
              <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleCreateRegion}>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">{t('admin.forms.regionName')}</span>
                  <input
                    type="text"
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={createRegionForm.name}
                    onChange={(event) =>
                      setCreateRegionForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    required
                    disabled={actionLoading}
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">{t('admin.forms.regionCode')}</span>
                  <input
                    type="text"
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={createRegionForm.code}
                    onChange={(event) =>
                      setCreateRegionForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))
                    }
                    required
                    maxLength={10}
                    disabled={actionLoading}
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">{t('admin.forms.country')}</span>
                  <input
                    type="text"
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={createRegionForm.country}
                    onChange={(event) =>
                      setCreateRegionForm((prev) => ({ ...prev, country: event.target.value }))
                    }
                    placeholder={t('admin.forms.countryPlaceholder')}
                    disabled={actionLoading}
                  />
                </label>

                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">{t('admin.forms.description')}</span>
                  <textarea
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    rows={3}
                    value={createRegionForm.description}
                    onChange={(event) =>
                      setCreateRegionForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    placeholder={t('admin.forms.descriptionPlaceholder')}
                    disabled={actionLoading}
                  />
                </label>

                {createRegionError && (
                  <p className="md:col-span-2 text-sm text-red-600">{createRegionError}</p>
                )}

                <div className="md:col-span-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateRegionOpen(false);
                      setCreateRegionError(null);
                      setCreateRegionForm({ name: '', code: '', country: '', description: '' });
                    }}
                    className="inline-flex items-center rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                    disabled={actionLoading}
                  >
                    {t('admin.actions.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                    disabled={actionLoading}
                  >
                    {actionLoading ? t('admin.actions.saving') : t('admin.actions.createRegion')}
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">{t('admin.metrics.regions')}</p>
              <p className="text-3xl font-semibold text-slate-900 mt-2">{summary.regionCount}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">{t('admin.metrics.branches')}</p>
              <p className="text-3xl font-semibold text-slate-900 mt-2">{summary.branchCount}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">{t('admin.metrics.gurus')}</p>
              <p className="text-3xl font-semibold text-slate-900 mt-2">{summary.guruCount}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">{t('admin.metrics.members')}</p>
              <p className="text-3xl font-semibold text-slate-900 mt-2">{summary.activeMemberCount}</p>
            </div>
          </section>

          {regions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-10 text-center">
              <p className="text-slate-500">{t('admin.noRegions')}</p>
            </div>
          ) : (
            <section className="space-y-6">
              {regions.map((region) => (
                <div key={region.id} className="bg-white border border-slate-200 rounded-xl shadow-sm">
                  <div className="border-b border-slate-100 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        {region.name}
                        <span className="ml-3 text-sm font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                          {region.code}
                        </span>
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        {region.country ?? t('admin.unknownCountry')}
                      </p>
                    </div>
                    {region.selfAssignment && (
                      <div className="text-sm text-slate-500">
                        <span className="font-medium text-slate-700">
                          {region.selfAssignment.isPrimary
                            ? t('admin.primaryAssignment')
                            : t('admin.supportingAssignment')}
                        </span>
                        <span className="ml-2">
                          {t('admin.assignedSince', {
                            date: new Date(region.selfAssignment.assignedAt).toLocaleDateString(),
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
                    <div className="space-y-4">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-500">{t('admin.regionStats.title')}</p>
                        <div className="mt-3 space-y-2 text-sm text-slate-700">
                          <div className="flex items-center justify-between">
                              <span>{t('admin.regionStats.branches')}</span>
                              <span className="font-semibold text-slate-900">{region.totalBranches}</span>
                          </div>
                          <div className="flex items-center justify-between">
                              <span>{t('admin.regionStats.members')}</span>
                              <span className="font-semibold text-slate-900">{region.activeMemberCount}</span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            {t('admin.regionStats.gurus')}
                          </p>
                          <button
                            type="button"
                            onClick={() => toggleAssignForm(region.id)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                            disabled={actionLoading && assigningRegionId === region.id}
                          >
                            {assigningRegionId === region.id
                              ? t('admin.actions.closeAssign')
                              : t('admin.actions.assignGuru')}
                          </button>
                        </div>
                        <ul className="space-y-2">
                          {region.gurus.map((guru) => (
                            <li
                              key={guru.assignmentId}
                              className={`rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm ${
                                guru.isSelf ? 'text-indigo-700' : 'text-slate-600'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium text-slate-800">{guru.fullName}</p>
                                  <p className="text-xs text-slate-400">{guru.email}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <span className="text-xs uppercase tracking-wide text-slate-500">
                                    {guru.isPrimary
                                      ? t('admin.regionStats.primaryGuru')
                                      : t('admin.regionStats.supportingGuru')}
                                  </span>
                                  <div className="flex gap-2">
                                    {!guru.isPrimary && (
                                      <button
                                        type="button"
                                        onClick={() => handleSetPrimary(region.id, guru.assignmentId)}
                                        className="inline-flex items-center rounded-md border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-60"
                                        disabled={actionLoading}
                                      >
                                        {t('admin.actions.makePrimary')}
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (region.gurus.length <= 1) {
                                          showErrorToast(t('admin.messages.cannotRemoveLast'));
                                          return;
                                        }
                                        if (window.confirm(t('admin.actions.confirmRemove'))) {
                                          handleRemoveAssignment(region.id, guru.assignmentId);
                                        }
                                      }}
                                      className="inline-flex items-center rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                                      disabled={actionLoading || region.gurus.length <= 1}
                                    >
                                      {t('admin.actions.removeGuru')}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                          {region.gurus.length === 0 && (
                            <li className="text-xs text-slate-400">{t('admin.regionStats.noGurus')}</li>
                          )}
                        </ul>

                        {assigningRegionId === region.id && (
                          <form
                            className="space-y-3 border-t border-slate-200 pt-4"
                            onSubmit={(event) => handleAssignGuru(event, region.id)}
                          >
                            <label className="flex flex-col gap-2">
                              <span className="text-xs font-medium text-slate-600">{t('admin.forms.guruEmail')}</span>
                              <input
                                type="email"
                                className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={assignForm.email}
                                onChange={(event) =>
                                  setAssignForm((prev) => ({ ...prev, email: event.target.value }))
                                }
                                required
                                disabled={actionLoading}
                              />
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-600">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                checked={assignForm.isPrimary}
                                onChange={(event) =>
                                  setAssignForm((prev) => ({ ...prev, isPrimary: event.target.checked }))
                                }
                                disabled={actionLoading}
                              />
                              {t('admin.forms.makePrimary')}
                            </label>
                            {assignError && <p className="text-xs text-red-600">{assignError}</p>}
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => toggleAssignForm(region.id)}
                                className="inline-flex items-center rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                                disabled={actionLoading}
                              >
                                {t('admin.actions.cancel')}
                              </button>
                              <button
                                type="submit"
                                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                                disabled={actionLoading}
                              >
                                {actionLoading ? t('admin.actions.saving') : t('admin.actions.assignGuru')}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                          {t('admin.recentBranches.title')}
                        </h3>
                        <span className="text-xs text-slate-400">
                          {t('admin.recentBranches.subtitle')}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {region.recentBranches.length === 0 && (
                          <div className="border border-dashed border-slate-200 rounded-lg p-6 text-center text-sm text-slate-400">
                            {t('admin.recentBranches.empty')}
                          </div>
                        )}
                        {region.recentBranches.map((branch) => (
                          <div key={branch.id} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-base font-semibold text-slate-900">{branch.surname}</p>
                                <p className="text-sm text-slate-500">
                                  {branch.cityName}
                                  {branch.region && `, ${branch.region}`}
                                  {!branch.region && branch.country && `, ${branch.country}`}
                                </p>
                              </div>
                              <span className="text-xs uppercase tracking-wide text-slate-400">
                                {new Date(branch.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                              <span>
                                {t('admin.recentBranches.visibility')}: {branch.visibility}
                              </span>
                              <span>
                                {t('admin.recentBranches.people', { count: branch.totalPeople })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </AdminLayout>
  );
}
