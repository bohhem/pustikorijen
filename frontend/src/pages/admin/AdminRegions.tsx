import { useTranslation } from 'react-i18next';
import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminRegions() {
  const { t } = useTranslation();

  return (
    <AdminLayout title={t('admin.sections.regions')} description={t('admin.manageRegions.subtitle')}>
      <div className="bg-white border border-dashed border-slate-200 rounded-xl p-10 text-center text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl">🗺️</span>
          <h2 className="text-lg font-semibold text-slate-800">{t('admin.sections.regions')}</h2>
          <p className="max-w-xl text-sm">{t('admin.regionsComingSoon')}</p>
        </div>
      </div>
    </AdminLayout>
  );
}
