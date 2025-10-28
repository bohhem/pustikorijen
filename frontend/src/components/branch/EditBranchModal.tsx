import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GeoLocationSelector from '../geo/GeoLocationSelector';
import type { Branch, UpdateBranchInput } from '../../types/branch';

interface EditBranchModalProps {
  branch: Branch;
  open: boolean;
  onClose: () => void;
  onSave: (payload: UpdateBranchInput) => Promise<void>;
}

export default function EditBranchModal({ branch, open, onClose, onSave }: EditBranchModalProps) {
  const { t } = useTranslation();
  const [description, setDescription] = useState(branch.description ?? '');
  const [visibility, setVisibility] = useState<'public' | 'family_only' | 'private'>(branch.visibility);
  const [selectedCityId, setSelectedCityId] = useState<string>(branch.geoCityId ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }
    setDescription(branch.description ?? '');
    setVisibility(branch.visibility);
    setSelectedCityId(branch.geoCityId ?? '');
    setError('');
  }, [branch, open]);

  const currentLocationLabel = useMemo(() => {
    if (!branch.cityName) {
      return t('branchDetail.edit.locationUnknown');
    }
    if (branch.region) {
      return `${branch.cityName}, ${branch.region}`;
    }
    return branch.cityName;
  }, [branch.cityName, branch.region, t]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const payload: UpdateBranchInput = {};
    const normalizedDescription = description.trim();
    const initialDescription = branch.description ?? '';

    if (description !== initialDescription) {
      payload.description = normalizedDescription.length > 0 ? normalizedDescription : null;
    }

    if (visibility !== branch.visibility) {
      payload.visibility = visibility;
    }

    const normalizedCityId = selectedCityId || undefined;
    const initialCityId = branch.geoCityId ?? undefined;
    if (normalizedCityId !== undefined && normalizedCityId !== initialCityId) {
      payload.geoCityId = normalizedCityId;
    }

    if (Object.keys(payload).length === 0) {
      setError(t('branchDetail.edit.noChanges'));
      return;
    }

    setSaving(true);
    try {
      await onSave(payload);
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.message ||
        t('branchDetail.edit.generalError');
      setError(message);
      return;
    } finally {
      setSaving(false);
    }
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !saving) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={handleOverlayClick}>
      <div className="bg-white sm:rounded-2xl rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden max-h-[95vh] flex flex-col">
        {/* Sticky Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex items-start justify-between bg-white flex-shrink-0">
          <div className="flex-1 min-w-0 mr-2">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{t('branchDetail.edit.title', { branch: branch.surname })}</h3>
            <p className="text-xs sm:text-sm text-gray-500">{t('branchDetail.edit.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 transition disabled:opacity-50 p-2 -mr-2 touch-manipulation flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('branchDetail.edit.descriptionLabel')}
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
              maxLength={5000}
              placeholder={t('createBranch.descriptionPlaceholder')}
            />
            <p className="mt-1 text-xs text-gray-400">
              {t('branchDetail.edit.descriptionHelp')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('branchDetail.edit.visibilityLabel')}
              </label>
              <select
                value={visibility}
                onChange={(event) => setVisibility(event.target.value as 'public' | 'family_only' | 'private')}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white text-base"
                disabled={saving}
              >
                <option value="public">{t('createBranch.visibilityPublic')}</option>
                <option value="family_only">{t('createBranch.visibilityFamilyOnly')}</option>
                <option value="private">{t('createBranch.visibilityPrivate')}</option>
              </select>
              <p className="mt-1 text-xs text-gray-400">{t('branchDetail.edit.visibilityHelp')}</p>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <p className="text-sm font-semibold text-indigo-900">{t('branchDetail.edit.currentLocation')}</p>
              <p className="text-sm text-indigo-700 break-words">{currentLocationLabel}</p>
              <p className="mt-2 text-xs text-indigo-500">{t('branchDetail.edit.locationHint')}</p>
            </div>
          </div>

          <div className="space-y-3">
            <GeoLocationSelector
              value={selectedCityId || undefined}
              onChange={(cityId) => setSelectedCityId(cityId ?? '')}
              disabled={saving}
              title={t('branchDetail.edit.locationTitle')}
              description={t('branchDetail.edit.locationDescription')}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          </div>

          {/* Sticky Footer with Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 border-t border-gray-100 px-4 sm:px-6 py-4 bg-white flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50 touch-manipulation w-full sm:w-auto"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm disabled:opacity-50 touch-manipulation w-full sm:w-auto"
            >
              {saving ? t('branchDetail.edit.saving') : t('branchDetail.edit.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
