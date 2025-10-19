import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { createPartnership } from '../api/partnership';
import { getPersonsByBranch } from '../api/person';
import { getBranchById } from '../api/branch';
import { useToast } from '../contexts/ToastContext';
import Layout from '../components/layout/Layout';
import type { Person } from '../types/person';
import type { Branch } from '../types/branch';
import type { CreatePartnershipInput } from '../types/partnership';

export default function AddPartnership() {
  const { branchId, personId } = useParams<{ branchId: string; personId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const [persons, setPersons] = useState<Person[]>([]);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CreatePartnershipInput>({
    defaultValues: {
      person1Id: personId || '',
      partnershipType: 'marriage',
      status: 'active',
      visibility: 'family_only',
      orderNumber: 1,
    },
  });

  const status = watch('status');

  useEffect(() => {
    if (branchId) {
      loadData();
    }
  }, [branchId]);

  const loadData = async () => {
    try {
      const [personsData, branchData] = await Promise.all([
        getPersonsByBranch(branchId!),
        getBranchById(branchId!),
      ]);
      setPersons(personsData);
      setBranch(branchData);
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('partnerships.loadDataError'));
    }
  };

  const onSubmit = async (data: CreatePartnershipInput) => {
    setLoading(true);
    try {
      await createPartnership(branchId!, data);
      toast.success(t('partnerships.createSuccess'));
      navigate(`/branches/${branchId}/persons`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('partnerships.createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('partnerships.add')}</h1>
          <p className="text-gray-600 mt-2">
            {branch?.surname} {t('branchDetail.family')}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow rounded-lg p-6 space-y-6">
          {/* Partners */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('partnerships.person1')} *
              </label>
              <select
                {...register('person1Id', { required: t('partnerships.person1Required') })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
              >
                <option value="">{t('partnerships.selectPerson')}</option>
                {persons.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.fullName || `${person.givenName} ${person.surname}`}
                    {person.maidenName && ` (${person.maidenName})`}
                  </option>
                ))}
              </select>
              {errors.person1Id && (
                <p className="mt-1 text-sm text-red-600">{errors.person1Id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('partnerships.person2')} *
              </label>
              <select
                {...register('person2Id', { required: t('partnerships.person2Required') })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
              >
                <option value="">{t('partnerships.selectPerson')}</option>
                {persons.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.fullName || `${person.givenName} ${person.surname}`}
                    {person.maidenName && ` (${person.maidenName})`}
                  </option>
                ))}
              </select>
              {errors.person2Id && (
                <p className="mt-1 text-sm text-red-600">{errors.person2Id.message}</p>
              )}
            </div>
          </div>

          {/* Partnership Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('partnerships.partnershipType')}
            </label>
            <select
              {...register('partnershipType')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
            >
              <option value="marriage">{t('partnerships.marriage')}</option>
              <option value="domestic_partnership">{t('partnerships.domesticPartnership')}</option>
              <option value="common_law">{t('partnerships.commonLaw')}</option>
              <option value="other">{t('partnerships.other')}</option>
            </select>
          </div>

          {/* Start Date & Place */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('partnerships.startDate')}
              </label>
              <input
                {...register('startDate')}
                type="date"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('partnerships.startPlace')}
              </label>
              <input
                {...register('startPlace')}
                type="text"
                placeholder={t('persons.placeholderCityCountry')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
              />
            </div>
          </div>

          {/* Ceremony Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('partnerships.ceremonyType')}
            </label>
            <input
              {...register('ceremonyType')}
              type="text"
              placeholder={t('partnerships.ceremonyTypePlaceholder')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('partnerships.status')}
            </label>
            <select
              {...register('status')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
            >
              <option value="active">{t('partnerships.active')}</option>
              <option value="ended">{t('partnerships.ended')}</option>
              <option value="annulled">{t('partnerships.annulled')}</option>
            </select>
          </div>

          {/* End Date & Place (if not active) */}
          {status !== 'active' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('partnerships.endDate')}
                  </label>
                  <input
                    {...register('endDate')}
                    type="date"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('partnerships.endPlace')}
                  </label>
                  <input
                    {...register('endPlace')}
                    type="text"
                    placeholder={t('persons.placeholderCityCountry')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('partnerships.endReason')}
                </label>
                <select
                  {...register('endReason')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                >
                  <option value="">{t('partnerships.selectReason')}</option>
                  <option value="divorce">{t('partnerships.divorce')}</option>
                  <option value="death">{t('partnerships.death')}</option>
                  <option value="separation">{t('partnerships.separation')}</option>
                  <option value="annulment">{t('partnerships.annulment')}</option>
                </select>
              </div>
            </>
          )}

          {/* Order Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('partnerships.marriageOrder')}
            </label>
            <input
              {...register('orderNumber', { valueAsNumber: true, min: 1 })}
              type="number"
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
            />
            <p className="mt-1 text-sm text-gray-500">
              {t('partnerships.marriageOrderHint')}
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('partnerships.notes')}
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder={t('partnerships.notesPlaceholder')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
            />
          </div>

          {/* Privacy */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('partnerships.privacy')}
            </label>
            <select
              {...register('visibility')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
            >
              <option value="public">{t('persons.public')} - {t('persons.publicDesc')}</option>
              <option value="family_only">{t('persons.familyOnly')} - {t('persons.familyOnlyDesc')}</option>
              <option value="private">{t('persons.private')} - {t('persons.privateDesc')}</option>
            </select>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? t('partnerships.creating') : t('partnerships.createPartnership')}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/branches/${branchId}/persons`)}
              className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
