import { FormEvent, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../../components/admin/AdminLayout';
import { useToast } from '../../contexts/ToastContext';
import {
  createBackupSnapshot,
  downloadBackupManifest,
  getBackupHistory,
  getBackupOptions,
  getBackupSummary,
  requestBackupRestore,
} from '../../api/admin';
import RestoreBackupModal from '../../components/admin/backup/RestoreBackupModal';
import type {
  BackupOptions,
  BackupScope,
  BackupSnapshot,
  BackupSummary,
  CreateRestorePayload,
} from '../../types/admin';

interface ManualBackupFormState {
  label: string;
  scope: BackupScope;
  regionId: string;
  includeMedia: boolean;
  retentionDays: number;
  notifyEmails: string;
}

const DEFAULT_FORM_STATE: ManualBackupFormState = {
  label: '',
  scope: 'FULL',
  regionId: '',
  includeMedia: true,
  retentionDays: 30,
  notifyEmails: '',
};

const STATUS_STYLES: Record<
  BackupSnapshot['status'],
  { bg: string; text: string }
> = {
  QUEUED: { bg: 'bg-amber-50', text: 'text-amber-700' },
  RUNNING: { bg: 'bg-blue-50', text: 'text-blue-700' },
  COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  FAILED: { bg: 'bg-rose-50', text: 'text-rose-700' },
};

const formatBytes = (bytes?: number | null) => {
  if (!bytes || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[exponent]}`;
};

const formatRelativeTime = (value: string | null, fallback: string, localeLabel: string) => {
  if (!value) return fallback;
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch {
    return localeLabel;
  }
};

export default function AdminBackups() {
  const { t } = useTranslation();
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  const [summary, setSummary] = useState<BackupSummary | null>(null);
  const [history, setHistory] = useState<BackupSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<BackupOptions | null>(null);

  const [manualFormOpen, setManualFormOpen] = useState(false);
  const [manualForm, setManualForm] = useState<ManualBackupFormState>(DEFAULT_FORM_STATE);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [restoreSnapshot, setRestoreSnapshot] = useState<BackupSnapshot | null>(null);
  const [restoreSubmitting, setRestoreSubmitting] = useState(false);

  const parseErrorMessage = (err: unknown) => {
    if (axios.isAxiosError(err)) {
      return (err.response?.data as { error?: string })?.error ?? err.message;
    }
    return t('errors.generic', { defaultValue: 'Something went wrong.' });
  };

  useEffect(() => {
    let cancelled = false;

    const fetchBackups = async (showSpinner: boolean) => {
      if (showSpinner) {
        setLoading(true);
        setError(null);
      }
      try {
        const [summaryResponse, historyResponse] = await Promise.all([
          getBackupSummary(),
          getBackupHistory(),
        ]);
        if (cancelled) {
          return;
        }
        setSummary(summaryResponse);
        setHistory(historyResponse);
      } catch (err) {
        if (cancelled) {
          return;
        }
        console.error('Failed to load backup data', err);
        setError(t('admin.backups.messages.loadError'));
      } finally {
        if (!cancelled && showSpinner) {
          setLoading(false);
        }
      }
    };

    fetchBackups(true);
    getBackupOptions()
      .then(setOptions)
      .catch((err) => {
        console.error('Failed to load backup options', err);
      });
    const intervalId = window.setInterval(() => {
      fetchBackups(false);
    }, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [t]);

  const stats = useMemo(() => {
    return [
      {
        label: t('admin.backups.stats.lastSuccess'),
        value: formatRelativeTime(
          summary?.lastSuccessfulAt ?? null,
          t('common.never'),
          t('admin.backups.stats.lastSuccess'),
        ),
      },
      {
        label: t('admin.backups.stats.nextRun'),
        value: summary?.nextScheduledAt
          ? formatRelativeTime(summary.nextScheduledAt, t('common.never'), t('admin.backups.stats.nextRun'))
          : t('common.never'),
      },
      {
        label: t('admin.backups.stats.snapshots'),
        value: (summary?.totalSnapshots ?? 0).toString(),
      },
      {
        label: t('admin.backups.stats.storage'),
        value:
          summary?.storageUsageBytes != null
            ? formatBytes(summary.storageUsageBytes)
            : t('admin.backups.stats.storageUnknown'),
      },
      {
        label: t('admin.backups.stats.outstanding'),
        value: (summary?.outstandingRestores ?? 0).toString(),
      },
    ];
  }, [summary, t]);

  const handleManualInputChange = (field: keyof ManualBackupFormState, value: string | boolean | number) => {
    setManualForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateBackup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setManualError(null);
    setManualSubmitting(true);

    try {
      const notifyEmails = manualForm.notifyEmails
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean);

      const payload = {
        label: manualForm.label.trim(),
        scope: manualForm.scope,
        regionId: manualForm.scope === 'REGION' ? manualForm.regionId.trim() || undefined : undefined,
        includeMedia: manualForm.includeMedia,
        retentionDays: manualForm.retentionDays || undefined,
        notifyEmails: notifyEmails.length ? notifyEmails : undefined,
      };

      const snapshot = await createBackupSnapshot(payload);
      setHistory((prev) => [snapshot, ...prev].slice(0, 20));
      setSummary((prev) =>
        prev
          ? {
              ...prev,
              totalSnapshots: prev.totalSnapshots + 1,
              lastSuccessfulAt: snapshot.status === 'COMPLETED' ? snapshot.completedAt ?? snapshot.startedAt : prev.lastSuccessfulAt,
            }
          : prev,
      );
      showSuccessToast(t('admin.backups.messages.created'));
      setManualForm(DEFAULT_FORM_STATE);
      setManualFormOpen(false);
    } catch (err) {
      const message = parseErrorMessage(err);
      setManualError(message);
      showErrorToast(message);
    } finally {
      setManualSubmitting(false);
    }
  };

  const handleDownload = async (snapshot: BackupSnapshot) => {
    if (snapshot.status !== 'COMPLETED') {
      showErrorToast(t('admin.backups.history.notReady'));
      return;
    }

    setDownloadingId(snapshot.id);
    try {
      const blob = await downloadBackupManifest(snapshot.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${snapshot.label || 'backup'}-${snapshot.id}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = parseErrorMessage(err);
      showErrorToast(message ?? t('admin.backups.history.downloadError'));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRestoreSubmit = async (payload: CreateRestorePayload) => {
    if (!restoreSnapshot) {
      return;
    }
    setRestoreSubmitting(true);
    try {
      const restore = await requestBackupRestore(restoreSnapshot.id, payload);
      setHistory((prev) =>
        prev.map((item) =>
          item.id === restoreSnapshot.id
            ? {
                ...item,
                latestRestore: restore,
              }
            : item
        )
      );
      showSuccessToast(t('admin.backups.restore.success', { env: restore.targetEnv }));
    } catch (err) {
      const message = parseErrorMessage(err);
      showErrorToast(message);
      throw err;
    } finally {
      setRestoreSubmitting(false);
    }
  };

  const renderStatusBadge = (snapshot: BackupSnapshot) => {
    const styles = STATUS_STYLES[snapshot.status];
    const statusKey = snapshot.status.toLowerCase() as 'queued' | 'running' | 'completed' | 'failed';
    return (
      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${styles.bg} ${styles.text}`}>
        {t(`admin.backups.status.${statusKey}`)}
      </span>
    );
  };

  return (
    <AdminLayout title={t('admin.backups.title')} description={t('admin.backups.subtitle')}>
      {loading && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-10 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            <p className="text-slate-500">{t('common.loading')}</p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-6">
          <p className="font-semibold">{t('common.error')}</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs uppercase font-semibold text-slate-500 tracking-wide">{stat.label}</p>
                  <p className="text-2xl font-semibold text-slate-900 mt-2">{stat.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{t('admin.backups.manual.title')}</h2>
                <p className="text-sm text-slate-500">{t('admin.backups.manual.description')}</p>
              </div>
              <button
                type="button"
                onClick={() => setManualFormOpen((prev) => !prev)}
                className="inline-flex items-center justify-center rounded-md border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                {manualFormOpen ? t('admin.backups.manual.closeForm') : t('admin.backups.manual.openForm')}
              </button>
            </div>

            {manualFormOpen && (
              <form className="px-6 py-6 space-y-6" onSubmit={handleCreateBackup}>
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700">
                      {t('admin.backups.manual.label')}
                    </label>
                    <input
                      type="text"
                      value={manualForm.label}
                      onChange={(event) => handleManualInputChange('label', event.target.value)}
                      placeholder={t('admin.backups.manual.labelPlaceholder')}
                      className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                      maxLength={60}
                    />
                  </div>
                  <div className="w-full md:w-48">
                    <label className="block text-sm font-medium text-slate-700">
                      {t('admin.backups.manual.retention')}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={manualForm.retentionDays}
                      onChange={(event) => handleManualInputChange('retentionDays', Number(event.target.value))}
                      className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">{t('admin.backups.manual.scope')}</p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="backup-scope"
                          value="FULL"
                          checked={manualForm.scope === 'FULL'}
                          onChange={() => handleManualInputChange('scope', 'FULL')}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-700">{t('admin.backups.manual.scopeFull')}</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="backup-scope"
                          value="REGION"
                          checked={manualForm.scope === 'REGION'}
                          onChange={() => handleManualInputChange('scope', 'REGION')}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-700">{t('admin.backups.manual.scopeRegion')}</span>
                      </label>
                    </div>
                    {manualForm.scope === 'REGION' && (
                      <input
                        type="text"
                        value={manualForm.regionId}
                        onChange={(event) => handleManualInputChange('regionId', event.target.value)}
                        placeholder={t('admin.backups.manual.regionPlaceholder')}
                        className="mt-3 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                      />
                    )}
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={manualForm.includeMedia}
                        onChange={(event) => handleManualInputChange('includeMedia', event.target.checked)}
                        className="text-indigo-600 focus:ring-indigo-500 rounded"
                      />
                      <span className="text-sm text-slate-700">{t('admin.backups.manual.includeMedia')}</span>
                    </label>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        {t('admin.backups.manual.notify')}
                      </label>
                      <input
                        type="text"
                        value={manualForm.notifyEmails}
                        onChange={(event) => handleManualInputChange('notifyEmails', event.target.value)}
                        placeholder={t('admin.backups.manual.notifyPlaceholder')}
                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <p className="text-xs text-slate-500 mt-1">{t('admin.backups.manual.notifyHint')}</p>
                    </div>
                  </div>
                </div>

                {manualError && (
                  <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {manualError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    className="text-sm text-slate-500 hover:text-slate-700"
                    onClick={() => {
                      setManualForm(DEFAULT_FORM_STATE);
                      setManualFormOpen(false);
                    }}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={manualSubmitting}
                    className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {manualSubmitting ? t('common.loading') : t('admin.backups.manual.submit')}
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{t('admin.backups.history.title')}</h2>
                <p className="text-sm text-slate-500">{t('admin.backups.history.subtitle')}</p>
              </div>
              <p className="text-sm text-slate-500">
                {t('admin.backups.history.count', { count: history.length })}
              </p>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-lg">
                <p className="text-sm text-slate-500">{t('admin.backups.history.empty')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {t('admin.backups.history.columns.status')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {t('admin.backups.history.columns.label')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {t('admin.backups.history.columns.scope')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {t('admin.backups.history.columns.started')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {t('admin.backups.history.columns.completed')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {t('admin.backups.history.columns.size')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {t('admin.backups.history.columns.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {history.map((snapshot) => (
                      <tr key={snapshot.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">{renderStatusBadge(snapshot)}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-slate-900">{snapshot.label}</p>
                          <p className="text-xs text-slate-500">
                            {t('admin.backups.history.initiatedBy', {
                              name: snapshot.initiatedBy.fullName,
                            })}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-slate-700">
                            {snapshot.scope === 'FULL'
                              ? t('admin.backups.manual.scopeFull')
                              : snapshot.regionName || snapshot.regionId || t('admin.backups.history.regionFallback')}
                          </p>
                          {snapshot.scope === 'REGION' && snapshot.regionName && (
                            <p className="text-xs text-slate-500">{snapshot.regionId}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {snapshot.startedAt
                            ? formatDistanceToNow(new Date(snapshot.startedAt), { addSuffix: true })
                            : t('common.never')}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {snapshot.completedAt
                            ? formatDistanceToNow(new Date(snapshot.completedAt), { addSuffix: true })
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{formatBytes(snapshot.sizeBytes)}</td>
                        <td className="px-4 py-3 text-right space-y-1">
                          <div>
                            <button
                              type="button"
                              onClick={() => handleDownload(snapshot)}
                              disabled={snapshot.status !== 'COMPLETED' || downloadingId === snapshot.id}
                              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:text-slate-400 disabled:cursor-not-allowed"
                            >
                              {downloadingId === snapshot.id
                                ? t('admin.backups.history.downloading')
                                : t('admin.backups.history.download')}
                            </button>
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => setRestoreSnapshot(snapshot)}
                              disabled={snapshot.status !== 'COMPLETED' || !options?.restoreTargets?.length}
                              className="text-sm font-medium text-rose-600 hover:text-rose-500 disabled:text-slate-400 disabled:cursor-not-allowed"
                            >
                              {t('admin.backups.history.restore')}
                            </button>
                          </div>
                          {snapshot.latestRestore && (
                            <p className="text-xs text-slate-500">
                              {t('admin.backups.history.latestRestore', {
                                status: snapshot.latestRestore.status.toLowerCase(),
                                env: snapshot.latestRestore.targetEnv,
                              })}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
      <RestoreBackupModal
        open={Boolean(restoreSnapshot)}
        snapshot={restoreSnapshot}
        onClose={() => {
          if (!restoreSubmitting) {
            setRestoreSnapshot(null);
          }
        }}
        onSubmit={async (payload) => {
          await handleRestoreSubmit(payload);
          setRestoreSnapshot(null);
        }}
        restoreTargets={options?.restoreTargets ?? []}
        confirmTemplate={options?.confirmTemplate ?? 'RESTORE {backupId}'}
      />
    </AdminLayout>
  );
}
