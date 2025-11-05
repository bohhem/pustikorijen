import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  listGuruBusinessAddresses,
  createGuruBusinessAddress,
  updateGuruBusinessAddress,
  deleteGuruBusinessAddress,
  setPrimaryGuruBusinessAddress,
} from '../../api/businessAddress';
import type { GuruBusinessAddress, UpsertGuruBusinessAddressPayload } from '../../types/businessAddress';
import GeoLocationSelector from '../geo/GeoLocationSelector';
import { useToast } from '../../contexts/ToastContext';

const normalizeNumber = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isNaN(value) ? undefined : value ?? undefined;

const normalizeString = (value?: string | null) => {
  if (value === undefined || value === null) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

type ModalMode = 'create' | 'edit';

type GuruAddressModalProps = {
  isOpen: boolean;
  mode: ModalMode;
  initialData: GuruBusinessAddress | null;
  onClose: () => void;
  onSave: (payload: UpsertGuruBusinessAddressPayload, addressId?: string) => Promise<void>;
  loading: boolean;
};

function GuruAddressModal({ isOpen, mode, initialData, onClose, onSave, loading }: GuruAddressModalProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UpsertGuruBusinessAddressPayload>({
    defaultValues: {
      geoCityId: initialData?.geoCity?.id ?? '',
      label: initialData?.label ?? '',
      addressLine1: initialData?.addressLine1 ?? '',
      addressLine2: initialData?.addressLine2 ?? '',
      postalCode: initialData?.postalCode ?? '',
      latitude: initialData?.latitude ?? undefined,
      longitude: initialData?.longitude ?? undefined,
      googleMapsPlaceId: initialData?.googleMapsPlaceId ?? '',
      googleMapsUrl: initialData?.googleMapsUrl ?? '',
      isPublic: initialData?.isPublic ?? true,
      isPrimary: initialData?.isPrimary ?? mode === 'create',
    },
  });

  const [selectedCityId, setSelectedCityId] = useState(initialData?.geoCity?.id ?? '');

  useEffect(() => {
    if (isOpen) {
      reset({
        geoCityId: initialData?.geoCity?.id ?? '',
        label: initialData?.label ?? '',
        addressLine1: initialData?.addressLine1 ?? '',
        addressLine2: initialData?.addressLine2 ?? '',
        postalCode: initialData?.postalCode ?? '',
        latitude: initialData?.latitude ?? undefined,
        longitude: initialData?.longitude ?? undefined,
        googleMapsPlaceId: initialData?.googleMapsPlaceId ?? '',
        googleMapsUrl: initialData?.googleMapsUrl ?? '',
        isPublic: initialData?.isPublic ?? true,
        isPrimary: initialData?.isPrimary ?? mode === 'create',
      });
      setSelectedCityId(initialData?.geoCity?.id ?? '');
    }
  }, [initialData, isOpen, mode, reset]);

  useEffect(() => {
    setValue('geoCityId', selectedCityId, { shouldValidate: true });
  }, [selectedCityId, setValue]);

  const handleCityChange = useCallback(
    (cityId: string | null) => {
      const id = cityId ?? '';
      setSelectedCityId(id);
      setValue('geoCityId', id, { shouldValidate: true });
    },
    [setValue],
  );

  const submit = handleSubmit(async (formValues) => {
    if (!selectedCityId) {
      setValue('geoCityId', '', { shouldValidate: true });
      return;
    }

    const payload: UpsertGuruBusinessAddressPayload = {
      ...formValues,
      geoCityId: selectedCityId,
      label: normalizeString(formValues.label) ?? null,
      addressLine1: formValues.addressLine1.trim(),
      addressLine2: normalizeString(formValues.addressLine2) ?? null,
      postalCode: normalizeString(formValues.postalCode) ?? null,
      latitude: normalizeNumber(formValues.latitude ?? undefined) ?? null,
      longitude: normalizeNumber(formValues.longitude ?? undefined) ?? null,
      googleMapsPlaceId: normalizeString(formValues.googleMapsPlaceId) ?? null,
      googleMapsUrl: normalizeString(formValues.googleMapsUrl) ?? null,
    };

    await onSave(payload, initialData?.id ?? undefined);
  });

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {mode === 'create' ? t('businessAddresses.addTitle') : t('businessAddresses.editTitle')}
            </h2>
            <p className="text-sm text-gray-500">{t('businessAddresses.modalSubtitle')}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label={t('common.close')}>
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-5 max-h-[80vh] overflow-y-auto">
          <input type="hidden" value={selectedCityId} readOnly {...register('geoCityId', { required: true })} />

          <GeoLocationSelector
            value={selectedCityId}
            onChange={handleCityChange}
            error={errors.geoCityId && t('businessAddresses.messages.locationRequired')}
            required
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('businessAddresses.form.label')}
              </label>
              <input
                type="text"
                {...register('label')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('businessAddresses.form.postalCode')}
              </label>
              <input
                type="text"
                {...register('postalCode')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('businessAddresses.form.addressLine1')} *
            </label>
            <input
              type="text"
              {...register('addressLine1', { required: t('validation.required') })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
            />
            {errors.addressLine1 && (
              <p className="mt-1 text-sm text-red-600">{errors.addressLine1.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('businessAddresses.form.addressLine2')}
            </label>
            <input
              type="text"
              {...register('addressLine2')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('businessAddresses.form.latitude')}
              </label>
              <input
                type="number"
                step="any"
                {...register('latitude', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('businessAddresses.form.longitude')}
              </label>
              <input
                type="number"
                step="any"
                {...register('longitude', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('businessAddresses.form.mapsUrl')}
              </label>
              <input
                type="url"
                {...register('googleMapsUrl')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                placeholder="https://maps.google.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('businessAddresses.form.mapsId')}
              </label>
              <input
                type="text"
                {...register('googleMapsPlaceId')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-gray-200 px-4 py-3">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" {...register('isPublic')} className="h-4 w-4 text-indigo-600" />
              {t('businessAddresses.form.isPublic')}
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" {...register('isPrimary')} className="h-4 w-4 text-indigo-600" />
              {t('businessAddresses.primaryToggle')}
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-5 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? t('common.saving') : mode === 'create' ? t('common.save') : t('common.update')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GuruBusinessAddressCard() {
  const { t } = useTranslation();
  const toast = useToast();
  const [addresses, setAddresses] = useState<GuruBusinessAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [activeAddress, setActiveAddress] = useState<GuruBusinessAddress | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refreshAddresses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listGuruBusinessAddresses();
      setAddresses(data);
    } catch (err: any) {
      setError(err.response?.data?.error || t('businessAddresses.messages.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void refreshAddresses();
  }, [refreshAddresses]);

  const handleModalClose = () => {
    setModalOpen(false);
    setActiveAddress(null);
  };

  const handleCreateClick = () => {
    setModalMode('create');
    setActiveAddress(null);
    setModalOpen(true);
  };

  const handleEditClick = (address: GuruBusinessAddress) => {
    setModalMode('edit');
    setActiveAddress(address);
    setModalOpen(true);
  };

  const handleSave = async (payload: UpsertGuruBusinessAddressPayload, addressId?: string) => {
    setModalLoading(true);
    try {
      if (addressId) {
        await updateGuruBusinessAddress(addressId, payload);
        toast.success(t('businessAddresses.messages.updateSuccess'));
      } else {
        await createGuruBusinessAddress(payload);
        toast.success(t('businessAddresses.messages.saveSuccess'));
      }
      handleModalClose();
      await refreshAddresses();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('businessAddresses.messages.saveError'));
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!window.confirm(t('businessAddresses.messages.deleteConfirm'))) {
      return;
    }

    setDeletingId(addressId);
    try {
      await deleteGuruBusinessAddress(addressId);
      toast.success(t('businessAddresses.messages.deleteSuccess'));
      await refreshAddresses();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('businessAddresses.messages.deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetPrimary = async (addressId: string) => {
    try {
      await setPrimaryGuruBusinessAddress(addressId);
      toast.success(t('businessAddresses.messages.primarySet'));
      await refreshAddresses();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('businessAddresses.messages.primaryError'));
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t('businessAddresses.guruTitle')}</h3>
          <p className="text-sm text-gray-600">{t('businessAddresses.guruSubtitle')}</p>
        </div>
        <button
          type="button"
          onClick={handleCreateClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {t('businessAddresses.addAddress')}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : addresses.length === 0 ? (
        <p className="text-sm text-gray-600">{t('businessAddresses.empty')}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => {
            const locationParts = [
              address.geoCity?.state?.name,
              address.geoCity?.region?.name,
              address.geoCity?.name,
            ].filter(Boolean);

            return (
              <div key={address.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {address.label || t('businessAddresses.defaultLabel')}
                    </p>
                    {locationParts.length > 0 && (
                      <p className="text-sm text-gray-600">{locationParts.join(' › ')}</p>
                    )}
                  </div>
                  {address.isPrimary && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                      {t('businessAddresses.currentBadge')}
                    </span>
                  )}
                </div>

                <div className="text-sm text-gray-700 space-y-1">
                  <p>{address.addressLine1}</p>
                  {address.addressLine2 && <p>{address.addressLine2}</p>}
                  {address.postalCode && <p>{address.postalCode}</p>}
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                  {address.latitude !== undefined && address.latitude !== null && (
                    <span>{t('businessAddresses.form.latitude')}: {address.latitude}</span>
                  )}
                  {address.longitude !== undefined && address.longitude !== null && (
                    <span>{t('businessAddresses.form.longitude')}: {address.longitude}</span>
                  )}
                  <span>{address.isPublic ? t('businessAddresses.visibility.public') : t('businessAddresses.visibility.private')}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!address.isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(address.id)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      {t('businessAddresses.actions.setPrimary')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleEditClick(address)}
                    className="text-xs font-medium text-gray-600 hover:text-gray-800"
                  >
                    {t('common.edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(address.id)}
                    className="text-xs font-medium text-red-600 hover:text-red-800"
                    disabled={deletingId === address.id}
                  >
                    {deletingId === address.id ? t('common.deleting') : t('common.delete')}
                  </button>
                  {address.googleMapsUrl && (
                    <a
                      href={address.googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      {t('businessAddresses.viewOnMaps')}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <GuruAddressModal
        isOpen={modalOpen}
        mode={modalMode}
        initialData={activeAddress}
        onClose={handleModalClose}
        onSave={handleSave}
        loading={modalLoading}
      />
    </div>
  );
}
