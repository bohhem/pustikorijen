import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
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
      toast.error(err.response?.data?.error || 'Failed to load data');
    }
  };

  const onSubmit = async (data: CreatePartnershipInput) => {
    setLoading(true);
    try {
      await createPartnership(branchId!, data);
      toast.success('Partnership added successfully!');
      navigate(`/branches/${branchId}/persons`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create partnership');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Add Partnership</h1>
          <p className="text-gray-600 mt-2">
            {branch?.surname} Family Branch
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow rounded-lg p-6 space-y-6">
          {/* Partners */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Person 1 *
              </label>
              <select
                {...register('person1Id', { required: 'Person 1 is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
              >
                <option value="">Select person</option>
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
                Person 2 *
              </label>
              <select
                {...register('person2Id', { required: 'Person 2 is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
              >
                <option value="">Select person</option>
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
              Partnership Type
            </label>
            <select
              {...register('partnershipType')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
            >
              <option value="marriage">Marriage</option>
              <option value="domestic_partnership">Domestic Partnership</option>
              <option value="common_law">Common Law</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Start Date & Place */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                {...register('startDate')}
                type="date"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Start Place
              </label>
              <input
                {...register('startPlace')}
                type="text"
                placeholder="City, Country"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
              />
            </div>
          </div>

          {/* Ceremony Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ceremony Type
            </label>
            <input
              {...register('ceremonyType')}
              type="text"
              placeholder="e.g., Religious, Civil, Traditional"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              {...register('status')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
            >
              <option value="active">Active</option>
              <option value="ended">Ended</option>
              <option value="annulled">Annulled</option>
            </select>
          </div>

          {/* End Date & Place (if not active) */}
          {status !== 'active' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    {...register('endDate')}
                    type="date"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    End Place
                  </label>
                  <input
                    {...register('endPlace')}
                    type="text"
                    placeholder="City, Country"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  End Reason
                </label>
                <select
                  {...register('endReason')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                >
                  <option value="">Select reason</option>
                  <option value="divorce">Divorce</option>
                  <option value="death">Death</option>
                  <option value="separation">Separation</option>
                  <option value="annulment">Annulment</option>
                </select>
              </div>
            </>
          )}

          {/* Order Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Marriage Number
            </label>
            <input
              {...register('orderNumber', { valueAsNumber: true, min: 1 })}
              type="number"
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
            />
            <p className="mt-1 text-sm text-gray-500">
              1 for first marriage, 2 for second, etc.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Additional information..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
            />
          </div>

          {/* Privacy */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Privacy
            </label>
            <select
              {...register('visibility')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
            >
              <option value="public">Public - Anyone can view</option>
              <option value="family_only">Family Only - Branch members only</option>
              <option value="private">Private - Only me and Gurus</option>
            </select>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Partnership'}
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
    </Layout>
  );
}
