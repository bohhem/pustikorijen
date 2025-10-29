import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../layout/Layout';
import { useAuth } from '../../contexts/AuthContext';

interface AdminLayoutProps {
  title?: string;
  description?: string;
  children: ReactNode;
}

export default function AdminLayout({ title, description, children }: AdminLayoutProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const navItems = [
    {
      to: '/admin',
      label: t('admin.sections.overview'),
      icon: '📊',
      enabled: true,
    },
    {
      to: '/admin/regions',
      label: t('admin.sections.regions'),
      icon: '🗺️',
      enabled: true,
    },
    {
      to: '/admin/bridge-issues',
      label: t('admin.sections.bridgeIssues'),
      icon: '🌉',
      enabled: true,
    },
    {
      to: '/admin/users',
      label: t('admin.sections.users'),
      icon: '👥',
      enabled: false,
    },
    {
      to: '/admin/backups',
      label: t('admin.sections.backups'),
      icon: '💾',
      enabled: false,
    },
    {
      to: '/admin/activity',
      label: t('admin.sections.activity'),
      icon: '📜',
      enabled: false,
    },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-sm text-slate-500 uppercase tracking-wide">{t('admin.superGuruConsole')}</p>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">{title ?? t('admin.title')}</h1>
                {description && <p className="text-sm text-slate-600">{description}</p>}
              </div>
              {user && (
                <div className="text-sm text-slate-600">
                  <p className="font-medium text-slate-800">{user.fullName}</p>
                  <p>{t('admin.superGuruBadge')}</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
            <aside className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
              <nav className="space-y-1">
                {navItems.map((item) => (
                  item.enabled ? (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/admin'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`
                      }
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.label}</span>
                    </NavLink>
                  ) : (
                    <div
                      key={item.to}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 bg-slate-50 border border-dashed border-slate-200"
                    >
                      <span className="text-lg">{item.icon}</span>
                      <div className="flex-1">
                        <span>{item.label}</span>
                        <span className="ml-2 text-xs uppercase tracking-wide text-slate-400">{t('admin.comingSoon')}</span>
                      </div>
                    </div>
                  )
                ))}
              </nav>
            </aside>

            <main>
              <div className="space-y-6">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </Layout>
  );
}
