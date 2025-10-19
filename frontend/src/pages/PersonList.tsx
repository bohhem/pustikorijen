import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPersonsByBranch } from '../api/person';
import { getBranchById } from '../api/branch';
import { useToast } from '../contexts/ToastContext';
import Layout from '../components/layout/Layout';
import PersonCard from '../components/persons/PersonCard';
import type { Person } from '../types/person';
import type { Branch } from '../types/branch';

export default function PersonList() {
  const { t } = useTranslation();
  const { branchId } = useParams<{ branchId: string }>();
  const toast = useToast();
  const [persons, setPersons] = useState<Person[]>([]);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'alive' | 'deceased'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (branchId) {
      loadData();
    }
  }, [branchId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [personsData, branchData] = await Promise.all([
        getPersonsByBranch(branchId!),
        getBranchById(branchId!)
      ]);
      setPersons(personsData);
      setBranch(branchData);
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('persons.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const filteredPersons = persons.filter(person => {
    // Filter by alive/deceased
    const isAlive = person.isAlive !== false;
    if (filter === 'alive' && !isAlive) return false;
    if (filter === 'deceased' && isAlive) return false;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const fullName = (person.fullName || `${person.givenName} ${person.surname}`).toLowerCase();
      const maidenName = person.maidenName?.toLowerCase() || '';
      return fullName.includes(query) || maidenName.includes(query);
    }

    return true;
  });

  const groupedByGeneration = filteredPersons.reduce((acc, person) => {
    const gen = person.generationNumber || 1;
    if (!acc[gen]) acc[gen] = [];
    acc[gen].push(person);
    return acc;
  }, {} as Record<number, Person[]>);

  const generations = Object.keys(groupedByGeneration)
    .map(Number)
    .sort((a, b) => a - b);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <Link to="/branches" className="hover:text-indigo-600">{t('navigation.branches')}</Link>
            <span className="mx-2">/</span>
            <Link to={`/branches/${branchId}`} className="hover:text-indigo-600">
              {branch?.surname}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{t('navigation.people')}</span>
          </div>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">{t('persons.title')}</h1>
            <Link
              to={`/branches/${branchId}/persons/create`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              {t('persons.create')}
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('personList.searchPlaceholder')}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  filter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('personList.all')} ({persons.length})
              </button>
              <button
                onClick={() => setFilter('alive')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  filter === 'alive'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('personList.living')} ({persons.filter(p => p.isAlive).length})
              </button>
              <button
                onClick={() => setFilter('deceased')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  filter === 'deceased'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('personList.deceased')} ({persons.filter(p => !p.isAlive).length})
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {filteredPersons.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <p className="text-gray-600">
              {searchQuery
                ? t('personList.noResults')
                : t('persons.noPeople')}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {generations.map(gen => (
              <div key={gen} className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {t('personList.generation')} {gen}
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    ({groupedByGeneration[gen].length} {groupedByGeneration[gen].length === 1 ? t('personList.person') : t('personList.people')})
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedByGeneration[gen].map(person => (
                    <PersonCard key={person.id} person={person} branchId={branchId!} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
