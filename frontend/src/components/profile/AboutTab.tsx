import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface ProfileFormData {
  fullName: string;
  birthYear?: number | null;
  currentLocation?: string;
  preferredLanguage: string;
}

export default function AboutTab() {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    defaultValues: {
      fullName: user?.fullName || '',
      birthYear: user?.birthYear || null,
      currentLocation: user?.currentLocation || '',
      preferredLanguage: user?.preferredLanguage || 'bs',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      await updateProfile({
        fullName: data.fullName,
        birthYear: data.birthYear || undefined,
        currentLocation: data.currentLocation || undefined,
        preferredLanguage: data.preferredLanguage,
      });

      toast.success(t('profile.messages.saveSuccess'));
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      toast.error(err.response?.data?.error || t('profile.messages.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-';

  return (
    <div className="space-y-6">
      {/* Read-only info card */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-4">{t('profile.accountInfo')}</h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-gray-500">{t('profile.email')}</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">{t('profile.memberSince')}</dt>
            <dd className="mt-1 text-sm text-gray-900">{memberSince}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">{t('profile.globalRole')}</dt>
            <dd className="mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {user.globalRole}
              </span>
            </dd>
          </div>
          {user.emailVerified && (
            <div>
              <dt className="text-xs text-gray-500">{t('profile.emailStatus')}</dt>
              <dd className="mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {t('profile.verified')}
                </span>
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Editable form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('profile.personalInfo')}</h3>

        <div className="space-y-5">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
              {t('profile.fullName')} *
            </label>
            <input
              {...register('fullName', { required: t('validation.required') })}
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
            )}
          </div>

          {/* Birth Year */}
          <div>
            <label htmlFor="birthYear" className="block text-sm font-medium text-gray-700">
              {t('profile.birthYear')}
            </label>
            <input
              {...register('birthYear', {
                valueAsNumber: true,
                min: { value: 1900, message: t('profile.birthYearMin') },
                max: { value: new Date().getFullYear(), message: t('profile.birthYearMax') },
              })}
              type="number"
              placeholder="1980"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
            />
            {errors.birthYear && (
              <p className="mt-1 text-sm text-red-600">{errors.birthYear.message}</p>
            )}
          </div>

          {/* Current Location */}
          <div>
            <label htmlFor="currentLocation" className="block text-sm font-medium text-gray-700">
              {t('profile.currentLocation')}
            </label>
            <input
              {...register('currentLocation')}
              type="text"
              placeholder={t('profile.locationPlaceholder')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
            />
          </div>

          {/* Preferred Language */}
          <div>
            <label htmlFor="preferredLanguage" className="block text-sm font-medium text-gray-700">
              {t('profile.preferredLanguage')} *
            </label>
            <select
              {...register('preferredLanguage', { required: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border bg-white"
            >
              <option value="bs">Bosanski (BS)</option>
              <option value="en">English (EN)</option>
              <option value="de">Deutsch (DE)</option>
            </select>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={!isDirty || isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
