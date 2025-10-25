import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { getGuruBusinessAddress, saveGuruBusinessAddress } from '../../api/businessAddress';
import type { GuruBusinessAddress, UpsertGuruBusinessAddressPayload } from '../../types/businessAddress';
import { useToast } from '../../contexts/ToastContext';
import GeoLocationSelector from '../geo/GeoLocationSelector';

export default function GuruBusinessAddressCard() {
  const { t } = useTranslation();
  const toast = useToast();
  const [address, setAddress] = useState<GuruBusinessAddress | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<UpsertGuruBusinessAddressPayload>({
    defaultValues: {
      label: '',
      addressLine1: '',
      addressLine2: '',
      postalCode: '',
      latitude: undefined,
      longitude: undefined,
      googleMapsPlaceId: '',
      googleMapsUrl: '',
      isPublic: true,
      geoCityId: '',
    },
  });

  const loadAddress = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getGuruBusinessAddress();
      setAddress(data);
      reset({
        label: data?.label ?? '',
        addressLine1: data?.addressLine1 ?? '',
        addressLine2: data?.addressLine2 ?? '',
        postalCode: data?.postalCode ?? '',
        latitude: data?.latitude ?? undefined,
        longitude: data?.longitude ?? undefined,
        googleMapsPlaceId: data?.googleMapsPlaceId ?? '',
        googleMapsUrl: data?.googleMapsUrl ?? '',
        isPublic: data?.isPublic ?? true,
        geoCityId: data?.geoCity?.id ?? '',
      });
      setSelectedCityId(data?.geoCity?.id ?? '');
    } catch (err: any) {
      setError(err.response?.data?.error || t('businessAddresses.messages.loadError'));
    } finally {
      setLoading(false);
    }
  }, [reset, t]);

  useEffect(() => {
    void loadAddress();
  }, [loadAddress]);

  const handleCityChange = useCallback(
    (cityId: string | null) => {
      const id = cityId ?? '';
      setSelectedCityId(id);
      setValue('geoCityId', id, { shouldValidate: true });
    },
    [setValue]
  );

  const onSubmit = handleSubmit(async (formValues) => {
    if (!selectedCityId) {
      setValue('geoCityId', '', { shouldValidate: true });
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: UpsertGuruBusinessAddressPayload = {
        ...formValues,
        geoCityId: selectedCityId,
        addressLine1: formValues.addressLine1.trim(),
      };
      const result = await saveGuruBusinessAddress(payload);
      setAddress(result);
      toast.success(t('businessAddresses.messages.saveSuccess'));
    } catch (err: any) {
      setError(err.response?.data?.error || t('businessAddresses.messages.saveError'));
    } finally {
      setSaving(false);
    }
  });

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t('businessAddresses.guruTitle')}</h3>
          <p className="text-sm text-gray-600">{t('businessAddresses.guruSubtitle')}</p>
        </div>
        {address?.googleMapsUrl && (
          <a
            href={address.googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            {t('businessAddresses.viewOnMaps')}
          </a>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 space-y-5">
          <input type="hidden" value={selectedCityId} readOnly {...register('geoCityId', { required: true })} />

          <GeoLocationSelector
            value={selectedCityId}
            onChange={handleCityChange}
            error={errors.geoCityId && t('businessAddresses.messages.locationRequired')}
            title={t('businessAddresses.locationTitle')}
            description={t('businessAddresses.locationDescription')}
            required
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('businessAddresses.form.label')}</label>
              <input
                type="text"
                {...register('label')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('businessAddresses.form.postalCode')}</label>
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
                placeholder="https://maps.google.com/..."
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

          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-700">{t('businessAddresses.form.isPublic')}</p>
              <p className="text-xs text-gray-500">{t('businessAddresses.form.isPublicHint')}</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <span className="mr-3 text-sm text-gray-600">{t('businessAddresses.form.share')}</span>
              <input
                type="checkbox"
                {...register('isPublic')}
                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {saving ? t('common.saving') : t('businessAddresses.form.save')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
