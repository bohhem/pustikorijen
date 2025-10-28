import { useState, useEffect, useMemo, type MouseEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPersonsByBranch, getPersonById, claimPerson } from '../api/person';
import { getBranchById, getMultiBranchTree } from '../api/branch';
import { getBranchPartnerships } from '../api/partnership';
import { useToast } from '../contexts/ToastContext';
import Layout from '../components/layout/Layout';
import FamilyTreeView from '../components/tree/FamilyTreeView';
import MultiBranchTreeView from '../components/tree/MultiBranchTreeView';
import type { Person } from '../types/person';
import type { Branch, MultiBranchTreeResponse } from '../types/branch';
import type { Partnership } from '../types/partnership';
import { orderPersonsByPartnerPairing } from '../utils/personOrdering';

export default function FamilyTree() {
  const { branchId } = useParams<{ branchId: string }>();
  const { t } = useTranslation();
  const toast = useToast();
  const [persons, setPersons] = useState<Person[]>([]);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [multiBranchView, setMultiBranchView] = useState(false);
  const [multiBranchData, setMultiBranchData] = useState<MultiBranchTreeResponse | null>(null);
  const [loadingMultiBranch, setLoadingMultiBranch] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [selectedLoading, setSelectedLoading] = useState(false);

  const orderedPartnerData = useMemo(
    () => orderPersonsByPartnerPairing(persons, partnerships),
    [persons, partnerships]
  );

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
      const ordered = orderPersonsByPartnerPairing(personsData, partnershipsData);
      setPersons(ordered.orderedPersons);
      setBranch(branchData);
      setPartnerships(partnershipsData);
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('persons.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const loadMultiBranchData = async () => {
    setLoadingMultiBranch(true);
    try {
      const data = await getMultiBranchTree(branchId!);
      setMultiBranchData(data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load multi-branch tree');
    } finally {
      setLoadingMultiBranch(false);
    }
  };

  const handleToggleMultiBranch = async () => {
    if (!multiBranchView && !multiBranchData) {
      await loadMultiBranchData();
    }
    setMultiBranchView(!multiBranchView);
  };

  const handlePersonSelect = async (person: Person | any) => {
    if (!branchId) return;
    setSelectedLoading(true);
    try {
      const detail = await getPersonById(branchId, person.id);
      setSelectedPerson(detail);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t('personDetail.notFound'));
    } finally {
      setSelectedLoading(false);
    }
  };

  const closeSelectedPanel = () => setSelectedPerson(null);
  const preventOverlayClose = (event: MouseEvent) => event.stopPropagation();

  const handleClaimSelected = async () => {
    if (!branchId || !selectedPerson) return;
    const message = window.prompt(t('personDetail.claimPrompt') || '', '');
    setClaimingId(selectedPerson.id);
    try {
      await claimPerson(branchId, selectedPerson.id, message || undefined);
      toast.success(t('personDetail.claimSuccess'));
      await loadData();
      const detail = await getPersonById(branchId, selectedPerson.id);
      setSelectedPerson(detail);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t('personDetail.claimError'));
    } finally {
      setClaimingId(null);
    }
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
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-200 ease-out ${
          selectedPerson ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSelectedPanel}
        aria-hidden={!selectedPerson}
      >
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
        <div
          className={`absolute top-16 left-1/2 w-full max-w-4xl px-4 transform -translate-x-1/2 transition-transform duration-300 ease-out ${
            selectedPerson || selectedLoading ? 'translate-y-0' : '-translate-y-6'
          }`}
          onClick={preventOverlayClose}
          role="dialog"
          aria-modal={selectedPerson ? 'true' : 'false'}
        >
          {selectedLoading ? (
            <div className="bg-white shadow-2xl rounded-lg p-6 flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : selectedPerson ? (
            <div className="bg-white shadow-2xl rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">{t('tree.selectedPersonTitle')}</h3>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/branches/${branchId}/persons/${selectedPerson.id}/edit`}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    {t('personDetail.editPerson')}
                  </Link>
                  {selectedPerson.canBeClaimed && (
                    <button
                      type="button"
                      onClick={handleClaimSelected}
                      disabled={claimingId === selectedPerson.id}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {claimingId === selectedPerson.id ? t('common.loading') : t('personDetail.claimButton')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={closeSelectedPanel}
                    className="rounded-full p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-label={t('common.close')}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center">
                  {selectedPerson.profilePhotoUrl ? (
                    <img
                      src={selectedPerson.profilePhotoUrl}
                      alt={`${selectedPerson.firstName} ${selectedPerson.lastName}`}
                      className="w-32 h-32 rounded-full object-cover mb-4"
                    />
                  ) : (
                    <div
                      className={`w-32 h-32 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 ${
                        selectedPerson.gender === 'male'
                          ? 'bg-blue-500'
                          : selectedPerson.gender === 'female'
                          ? 'bg-pink-500'
                          : 'bg-purple-500'
                      }`}
                    >
                      {(selectedPerson.givenName || selectedPerson.firstName || 'U')[0]}
                      {(selectedPerson.surname || selectedPerson.lastName || 'N')[0]}
                    </div>
                  )}
                  <h4 className="text-xl font-bold text-gray-900">
                    {selectedPerson.fullName || `${selectedPerson.givenName || ''} ${selectedPerson.surname || ''}`}
                  </h4>
                  {selectedPerson.maidenName && (
                    <p className="text-sm text-gray-600">{t('personDetail.nee')} {selectedPerson.maidenName}</p>
                  )}
                  <span className="mt-2 inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded">
                    {t('persons.generation')} {selectedPerson.generation}
                  </span>
                </div>

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

                <div>
                  <h5 className="font-semibold text-gray-900 mb-3">{t('personDetail.family')}</h5>
                  <dl className="space-y-2 text-sm">
                    {selectedPerson.father && (
                      <div>
                        <dt className="text-gray-600">{t('persons.father')}:</dt>
                        <dd className="text-gray-900 font-medium">
                          {selectedPerson.father.givenName || selectedPerson.father.firstName}{' '}
                          {selectedPerson.father.surname || selectedPerson.father.lastName}
                        </dd>
                      </div>
                    )}
                    {selectedPerson.mother && (
                      <div>
                        <dt className="text-gray-600">{t('persons.mother')}:</dt>
                        <dd className="text-gray-900 font-medium">
                          {selectedPerson.mother.givenName || selectedPerson.mother.firstName}{' '}
                          {selectedPerson.mother.surname || selectedPerson.mother.lastName}
                        </dd>
                      </div>
                    )}
                    {selectedPerson.children && selectedPerson.children.length > 0 && (
                      <div>
                        <dt className="text-gray-600">{t('persons.children')}:</dt>
                        <dd className="text-gray-900 font-medium space-y-1">
                          {selectedPerson.children.map(child => (
                            <div key={child.id}>
                              {child.givenName || child.firstName} {child.surname || child.lastName}
                            </div>
                          ))}
                        </dd>
                      </div>
                    )}
                    {partnerships.filter(p => p.person1Id === selectedPerson.id || p.person2Id === selectedPerson.id).length > 0 && (
                      <div>
                        <dt className="text-gray-600">{t('personDetail.partnerships')}:</dt>
                        <dd className="text-gray-900 font-medium space-y-1">
                          {partnerships
                            .filter(p => p.person1Id === selectedPerson.id || p.person2Id === selectedPerson.id)
                            .map(partnership => {
                              const partnerId =
                                partnership.person1Id === selectedPerson.id ? partnership.person2Id : partnership.person1Id;
                              const partner = persons.find(p => p.id === partnerId);
                              if (!partner) return null;

                              return (
                                <div key={partnership.id} className="flex items-center gap-1">
                                  <span>
                                    {partner.givenName || partner.firstName} {partner.surname || partner.lastName}
                                    {partner.maidenName && ` (${partner.maidenName})`}
                                  </span>
                                  <span className="text-xs">
                                    {partnership.partnershipType === 'marriage' ? '💑' : '🤝'}
                                  </span>
                                  {partnership.status !== 'active' && (
                                    <span className="text-xs text-gray-500">({t('partnerships.ended')})</span>
                                  )}
                                </div>
                              );
                            })}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              {selectedPerson.biography && (
                <div className="mt-6 pt-6 border-t">
                  <h5 className="font-semibold text-gray-900 mb-2">{t('persons.biography')}</h5>
                  <p className="text-gray-700 text-sm">{selectedPerson.biography}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

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
              <button
                onClick={handleToggleMultiBranch}
                disabled={loadingMultiBranch}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {loadingMultiBranch ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    {multiBranchView ? '🌳 Single Branch' : '🌐 Connected Families'}
                  </>
                )}
              </button>
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
            {multiBranchView && multiBranchData ? (
              <MultiBranchTreeView
                treeData={multiBranchData}
                onPersonSelect={handlePersonSelect}
              />
            ) : (
              <FamilyTreeView
                persons={orderedPartnerData.orderedPersons}
                partnerships={partnerships}
                onPersonSelect={handlePersonSelect}
              />
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
