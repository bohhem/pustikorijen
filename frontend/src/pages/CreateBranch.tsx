import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { createBranch } from '../api/branch';
import Layout from '../components/layout/Layout';
import GeoLocationSelector from '../components/geo/GeoLocationSelector';
import type { CreateBranchInput } from '../types/branch';

export default function CreateBranch() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateBranchInput>({
    defaultValues: {
      visibility: 'public',
    },
  });

  const handleCityChange = useCallback(
    (cityId: string | null) => {
      const id = cityId ?? '';
      setSelectedCityId(id);
      setValue('geoCityId', id, { shouldValidate: true });
    },
    [setValue]
  );

  const onSubmit = async (data: CreateBranchInput) => {
    setError('');
    setIsSubmitting(true);

    try {
      const result = await createBranch(data);
      navigate(`/branches/${result.branch.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || t('branches.createError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('createBranch.title')}</h2>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="surname" className="block text-sm font-medium text-gray-700">
                {t('createBranch.surname')} *
              </label>
              <input
                {...register('surname', {
                  required: t('validation.required'),
                  minLength: { value: 2, message: t('createBranch.surnameMinLength') },
                })}
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
              />
              {errors.surname && (
                <p className="mt-1 text-sm text-red-600">{errors.surname.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <input
                type="hidden"
                value={selectedCityId}
                readOnly
                {...register('geoCityId', { required: t('createBranch.locationRequired') })}
              />
              <GeoLocationSelector
                value={selectedCityId}
                onChange={handleCityChange}
                error={errors.geoCityId?.message}
                required
                title={t('createBranch.locationSectionTitle')}
                description={t('createBranch.locationDescription')}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                {t('branches.description')}
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                placeholder={t('createBranch.descriptionPlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="visibility" className="block text-sm font-medium text-gray-700">
                {t('createBranch.visibility')}
              </label>
              <select
                {...register('visibility')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
              >
                <option value="public">{t('createBranch.visibilityPublic')}</option>
                <option value="family_only">{t('createBranch.visibilityFamilyOnly')}</option>
                <option value="private">{t('createBranch.visibilityPrivate')}</option>
              </select>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSubmitting ? t('createBranch.creating') : t('branches.create')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/branches')}
                className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
