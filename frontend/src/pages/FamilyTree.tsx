import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPersonsByBranch } from '../api/person';
import { getBranchById } from '../api/branch';
import { getBranchPartnerships } from '../api/partnership';
import { useToast } from '../contexts/ToastContext';
import Layout from '../components/layout/Layout';
import FamilyTreeView from '../components/tree/FamilyTreeView';
import type { Person } from '../types/person';
import type { Branch } from '../types/branch';
import type { Partnership } from '../types/partnership';

export default function FamilyTree() {
  const { branchId } = useParams<{ branchId: string }>();
  const { t } = useTranslation();
  const toast = useToast();
  const [persons, setPersons] = useState<Person[]>([]);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  useEffect(() => {
    if (branchId) {
      loadData();
    }
  }, [branchId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [personsData, branchData, partnershipsData] = await Promise.all([
        getPersonsByBranch(branchId!),
        getBranchById(branchId!),
        getBranchPartnerships(branchId!)
      ]);
      setPersons(personsData);
      setBranch(branchData);
      setPartnerships(partnershipsData);
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('persons.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handlePersonSelect = (person: Person) => {
    setSelectedPerson(person);
  };

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
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <Link to="/branches" className="hover:text-indigo-600">{t('navigation.branches')}</Link>
            <span className="mx-2">/</span>
            <Link to={`/branches/${branchId}`} className="hover:text-indigo-600">
              {branch?.surname}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{t('tree.title')}</span>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {branch?.surname} {t('tree.title')}
              </h1>
              <p className="text-gray-600 mt-1">
                {persons.length} {t('tree.peopleAcross')} {Math.max(...persons.map(p => p.generationNumber || 0), 0)} {t('tree.generations')}
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to={`/branches/${branchId}/persons`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                {t('tree.viewList')}
              </Link>
              <Link
                to={`/branches/${branchId}/persons/create`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {t('persons.create')}
              </Link>
            </div>
          </div>
        </div>

        {/* Tree Visualization */}
        {persons.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🌳</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('tree.noMembers')}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('tree.noMembersDesc')}
            </p>
            <Link
              to={`/branches/${branchId}/persons/create`}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              {t('tree.addFirstPerson')}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <FamilyTreeView persons={persons} partnerships={partnerships} onPersonSelect={handlePersonSelect} />

            {/* Selected Person Details */}
            {selectedPerson && (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{t('tree.selectedPersonTitle')}</h3>
                  <button
                    onClick={() => setSelectedPerson(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Photo and basic info */}
                  <div className="flex flex-col items-center">
                    {selectedPerson.profilePhotoUrl ? (
                      <img
                        src={selectedPerson.profilePhotoUrl}
                        alt={`${selectedPerson.firstName} ${selectedPerson.lastName}`}
                        className="w-32 h-32 rounded-full object-cover mb-4"
                      />
                    ) : (
                      <div className={`w-32 h-32 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 ${
                        selectedPerson.gender === 'male'
                          ? 'bg-blue-500'
                          : selectedPerson.gender === 'female'
                          ? 'bg-pink-500'
                          : 'bg-purple-500'
                      }`}>
                        {(selectedPerson.givenName || selectedPerson.firstName || 'U')[0]}
                        {(selectedPerson.surname || selectedPerson.lastName || 'N')[0]}
                      </div>
                    )}
                    <h4 className="text-xl font-bold text-gray-900">
                      {selectedPerson.fullName || `${selectedPerson.givenName || ''} ${selectedPerson.surname || ''}`}
                    </h4>
                    {selectedPerson.maidenName && (
                      <p className="text-sm text-gray-600">née {selectedPerson.maidenName}</p>
                    )}
                    <span className="mt-2 inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded">
                      {t('persons.generation')} {selectedPerson.generation}
                    </span>
                  </div>

                  {/* Life information */}
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-3">{t('personDetail.lifeInfo')}</h5>
                    <dl className="space-y-2 text-sm">
                      {selectedPerson.birthDate && (
                        <div>
                          <dt className="text-gray-600">{t('personDetail.born')}:</dt>
                          <dd className="text-gray-900 font-medium">
                            {new Date(selectedPerson.birthDate).toLocaleDateString()}
                            {selectedPerson.birthPlace && ` ${t('personDetail.in')} ${selectedPerson.birthPlace}`}
                          </dd>
                        </div>
                      )}
                      {!selectedPerson.isAlive && selectedPerson.deathDate && (
                        <div>
                          <dt className="text-gray-600">{t('personDetail.died')}:</dt>
                          <dd className="text-gray-900 font-medium">
                            {new Date(selectedPerson.deathDate).toLocaleDateString()}
                            {selectedPerson.deathPlace && ` ${t('personDetail.in')} ${selectedPerson.deathPlace}`}
                          </dd>
                        </div>
                      )}
                      {selectedPerson.isAlive && selectedPerson.birthDate && (
                        <div>
                          <dt className="text-gray-600">{t('personDetail.age')}:</dt>
                          <dd className="text-gray-900 font-medium">
                            {new Date().getFullYear() - new Date(selectedPerson.birthDate).getFullYear()} {t('personDetail.yearsOld')}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Family information */}
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-3">{t('personDetail.family')}</h5>
                    <dl className="space-y-2 text-sm">
                      {selectedPerson.father && (
                        <div>
                          <dt className="text-gray-600">{t('persons.father')}:</dt>
                          <dd className="text-gray-900 font-medium">
                            {selectedPerson.father.givenName || selectedPerson.father.firstName} {selectedPerson.father.surname || selectedPerson.father.lastName}
                          </dd>
                        </div>
                      )}
                      {selectedPerson.mother && (
                        <div>
                          <dt className="text-gray-600">{t('persons.mother')}:</dt>
                          <dd className="text-gray-900 font-medium">
                            {selectedPerson.mother.givenName || selectedPerson.mother.firstName} {selectedPerson.mother.surname || selectedPerson.mother.lastName}
                          </dd>
                        </div>
                      )}
                      {selectedPerson.children && selectedPerson.children.length > 0 && (
                        <div>
                          <dt className="text-gray-600">{t('persons.children')}:</dt>
                          <dd className="text-gray-900 font-medium">
                            {selectedPerson.children.map(child => (
                              <div key={child.id}>
                                {child.givenName || child.firstName} {child.surname || child.lastName}
                              </div>
                            ))}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>

                {/* Biography */}
                {selectedPerson.biography && (
                  <div className="mt-6 pt-6 border-t">
                    <h5 className="font-semibold text-gray-900 mb-2">{t('persons.biography')}</h5>
                    <p className="text-gray-700 text-sm">{selectedPerson.biography}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
