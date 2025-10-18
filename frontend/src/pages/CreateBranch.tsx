import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { createBranch } from '../api/branch';
import type { CreateBranchInput } from '../types/branch';

export default function CreateBranch() {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
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
      setError(err.response?.data?.error || 'Failed to create branch. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Family Branch</h1>
          <p className="text-gray-600 mb-8">
            Start your family tree by creating a new branch for your surname and city of origin.
          </p>

          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="text-sm text-red-700">{error}</div>
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g., Hodžić"
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
                    maxLength: { value: 10, message: 'City code must be at most 10 characters' },
                  })}
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., SA"
                />
                {errors.cityCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.cityCode.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">2-10 characters (e.g., SA for Sarajevo)</p>
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., Sarajevo"
                />
                {errors.cityName && (
                  <p className="mt-1 text-sm text-red-600">{errors.cityName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700">
                Region (Optional)
              </label>
              <input
                {...register('region')}
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g., Kanton Sarajevo"
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                Country
              </label>
              <input
                {...register('country')}
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Bosnia and Herzegovina"
                defaultValue="Bosnia and Herzegovina"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Tell us about your family branch, its history, or any special information..."
              />
            </div>

            <div>
              <label htmlFor="visibility" className="block text-sm font-medium text-gray-700">
                Visibility
              </label>
              <select
                {...register('visibility')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="public">Public - Anyone can view</option>
                <option value="family_only">Family Only - Only members can view</option>
                <option value="private">Private - Only you can view</option>
              </select>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create Branch'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/branches')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
