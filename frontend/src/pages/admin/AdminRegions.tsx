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

export default function AdminRegions() {
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
        setError(parseErrorMessage(err));
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
    <AdminLayout title={t('admin.sections.regions')} description={t('admin.manageRegions.subtitle')}>
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
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              icon="🗺️"
              label={t('admin.regionStats.title')}
              value={summary.regionCount.toLocaleString()}
              tone="indigo"
            />
            <SummaryCard
              icon="🌿"
              label={t('admin.regionStats.branches')}
              value={summary.branchCount.toLocaleString()}
              tone="emerald"
            />
            <SummaryCard
              icon="👥"
              label={t('admin.regionStats.members')}
              value={summary.activeMemberCount.toLocaleString()}
              tone="blue"
            />
            <SummaryCard
              icon="⭐"
              label={t('admin.regionStats.gurus')}
              value={summary.guruCount.toLocaleString()}
              tone="purple"
            />
          </section>

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
              <form onSubmit={handleCreateRegion} className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">{t('admin.forms.regionName')}</label>
                  <input
                    type="text"
                    value={createRegionForm.name}
                    onChange={(e) => setCreateRegionForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">{t('admin.forms.regionCode')}</label>
                  <input
                    type="text"
                    value={createRegionForm.code}
                    onChange={(e) => setCreateRegionForm((prev) => ({ ...prev, code: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 uppercase tracking-widest focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">{t('admin.forms.country')}</label>
                  <input
                    type="text"
                    value={createRegionForm.country}
                    onChange={(e) => setCreateRegionForm((prev) => ({ ...prev, country: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">{t('admin.forms.description')}</label>
                  <textarea
                    value={createRegionForm.description}
                    onChange={(e) => setCreateRegionForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={t('admin.forms.descriptionPlaceholder')}
                  />
                </div>
                {createRegionError && (
                  <div className="md:col-span-2 text-sm text-red-600">{createRegionError}</div>
                )}
                <div className="md:col-span-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateRegionOpen(false);
                      setCreateRegionError(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                  >
                    {t('admin.actions.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {actionLoading ? t('common.saving') : t('admin.actions.createRegion')}
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="space-y-4">
            {regions.map((region) => (
              <div key={region.id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">{region.code}</p>
                    <h3 className="text-xl font-semibold text-slate-900">{region.name}</h3>
                    {region.description && <p className="text-sm text-slate-600">{region.description}</p>}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <div>
                      <p className="font-semibold text-slate-900">{region.totalBranches}</p>
                      <p>{t('admin.regionStats.branches')}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{region.activeMemberCount}</p>
                      <p>{t('admin.regionStats.members')}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{region.gurus.length}</p>
                      <p>{t('admin.regionStats.gurus')}</p>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-lg">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700">{t('admin.manageRegions.guruSectionTitle')}</p>
                    <button
                      type="button"
                      onClick={() => toggleAssignForm(region.id)}
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      {assigningRegionId === region.id ? t('common.close') : t('admin.actions.assignGuru')}
                    </button>
                  </div>

                  {assigningRegionId === region.id && (
                    <form onSubmit={(event) => handleAssignGuru(event, region.id)} className="px-4 py-3 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="email"
                          required
                          value={assignForm.email}
                          onChange={(e) => setAssignForm((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder={t('admin.forms.guruEmail')}
                          className="rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={assignForm.isPrimary}
                            onChange={(e) => setAssignForm((prev) => ({ ...prev, isPrimary: e.target.checked }))}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          {t('admin.forms.makePrimary')}
                        </label>
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={actionLoading}
                            className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {t('admin.actions.assignGuru')}
                          </button>
                        </div>
                      </div>
                      {assignError && <p className="text-sm text-red-600">{assignError}</p>}
                    </form>
                  )}

                  {region.gurus.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-slate-500">
                      {t('admin.regionStats.noGurus')}
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {region.gurus.map((guru) => (
                        <li key={guru.assignmentId} className="px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {guru.fullName}{' '}
                              {guru.isPrimary && (
                                <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full ml-2">
                                  {t('admin.regionStats.primaryGuru')}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500">{guru.email}</p>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            {!guru.isPrimary && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimary(region.id, guru.assignmentId)}
                                className="px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                                disabled={actionLoading}
                              >
                                {t('admin.actions.makePrimary')}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveAssignment(region.id, guru.assignmentId)}
                              className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                              disabled={actionLoading || region.gurus.length <= 1}
                            >
                              {t('common.remove')}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </AdminLayout>
  );
}

interface SummaryCardProps {
  icon: string;
  label: string;
  value: string;
  tone: 'indigo' | 'emerald' | 'blue' | 'purple';
}

function SummaryCard({ icon, label, value, tone }: SummaryCardProps) {
  const toneMap: Record<SummaryCardProps['tone'], string> = {
    indigo: 'bg-indigo-100 text-indigo-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-600">{label}</p>
        <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${toneMap[tone]}`}>{icon}</div>
    </div>
  );
}
