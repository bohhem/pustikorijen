import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/layout/Layout';
import AboutTab from '../components/profile/AboutTab';
import AddressesTab from '../components/profile/AddressesTab';
import MyBranchesTab from '../components/profile/MyBranchesTab';

type TabId = 'about' | 'addresses' | 'branches';

export default function Profile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('about');

  if (!user) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-center text-gray-600">{t('profile.notLoggedIn')}</p>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'about' as TabId, label: t('profile.tabs.about') },
    { id: 'addresses' as TabId, label: t('profile.tabs.addresses') },
    { id: 'branches' as TabId, label: t('profile.tabs.myBranches') },
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('profile.title')}</h1>
          <p className="mt-2 text-gray-600">{t('profile.subtitle')}</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'about' && <AboutTab />}
          {activeTab === 'addresses' && <AddressesTab />}
          {activeTab === 'branches' && <MyBranchesTab />}
        </div>
      </div>
    </Layout>
  );
}
