import { useTranslation } from 'react-i18next';
import GuruBusinessAddressCard from '../business/GuruBusinessAddressCard';

export default function AddressesTab() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('profile.addresses.title')}</h3>
        <p className="mt-1 text-sm text-gray-600">{t('profile.addresses.description')}</p>
      </div>

      <GuruBusinessAddressCard />

      {/* Future: Add personal addresses here */}
      {/* <div className="mt-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">{t('profile.addresses.personal')}</h4>
        <p className="text-sm text-gray-500">Coming soon...</p>
      </div> */}
    </div>
  );
}
