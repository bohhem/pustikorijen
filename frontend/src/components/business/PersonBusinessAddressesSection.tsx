import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createPersonBusinessAddress,
  deletePersonBusinessAddress,
  getPersonBusinessAddresses,
  updatePersonBusinessAddress,
} from '../../api/businessAddress';
import type {
  PersonBusinessAddress,
  PersonBusinessAddressPayload,
} from '../../types/businessAddress';
import { useToast } from '../../contexts/ToastContext';
import GeoLocationSelector from '../geo/GeoLocationSelector';
import { useForm } from 'react-hook-form';

interface PersonBusinessAddressesSectionProps {
  branchId: string;
  personId: string;
  canManage: boolean;
}

interface PersonBusinessAddressModalProps {
  mode: 'create' | 'edit';
  initialData?: PersonBusinessAddress;
  onClose: () => void;
  onSave: (payload: PersonBusinessAddressPayload, addressId?: string) => Promise<void>;
}

export default function PersonBusinessAddressesSection({ branchId, personId, canManage }: PersonBusinessAddressesSectionProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [addresses, setAddresses] = useState<PersonBusinessAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{ mode: 'create' | 'edit'; address?: PersonBusinessAddress } | null>(
    null
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPersonBusinessAddresses(branchId, personId);
      setAddresses(data);
    } catch (err: any) {
      setError(err.response?.data?.error || t('businessAddresses.messages.loadError'));
    } finally {
      setLoading(false);
    }
  }, [branchId, personId, t]);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  const handleSave = useCallback(
    async (payload: PersonBusinessAddressPayload, addressId?: string) => {
      try {
        if (addressId) {
          await updatePersonBusinessAddress(branchId, personId, addressId, payload);
          toast.success(t('businessAddresses.messages.saveSuccess'));
        } else {
          await createPersonBusinessAddress(branchId, personId, payload);
          toast.success(t('businessAddresses.messages.saveSuccess'));
        }
        setModalState(null);
        await loadAddresses();
      } catch (err: any) {
        toast.error(err.response?.data?.error || t('businessAddresses.messages.saveError'));
      }
    },
    [branchId, personId, loadAddresses, toast, t]
  );

  const handleDelete = useCallback(
    async (addressId: string) => {
      const confirmed = window.confirm(t('businessAddresses.messages.deleteConfirm'));
      if (!confirmed) {
        return;
      }
      setBusyId(addressId);
      try {
        await deletePersonBusinessAddress(branchId, personId, addressId);
        toast.success(t('businessAddresses.messages.deleteSuccess'));
        await loadAddresses();
      } catch (err: any) {
        toast.error(err.response?.data?.error || t('businessAddresses.messages.saveError'));
      } finally {
        setBusyId(null);
      }
    },
    [branchId, personId, loadAddresses, toast, t]
  );

  const sortedAddresses = useMemo(() => {
    return [...addresses].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  }, [addresses]);

  return (
    <section className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t('businessAddresses.person.title')}</h3>
          <p className="text-sm text-gray-600">{t('businessAddresses.person.subtitle')}</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setModalState({ mode: 'create' })}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {t('businessAddresses.person.add')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : sortedAddresses.length === 0 ? (
        <p className="text-sm text-gray-600">{t('businessAddresses.person.empty')}</p>
      ) : (
        <div className="space-y-4">
          {sortedAddresses.map((address) => (
            <div key={address.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold text-gray-900">{address.label || t('businessAddresses.person.defaultLabel')}</p>
                    {address.isPrimary && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                        {t('businessAddresses.person.primaryBadge')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {address.addressLine1}
                    {address.addressLine2 ? `, ${address.addressLine2}` : ''}
                  </p>
                  {address.geoCity?.name && (
                    <p className="text-xs text-gray-500">
                      {address.geoCity.name}
                      {address.geoCity.region?.name ? `, ${address.geoCity.region.name}` : ''}
                    </p>
                  )}
                  {address.notes && <p className="text-xs text-gray-500 mt-2">{address.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {address.googleMapsUrl && (
                    <a
                      href={address.googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      {t('businessAddresses.viewOnMaps')}
                    </a>
                  )}
                  {canManage && (
                    <>
                      <button
                        type="button"
                        onClick={() => setModalState({ mode: 'edit', address })}
                        className="text-xs text-gray-600 hover:text-gray-900"
                      >
                        {t('common.edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(address.id)}
                        disabled={busyId === address.id}
                        className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        {busyId === address.id ? t('common.loading') : t('common.delete')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalState && (
        <PersonBusinessAddressModal
          mode={modalState.mode}
          initialData={modalState.address}
          onClose={() => setModalState(null)}
          onSave={handleSave}
        />
      )}
    </section>
  );
}

function PersonBusinessAddressModal({ mode, initialData, onClose, onSave }: PersonBusinessAddressModalProps) {
  const { t } = useTranslation();
  const [selectedCityId, setSelectedCityId] = useState(initialData?.geoCity?.id ?? '');
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PersonBusinessAddressPayload>({
    defaultValues: {
      label: initialData?.label ?? '',
      addressLine1: initialData?.addressLine1 ?? '',
      addressLine2: initialData?.addressLine2 ?? '',
      postalCode: initialData?.postalCode ?? '',
      latitude: initialData?.latitude ?? undefined,
      longitude: initialData?.longitude ?? undefined,
      googleMapsPlaceId: initialData?.googleMapsPlaceId ?? '',
      googleMapsUrl: initialData?.googleMapsUrl ?? '',
      isPrimary: initialData?.isPrimary ?? mode === 'create',
      notes: initialData?.notes ?? '',
      geoCityId: initialData?.geoCity?.id ?? '',
    },
  });

  useEffect(() => {
    setValue('geoCityId', selectedCityId, { shouldValidate: true });
  }, [selectedCityId, setValue]);

  const handleCityChange = useCallback(
    (cityId: string | null) => {
      const id = cityId ?? '';
      setSelectedCityId(id);
      setValue('geoCityId', id, { shouldValidate: true });
    },
    [setValue]
  );

  const onSubmit = handleSubmit(async (payload) => {
    if (!selectedCityId) {
      setValue('geoCityId', '', { shouldValidate: true });
      return;
    }
    await onSave({ ...payload, geoCityId: selectedCityId }, initialData?.id);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {mode === 'create'
                ? t('businessAddresses.person.add')
                : t('businessAddresses.person.editTitle')}
            </h2>
            <p className="text-sm text-gray-500">{t('businessAddresses.person.modalSubtitle')}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label={t('common.close')}>
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="px-6 py-5 space-y-5 max-h-[80vh] overflow-y-auto">
          <input type="hidden" value={selectedCityId} readOnly {...register('geoCityId', { required: true })} />

          <GeoLocationSelector
            value={selectedCityId}
            onChange={handleCityChange}
            error={errors.geoCityId && t('businessAddresses.messages.locationRequired')}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700">{t('businessAddresses.form.label')}</label>
            <input
              type="text"
              {...register('label')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
            />
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
            {errors.addressLine1 && <p className="text-sm text-red-600 mt-1">{errors.addressLine1.message as string}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">{t('businessAddresses.form.addressLine2')}</label>
            <input
              type="text"
              {...register('addressLine2')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('businessAddresses.form.postalCode')}</label>
              <input
                type="text"
                {...register('postalCode')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('isPrimary')}
                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">{t('businessAddresses.person.markPrimary')}</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('businessAddresses.form.latitude')}</label>
              <input
                type="number"
                step="any"
                {...register('latitude', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('businessAddresses.form.longitude')}</label>
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
              <label className="block text-sm font-medium text-gray-700">{t('businessAddresses.form.mapsUrl')}</label>
              <input
                type="url"
                {...register('googleMapsUrl')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('businessAddresses.form.mapsId')}</label>
              <input
                type="text"
                {...register('googleMapsPlaceId')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">{t('businessAddresses.person.notes')}</label>
            <textarea
              rows={3}
              {...register('notes')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              {mode === 'create' ? t('common.create') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
