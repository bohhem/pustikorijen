import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  clearPrimaryBridge,
  getBridgeIssues,
  setPrimaryBridge,
  rejectBridgeLink,
  updateBridgeGeneration,
} from '../../api/admin';
import type { BridgeIssueSummary } from '../../types/admin';
import { useToast } from '../../contexts/ToastContext';

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

const FOCUS_BRANCHES = new Set(['ajanovic', 'kahvic']);

function formatBranchLabel(branch: BridgeIssueSummary['branchA']) {
  if (!branch.cityName) {
    return branch.surname;
  }
  return `${branch.surname} (${branch.cityName})`;
}

export default function AdminBridgeIssues() {
  const { t } = useTranslation();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [issues, setIssues] = useState<BridgeIssueSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLinkId, setActiveLinkId] = useState<string | null>(null);
  const [generationDrafts, setGenerationDrafts] = useState<Record<string, string>>({});

  const focusIssue = useMemo(() => {
    return issues.find((issue) => {
      const a = normalizeName(issue.branchA.surname);
      const b = normalizeName(issue.branchB.surname);
      return FOCUS_BRANCHES.has(a) && FOCUS_BRANCHES.has(b);
    }) ?? null;
  }, [issues]);

  useEffect(() => {
    const loadIssues = async () => {
      try {
        const data = await getBridgeIssues();
        setIssues(data);
      } catch (err) {
        console.error('Failed to load bridge issues', err);
        setError(t('admin.bridgeIssues.loadError'));
      } finally {
        setLoading(false);
      }
    };

    loadIssues();
  }, [t]);

  const refresh = async (callback: () => Promise<BridgeIssueSummary[]>, successMessage: string) => {
    try {
      const data = await callback();
      setIssues(data);
      setGenerationDrafts({});
      showSuccessToast(successMessage);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error ?? err.message
        : t('errors.generic');
      showErrorToast(message);
    } finally {
      setActiveLinkId(null);
    }
  };

  const handleSetPrimary = async (linkId: string) => {
    setActiveLinkId(linkId);
    await refresh(() => setPrimaryBridge(linkId), t('admin.bridgeIssues.hasPrimary'));
  };

  const handleClearPrimary = async (linkId: string) => {
    setActiveLinkId(linkId);
    await refresh(() => clearPrimaryBridge(linkId), t('admin.bridgeIssues.clearedPrimary'));
  };

  const handleRejectBridge = async (linkId: string) => {
    if (!window.confirm(t('admin.bridgeIssues.confirmReject'))) {
      return;
    }
    setActiveLinkId(linkId);
    await refresh(() => rejectBridgeLink(linkId), t('admin.bridgeIssues.bridgeRejected'));
  };

  const handleGenerationChange = (linkId: string, value: string) => {
    setGenerationDrafts((prev) => ({ ...prev, [linkId]: value }));
  };

  const handleSaveGeneration = async (linkId: string) => {
    const draft = generationDrafts[linkId] ?? '';

    if (draft.trim() === '') {
      showErrorToast(t('admin.bridgeIssues.overrideRequired'));
      return;
    }

    const numeric = Number(draft);
    if (!Number.isFinite(numeric) || !Number.isInteger(numeric)) {
      showErrorToast(t('admin.bridgeIssues.overrideRequired'));
      return;
    }

    if (numeric < 1 || numeric > 30) {
      showErrorToast(t('admin.bridgeIssues.overrideOutOfRange'));
      return;
    }

    setActiveLinkId(linkId);
    await refresh(() => updateBridgeGeneration(linkId, numeric), t('admin.bridgeIssues.generationUpdated'));
  };

  const handleClearGeneration = async (linkId: string) => {
    setGenerationDrafts((prev) => ({ ...prev, [linkId]: '' }));
    setActiveLinkId(linkId);
    await refresh(() => updateBridgeGeneration(linkId, null), t('admin.bridgeIssues.generationCleared'));
  };

  return (
    <AdminLayout title={t('admin.bridgeIssues.title')} description={t('admin.bridgeIssues.subtitle')}>
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
          <p className="font-semibold">{t('admin.bridgeIssues.loadError')}</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {!loading && !error && focusIssue && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4">
          <p className="text-sm font-medium">{t('admin.bridgeIssues.focusPair', { count: focusIssue.totalLinks })}</p>
          {!focusIssue.hasPrimary && (
            <p className="text-xs mt-1">{t('admin.bridgeIssues.missingPrimary')}</p>
          )}
        </div>
      )}

      {!loading && !error && issues.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 text-center">
          <p className="text-slate-600">{t('admin.bridgeIssues.empty')}</p>
        </div>
      )}

      {!loading && !error && issues.length > 0 && (
        <div className="space-y-6">
          {issues.map((issue) => {
            const branchLabels: Record<string, string> = {
              [issue.branchA.id]: formatBranchLabel(issue.branchA),
              [issue.branchB.id]: formatBranchLabel(issue.branchB),
            };
            const isFocus =
              focusIssue?.pairId === issue.pairId &&
              FOCUS_BRANCHES.has(normalizeName(issue.branchA.surname)) &&
              FOCUS_BRANCHES.has(normalizeName(issue.branchB.surname));

            return (
              <section
                key={issue.pairId}
                className={`bg-white border rounded-xl shadow-sm ${
                  isFocus ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
                }`}
              >
                <header className="flex flex-col gap-2 border-b border-slate-100 px-6 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {t('admin.bridgeIssues.pairLabel', {
                        branchA: formatBranchLabel(issue.branchA),
                        branchB: formatBranchLabel(issue.branchB),
                      })}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {t('admin.bridgeIssues.connectionCount', { count: issue.totalLinks })}
                    </p>
                  </div>
                  <div>
                    {issue.hasPrimary ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                        <span className="h-2 w-2 rounded-full bg-green-500"></span>
                        {t('admin.bridgeIssues.hasPrimary')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                        <span className="h-2 w-2 rounded-full bg-red-500"></span>
                        {t('admin.bridgeIssues.missingPrimary')}
                      </span>
                    )}
                  </div>
                </header>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {t('admin.bridgeIssues.person')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {t('admin.bridgeIssues.direction')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {t('admin.bridgeIssues.status')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {t('admin.bridgeIssues.generationColumn')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {t('admin.bridgeIssues.notes')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {t('admin.bridgeIssues.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {issue.links.map((link) => {
                        const directionLabel = t('admin.bridgeIssues.directionValue', {
                          source: branchLabels[link.sourceBranchId] ?? link.sourceBranchId,
                          target: branchLabels[link.targetBranchId] ?? link.targetBranchId,
                        });
                        const isWorking = activeLinkId === link.id;
                        const canonicalGeneration =
                          typeof link.person.generationNumber === 'number'
                            ? link.person.generationNumber
                            : null;
                        const draftValue =
                          generationDrafts[link.id] ??
                          (link.displayGenerationOverride != null
                            ? String(link.displayGenerationOverride)
                            : '');

                        return (
                          <tr key={link.id} className={link.isPrimary ? 'bg-indigo-50/40' : ''}>
                            <td className="px-6 py-4 align-top">
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-slate-900">{link.person.fullName}</p>
                                {link.person.generationNumber && (
                                  <p className="text-xs text-slate-500">
                                    {t('personDetail.gen')} {link.person.generationNumber}
                                  </p>
                                )}
                                {link.displayName && (
                                  <p className="text-xs text-slate-500">{link.displayName}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 align-top text-sm text-slate-600">{directionLabel}</td>
                            <td className="px-6 py-4 align-top">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  link.status === 'approved'
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {link.status === 'approved'
                                  ? t('admin.bridgeIssues.approvedBadge')
                                  : t('admin.bridgeIssues.pendingBadge')}
                              </span>
                              {link.isPrimary && (
                                <div className="mt-2 text-xs font-medium text-indigo-700">
                                  {t('admin.bridgeIssues.hasPrimary')}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 align-top">
                              <div className="space-y-2 text-sm text-slate-600">
                                <div className="text-xs text-slate-500">
                                  {canonicalGeneration
                                    ? t('admin.bridgeIssues.homeGeneration', { number: canonicalGeneration })
                                    : t('admin.bridgeIssues.homeGeneration', { number: '—' })}
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <input
                                    type="number"
                                    min={1}
                                    max={30}
                                    value={draftValue}
                                    onChange={(event) => handleGenerationChange(link.id, event.target.value)}
                                    placeholder={t('admin.bridgeIssues.overridePlaceholder') ?? ''}
                                    className="w-20 rounded-md border border-slate-200 px-2 py-1 text-xs shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveGeneration(link.id)}
                                      disabled={isWorking}
                                      className="inline-flex items-center gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
                                    >
                                      {isWorking
                                        ? t('common.loading')
                                        : t('admin.bridgeIssues.saveOverride')}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleClearGeneration(link.id)}
                                      disabled={isWorking || draftValue === '' && link.displayGenerationOverride == null}
                                      className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
                                    >
                                      {isWorking
                                        ? t('common.loading')
                                        : t('admin.bridgeIssues.clearOverride')}
                                    </button>
                                  </div>
                                </div>
                                <p className="text-[10px] text-slate-400">{t('admin.bridgeIssues.overrideHint')}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 align-top text-sm text-slate-600">
                              {link.notes ? link.notes : <span className="text-slate-400">—</span>}
                            </td>
                            <td className="px-6 py-4 align-top">
                              <div className="flex flex-wrap gap-2">
                                {!link.isPrimary ? (
                                  <button
                                    type="button"
                                    onClick={() => handleSetPrimary(link.id)}
                                    disabled={isWorking}
                                    className="inline-flex items-center gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
                                  >
                                    {isWorking ? t('common.loading') : t('admin.bridgeIssues.setPrimary')}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleClearPrimary(link.id)}
                                    disabled={isWorking}
                                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
                                  >
                                    {isWorking ? t('common.loading') : t('admin.bridgeIssues.clearPrimary')}
                                  </button>
                                )}
                                {!link.isPrimary && (
                                  <button
                                    type="button"
                                    onClick={() => handleRejectBridge(link.id)}
                                    disabled={isWorking}
                                    className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                                  >
                                    {isWorking ? t('common.loading') : t('admin.bridgeIssues.rejectBridge')}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
