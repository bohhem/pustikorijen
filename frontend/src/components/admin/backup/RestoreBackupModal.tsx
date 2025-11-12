import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import type {
  BackupImpactPreview,
  BackupSnapshot,
  CreateRestorePayload,
} from '../../../types/admin';
import { getBackupImpact } from '../../../api/admin';

interface RestoreBackupModalProps {
  open: boolean;
  snapshot: BackupSnapshot | null;
  onClose: () => void;
  onSubmit: (payload: CreateRestorePayload) => Promise<void>;
  restoreTargets: string[];
  confirmTemplate: string;
}

const CHECKBOXES = ['maintenance', 'backup', 'paused'] as const;
type ChecklistKey = (typeof CHECKBOXES)[number];

export default function RestoreBackupModal({
  open,
  snapshot,
  onClose,
  onSubmit,
  restoreTargets,
  confirmTemplate,
}: RestoreBackupModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [targetEnv, setTargetEnv] = useState('');
  const [dryRun, setDryRun] = useState(false);
  const [impact, setImpact] = useState<BackupImpactPreview | null>(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const [impactError, setImpactError] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Record<ChecklistKey, boolean>>({
    maintenance: false,
    backup: false,
    paused: false,
  });
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const expectedConfirmPhrase = useMemo(() => {
    if (!snapshot) {
      return '';
    }
    return confirmTemplate.replace('{backupId}', snapshot.id);
  }, [confirmTemplate, snapshot]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setStep(1);
    setDryRun(false);
    setChecklist({
      maintenance: false,
      backup: false,
      paused: false,
    });
    setConfirmPhrase('');
    setOtpCode('');
    setImpact(null);
    setImpactError(null);
    setImpactLoading(false);
    setTargetEnv(restoreTargets[0] ?? '');
  }, [open, restoreTargets]);

  useEffect(() => {
    if (step !== 2 || !snapshot || !targetEnv) {
      return;
    }
    let cancelled = false;
    setImpact(null);
    setImpactError(null);
    setImpactLoading(true);
    getBackupImpact(snapshot.id, targetEnv)
      .then((preview) => {
        if (!cancelled) {
          setImpact(preview);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setImpactError(error?.response?.data?.error ?? t('admin.backups.restore.errors.impact'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setImpactLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [step, snapshot, targetEnv, t]);

  if (!snapshot) {
    return null;
  }

  const canAdvanceStep1 = Boolean(targetEnv);
  const canAdvanceStep2 = Object.values(checklist).every(Boolean) && !impactLoading && !impactError;
  const confirmMatches =
    confirmPhrase.trim().toUpperCase() === expectedConfirmPhrase.trim().toUpperCase();

  const handleSubmit = async () => {
    if (!confirmMatches) {
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        targetEnv,
        dryRun,
        confirmPhrase,
        otpCode: otpCode.trim() ? otpCode.trim() : undefined,
      });
      onClose();
    } catch (error) {
      console.error('Restore request failed', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:p-6">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white text-left shadow-2xl">
        <div className="border-b border-slate-100 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-slate-900">
                {t('admin.backups.restore.title', { label: snapshot.label })}
              </p>
              <p className="text-sm text-slate-500">{t('admin.backups.restore.subtitle')}</p>
            </div>
            <button
              type="button"
              className="text-sm font-medium text-slate-500 hover:text-slate-800"
              onClick={() => (!submitting ? onClose() : null)}
              disabled={submitting}
            >
              {t('common.close')}
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-slate-100">
                  <nav className="flex items-center gap-4 text-sm font-semibold text-slate-500">
                    {[1, 2, 3].map((value) => (
                      <div key={value} className="flex items-center gap-2">
                        <span
                          className={`h-6 w-6 rounded-full text-xs flex items-center justify-center ${
                            value <= step
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {value}
                        </span>
                        <span className={value === step ? 'text-slate-900' : ''}>
                          {t(`admin.backups.restore.steps.${value}`)}
                        </span>
                      </div>
                    ))}
                  </nav>
                </div>

        <div className="px-6 py-6 space-y-6">
                  {step === 1 && (
                    <section className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">
                          {t('admin.backups.restore.targetEnv')}
                        </label>
                        <select
                          value={targetEnv}
                          onChange={(event) => setTargetEnv(event.target.value)}
                          className="mt-1 block w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                        >
                          {restoreTargets.length === 0 && (
                            <option value="">
                              {t('admin.backups.restore.noTargets')}
                            </option>
                          )}
                          {restoreTargets.map((target) => (
                            <option key={target} value={target}>
                              {target}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <input
                          id="restore-dry-run"
                          type="checkbox"
                          checked={dryRun}
                          onChange={(event) => setDryRun(event.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="restore-dry-run" className="text-sm text-slate-700">
                          {t('admin.backups.restore.dryRun')}
                        </label>
                      </div>
                      <p className="text-xs text-slate-500">
                        {t('admin.backups.restore.targetHint')}
                      </p>
                    </section>
                  )}

                  {step === 2 && (
                    <section className="space-y-4">
                      {impactLoading && (
                        <p className="text-sm text-slate-500">{t('common.loading')}</p>
                      )}
                      {impactError && (
                        <p className="text-sm text-rose-600">{impactError}</p>
                      )}
                      {impact && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="rounded-lg border border-slate-200 p-4">
                              <p className="text-xs uppercase text-slate-500 font-semibold">
                                {t('admin.backups.restore.stats.size')}
                              </p>
                              <p className="text-lg font-semibold text-slate-900 mt-1">
                                {impact.sizeBytes ? `${(impact.sizeBytes / (1024 * 1024)).toFixed(1)} MB` : '—'}
                              </p>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-4">
                              <p className="text-xs uppercase text-slate-500 font-semibold">
                                {t('admin.backups.restore.stats.downtime')}
                              </p>
                              <p className="text-lg font-semibold text-slate-900 mt-1">
                                ~{impact.estimatedDowntimeMinutes} {t('common.minutes')}
                              </p>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-4">
                              <p className="text-xs uppercase text-slate-500 font-semibold">
                                {t('admin.backups.restore.stats.includeMedia')}
                              </p>
                              <p className="text-lg font-semibold text-slate-900 mt-1">
                                {impact.includeMedia ? t('common.yes') : t('common.no')}
                              </p>
                            </div>
                          </div>
                          <section>
                            <p className="text-sm font-medium text-slate-800 mb-2">
                              {t('admin.backups.restore.checklistTitle')}
                            </p>
                            <div className="space-y-2">
                              {CHECKBOXES.map((key) => (
                                <label key={key} className="flex items-start gap-3 text-sm text-slate-700">
                                  <input
                                    type="checkbox"
                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={checklist[key]}
                                    onChange={(event) =>
                                      setChecklist((prev) => ({ ...prev, [key]: event.target.checked }))
                                    }
                                  />
                                  <span>{t(`admin.backups.restore.checklist.${key}`)}</span>
                                </label>
                              ))}
                            </div>
                          </section>
                          <section>
                            <p className="text-sm font-medium text-slate-800 mb-2">
                              {t('admin.backups.restore.recommended')}
                            </p>
                            <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                              {impact.recommendedSteps.map((stepLabel) => (
                                <li key={stepLabel}>{stepLabel}</li>
                              ))}
                            </ul>
                          </section>
                        </>
                      )}
                    </section>
                  )}

                  {step === 3 && (
                    <section className="space-y-4">
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        <p className="font-semibold">
                          {t('admin.backups.restore.confirmWarning', {
                            env: targetEnv,
                          })}
                        </p>
                        <p className="mt-1">
                          {t('admin.backups.restore.snapshotInfo', {
                            started: formatDistanceToNow(new Date(snapshot.startedAt), { addSuffix: true }),
                          })}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">
                          {t('admin.backups.restore.confirmLabel', { phrase: expectedConfirmPhrase })}
                        </label>
                        <input
                          value={confirmPhrase}
                          onChange={(event) => setConfirmPhrase(event.target.value)}
                          className="mt-1 block w-full rounded-md border border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                          placeholder={expectedConfirmPhrase}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">
                          {t('admin.backups.restore.otpLabel')}
                        </label>
                        <input
                          value={otpCode}
                          onChange={(event) => setOtpCode(event.target.value)}
                          className="mt-1 block w-full rounded-md border border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                          placeholder="123456"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          {t('admin.backups.restore.otpHint')}
                        </p>
                      </div>
                    </section>
                  )}
                </div>

        <div className="flex items-center justify-between bg-slate-50 px-6 py-4 border-t border-slate-200">
          <button
            type="button"
            className="text-sm font-medium text-slate-600 hover:text-slate-800"
            onClick={() => (!submitting ? onClose() : null)}
            disabled={submitting}
          >
            {t('common.cancel')}
          </button>
                  <div className="flex items-center gap-3">
                    {step > 1 && (
                      <button
                        type="button"
                        className="text-sm font-medium text-slate-600 hover:text-slate-800"
                        onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                        disabled={submitting}
                      >
                        {t('common.back')}
                      </button>
                    )}
                    {step < 3 && (
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed"
                        onClick={() => setStep((prev) => prev + 1)}
                        disabled={
                          (step === 1 && !canAdvanceStep1) || (step === 2 && !canAdvanceStep2) || submitting
                        }
                      >
                        {t('common.next')}
                      </button>
                    )}
                    {step === 3 && (
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-500 disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed"
                        onClick={handleSubmit}
                        disabled={!confirmMatches || submitting}
                      >
                        {submitting ? t('common.processing') : t('admin.backups.restore.confirmCta')}
                      </button>
                    )}
                  </div>
        </div>
      </div>
    </div>
  );
}
