import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
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
      toast.error(err.response?.data?.error || 'Failed to load data');
    }
  };

  const onSubmit = async (data: CreatePersonInput) => {
    setLoading(true);
    try {
      await createPerson(branchId!, data);
      toast.success('Person added successfully!');
      navigate(`/branches/${branchId}/persons`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add person');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-600 mb-4">
          <Link to="/branches" className="hover:text-indigo-600">Branches</Link>
          <span className="mx-2">/</span>
          <Link to={`/branches/${branchId}`} className="hover:text-indigo-600">
            {branch?.surname}
          </Link>
          <span className="mx-2">/</span>
          <Link to={`/branches/${branchId}/persons`} className="hover:text-indigo-600">
            People
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Add Person</span>
        </div>

        <div className="bg-white shadow rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Family Member</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    {...register('firstName', { required: 'First name is required' })}
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    {...register('lastName', { required: 'Last name is required' })}
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
                  Maiden Name (if applicable)
                </label>
                <input
                  {...register('maidenName')}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center">
                    <input
                      {...register('gender', { required: 'Gender is required' })}
                      type="radio"
                      value="male"
                      className="form-radio text-indigo-600"
                    />
                    <span className="ml-2">Male</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      {...register('gender', { required: 'Gender is required' })}
                      type="radio"
                      value="female"
                      className="form-radio text-indigo-600"
                    />
                    <span className="ml-2">Female</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      {...register('gender', { required: 'Gender is required' })}
                      type="radio"
                      value="other"
                      className="form-radio text-indigo-600"
                    />
                    <span className="ml-2">Other</span>
                  </label>
                </div>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                )}
              </div>
            </div>

            {/* Life Information */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900">Life Information</h3>

              <div className="flex items-center">
                <input
                  {...register('isAlive')}
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  This person is alive
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Birth Date
                  </label>
                  <input
                    {...register('birthDate')}
                    type="date"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Birth Place
                  </label>
                  <input
                    {...register('birthPlace')}
                    type="text"
                    placeholder="City, Country"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                  />
                </div>
              </div>

              {!isAlive && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Death Date
                    </label>
                    <input
                      {...register('deathDate')}
                      type="date"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Death Place
                    </label>
                    <input
                      {...register('deathPlace')}
                      type="text"
                      placeholder="City, Country"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Parents */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900">Parents</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Father
                  </label>
                  <select
                    {...register('fatherId')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                  >
                    <option value="">Select father (optional)</option>
                    {persons
                      .filter(p => p.gender === 'male')
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.firstName} {p.lastName} (Gen {p.generation})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Mother
                  </label>
                  <select
                    {...register('motherId')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                  >
                    <option value="">Select mother (optional)</option>
                    {persons
                      .filter(p => p.gender === 'female')
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.firstName} {p.lastName} {p.maidenName && `(${p.maidenName})`} (Gen {p.generation})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Biography */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900">Biography</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Biography
                </label>
                <textarea
                  {...register('biography')}
                  rows={4}
                  placeholder="Tell us about this person..."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                />
              </div>
            </div>

            {/* Privacy */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900">Privacy</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Privacy Level
                </label>
                <select
                  {...register('privacyLevel')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                >
                  <option value="public">Public - Anyone can view</option>
                  <option value="family_only">Family Only - Only branch members</option>
                  <option value="private">Private - Only me and Gurus</option>
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
                {loading ? 'Adding...' : 'Add Person'}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/branches/${branchId}/persons`)}
                className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
