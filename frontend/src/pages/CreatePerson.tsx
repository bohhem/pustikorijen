import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { createPerson, getPersonsByBranch } from '../api/person';
import { getBranchById } from '../api/branch';
import { useToast } from '../contexts/ToastContext';
import Layout from '../components/layout/Layout';
import type { CreatePersonInput, Person } from '../types/person';
import type { Branch } from '../types/branch';

export default function CreatePerson() {
  const { branchId } = useParams<{ branchId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [persons, setPersons] = useState<Person[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreatePersonInput>({
    defaultValues: {
      isAlive: true,
      privacyLevel: 'family_only',
    },
  });

  const isAlive = watch('isAlive');

  useEffect(() => {
    if (branchId) {
      loadData();
    }
  }, [branchId]);

  const loadData = async () => {
    try {
      const [branchData, personsData] = await Promise.all([
        getBranchById(branchId!),
        getPersonsByBranch(branchId!),
      ]);
      setBranch(branchData);
      setPersons(personsData);
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('createPerson.loadDataError'));
    }
  };

  const onSubmit = async (data: CreatePersonInput) => {
    setLoading(true);
    try {
      await createPerson(branchId!, data);
      toast.success(t('persons.createSuccess'));
      navigate(`/branches/${branchId}/persons`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('persons.createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-600 mb-4">
          <Link to="/branches" className="hover:text-indigo-600">{t('navigation.branches')}</Link>
          <span className="mx-2">/</span>
          <Link to={`/branches/${branchId}`} className="hover:text-indigo-600">
            {branch?.surname}
          </Link>
          <span className="mx-2">/</span>
          <Link to={`/branches/${branchId}/persons`} className="hover:text-indigo-600">
            {t('createPerson.breadcrumbPeople')}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{t('createPerson.breadcrumbAddPerson')}</span>
        </div>

        <div className="bg-white shadow rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('createPerson.title')}</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('createPerson.basicInfo')}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('persons.firstName')} *
                  </label>
                  <input
                    {...register('firstName', { required: t('persons.firstNameRequired') })}
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('persons.lastName')} *
                  </label>
                  <input
                    {...register('lastName', { required: t('persons.lastNameRequired') })}
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('persons.maidenName')} ({t('persons.maidenNameHint')})
                </label>
                <input
                  {...register('maidenName')}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('persons.gender')} *
                </label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center">
                    <input
                      {...register('gender', { required: t('persons.genderRequired') })}
                      type="radio"
                      value="male"
                      className="form-radio text-indigo-600"
                    />
                    <span className="ml-2">{t('persons.male')}</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      {...register('gender', { required: t('persons.genderRequired') })}
                      type="radio"
                      value="female"
                      className="form-radio text-indigo-600"
                    />
                    <span className="ml-2">{t('persons.female')}</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      {...register('gender', { required: t('persons.genderRequired') })}
                      type="radio"
                      value="other"
                      className="form-radio text-indigo-600"
                    />
                    <span className="ml-2">{t('persons.other')}</span>
                  </label>
                </div>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                )}
              </div>
            </div>

            {/* Life Information */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900">{t('createPerson.lifeInfo')}</h3>

              <div className="flex items-center">
                <input
                  {...register('isAlive')}
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  {t('persons.thisPersonIsAlive')}
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('persons.birthDate')}
                  </label>
                  <input
                    {...register('birthDate')}
                    type="date"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('persons.birthPlace')}
                  </label>
                  <input
                    {...register('birthPlace')}
                    type="text"
                    placeholder={t('persons.placeholderCityCountry')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                  />
                </div>
              </div>

              {!isAlive && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('persons.deathDate')}
                    </label>
                    <input
                      {...register('deathDate')}
                      type="date"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('persons.deathPlace')}
                    </label>
                    <input
                      {...register('deathPlace')}
                      type="text"
                      placeholder={t('persons.placeholderCityCountry')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Parents */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900">{t('createPerson.parents')}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('persons.father')}
                  </label>
                  <select
                    {...register('fatherId')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                  >
                    <option value="">{t('persons.selectFather')}</option>
                    {persons
                      .filter(p => p.gender === 'male')
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.firstName} {p.lastName} ({t('personDetail.gen')} {p.generation})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('persons.mother')}
                  </label>
                  <select
                    {...register('motherId')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                  >
                    <option value="">{t('persons.selectMother')}</option>
                    {persons
                      .filter(p => p.gender === 'female')
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.firstName} {p.lastName} {p.maidenName && `(${p.maidenName})`} ({t('personDetail.gen')} {p.generation})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Biography */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900">{t('persons.biography')}</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('persons.biography')}
                </label>
                <textarea
                  {...register('biography')}
                  rows={4}
                  placeholder={t('persons.biographyPlaceholder')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                />
              </div>
            </div>

            {/* Privacy */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900">{t('createPerson.privacy')}</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('persons.privacyLevel')}
                </label>
                <select
                  {...register('privacyLevel')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                >
                  <option value="public">{t('persons.public')} - {t('persons.publicDesc')}</option>
                  <option value="family_only">{t('persons.familyOnly')} - {t('persons.familyOnlyDesc')}</option>
                  <option value="private">{t('persons.private')} - {t('persons.privateDesc')}</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? t('createPerson.adding') : t('createPerson.addPerson')}
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
      </div>
    </Layout>
  );
}
