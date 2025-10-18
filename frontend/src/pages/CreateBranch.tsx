import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { createBranch } from '../api/branch';
import type { CreateBranchInput } from '../types/branch';

export default function CreateBranch() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateBranchInput>();

  const onSubmit = async (data: CreateBranchInput) => {
    setError('');
    setIsLoading(true);

    try {
      const result = await createBranch(data);
      navigate(`/branches/${result.branch.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create branch');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Family Branch</h2>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="surname" className="block text-sm font-medium text-gray-700">
                Surname *
              </label>
              <input
                {...register('surname', {
                  required: 'Surname is required',
                  minLength: { value: 2, message: 'Surname must be at least 2 characters' },
                })}
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                placeholder="Hodžić"
              />
              {errors.surname && (
                <p className="mt-1 text-sm text-red-600">{errors.surname.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="cityCode" className="block text-sm font-medium text-gray-700">
                  City Code *
                </label>
                <input
                  {...register('cityCode', {
                    required: 'City code is required',
                    minLength: { value: 2, message: 'City code must be at least 2 characters' },
                  })}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border uppercase"
                  placeholder="SA"
                  maxLength={10}
                />
                {errors.cityCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.cityCode.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="cityName" className="block text-sm font-medium text-gray-700">
                  City Name *
                </label>
                <input
                  {...register('cityName', {
                    required: 'City name is required',
                    minLength: { value: 2, message: 'City name must be at least 2 characters' },
                  })}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                  placeholder="Sarajevo"
                />
                {errors.cityName && (
                  <p className="mt-1 text-sm text-red-600">{errors.cityName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700">
                Region
              </label>
              <input
                {...register('region')}
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                placeholder="Federation of Bosnia and Herzegovina"
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                Country
              </label>
              <input
                {...register('country')}
                type="text"
                defaultValue="Bosnia and Herzegovina"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                placeholder="Tell us about your family branch..."
              />
            </div>

            <div>
              <label htmlFor="visibility" className="block text-sm font-medium text-gray-700">
                Visibility
              </label>
              <select
                {...register('visibility')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
              >
                <option value="public">Public - Anyone can view</option>
                <option value="family_only">Family Only - Only members can view</option>
                <option value="private">Private - Invite only</option>
              </select>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Branch'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/branches')}
                className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
