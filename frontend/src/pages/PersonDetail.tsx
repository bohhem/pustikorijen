import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPersonsByBranch, getPersonById, deletePerson, movePerson, claimPerson } from '../api/person';
import { getPersonPartnerships } from '../api/partnership';
import { getBranchById, getBranchMembers, getBranches } from '../api/branch';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Layout from '../components/layout/Layout';
import PartnershipCard from '../components/persons/PartnershipCard';
import PersonBusinessAddressesSection from '../components/business/PersonBusinessAddressesSection';
import type { Person } from '../types/person';
import type { Branch, BranchMember, MovePersonPayload } from '../types/branch';
import type { Partnership } from '../types/partnership';

export default function PersonDetail() {
  const { branchId, personId } = useParams<{ branchId: string; personId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const [person, setPerson] = useState<Person | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [allPersons, setAllPersons] = useState<Person[]>([]);
  const [members, setMembers] = useState<BranchMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveLoading, setMoveLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);

  const isSuperGuru = useMemo(
    () => (user?.globalRole ? ['SUPER_GURU', 'ADMIN', 'REGIONAL_GURU'].includes(user.globalRole) : false),
    [user?.globalRole]
  );
  const isGuru = useMemo(
    () => members.some(m => m.userId === user?.id && m.role === 'guru' && m.status === 'active'),
    [members, user?.id]
  );
  const canManage = useMemo(() => isGuru || isSuperGuru, [isGuru, isSuperGuru]);
  const canClaim = useMemo(() => person?.canBeClaimed ?? false, [person?.canBeClaimed]);

  useEffect(() => {
    if (branchId && personId) {
      loadData();
    }
  }, [branchId, personId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [personData, personsData, branchData, membersData] = await Promise.all([
        getPersonById(branchId!, personId!),
        getPersonsByBranch(branchId!),
        getBranchById(branchId!),
        getBranchMembers(branchId!),
      ]);

      if (!personData) {
        toast.error(t('personDetail.notFound'));
        navigate(`/branches/${branchId}/persons`);
        return;
      }

      setPerson(personData);
      setBranch(branchData);
      setAllPersons(personsData);
      setMembers(membersData);

      // Load partnerships
      try {
        const partnershipData = await getPersonPartnerships(branchId!, personId!);
        setPartnerships(partnershipData);
      } catch (err) {
        console.error('Failed to load partnerships:', err);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('persons.loadError'));
      navigate(`/branches/${branchId}/persons`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateAge = (birthDate?: string, deathDate?: string) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const end = deathDate ? new Date(deathDate) : new Date();
    const age = end.getFullYear() - birth.getFullYear();
    return age;
  };

  const findPersonById = (id?: string | null) => {
    if (!id) return null;
    return allPersons.find(p => p.id === id);
  };

  const handleDelete = async () => {
    if (!branchId || !personId) return;
    const confirmed = window.confirm(t('personDetail.confirmDelete'));
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deletePerson(branchId, personId);
      toast.success(t('persons.deleteSuccess'));
      navigate(`/branches/${branchId}/persons`);
    } catch (err: any) {
      console.error('Failed to delete person:', err);
      toast.error(err.response?.data?.error || t('persons.deleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClaim = async () => {
    if (!branchId || !personId) return;
    const message = window.prompt(t('personDetail.claimPrompt') || '', '');
    setClaimLoading(true);
    try {
      await claimPerson(branchId, personId, message || undefined);
      toast.success(t('personDetail.claimSuccess'));
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t('personDetail.claimError'));
    } finally {
      setClaimLoading(false);
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

  if (!person) {
    return null;
  }

  const father = findPersonById(person.fatherId);
  const mother = findPersonById(person.motherId);
  const children = allPersons.filter(p => p.fatherId === person.id || p.motherId === person.id);
  const isAlive = !person.deathDate;
  const age = calculateAge(person.birthDate, person.deathDate);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-600 mb-6">
          <Link to="/branches" className="hover:text-indigo-600">{t('navigation.branches')}</Link>
          <span className="mx-2">/</span>
          <Link to={`/branches/${branchId}`} className="hover:text-indigo-600">
            {branch?.surname}
          </Link>
          <span className="mx-2">/</span>
          <Link to={`/branches/${branchId}/persons`} className="hover:text-indigo-600">
            {t('createPerson.breadcrumbPeople')}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{person.fullName}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mb-6">
          <Link
            to={`/branches/${branchId}/persons/${personId}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {t('personDetail.editPerson')}
          </Link>
          {canClaim && (
            <button
              type="button"
              onClick={handleClaim}
              disabled={claimLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
            >
              {claimLoading ? t('common.loading') : t('personDetail.claimButton')}
            </button>
          )}
          {canManage && (
            <button
              type="button"
              onClick={() => setMoveModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700"
            >
              {t('personDetail.movePerson')}
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? t('common.loading') : t('personDetail.deletePerson')}
          </button>
        </div>

        {/* Main Info Card */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-start gap-6">
              {/* Profile Photo */}
              <div className="flex-shrink-0">
                {person.profilePhotoUrl ? (
                  <img
                    src={person.profilePhotoUrl}
                    alt={person.fullName}
                    className="w-32 h-32 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
                    <span className="text-4xl font-bold text-indigo-700">
                      {person.givenName?.[0]}{person.surname?.[0]}
                    </span>
                  </div>
                )}
              </div>

              {/* Name and Basic Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {person.fullName}
                </h1>
                {person.shareInLedger && (
                  <div className="mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {t('persons.ledgerSharedBadge')}
                    </span>
                  </div>
                )}
                {person.maidenName && (
                  <p className="text-lg text-gray-600 mb-2">
                    {t('personDetail.nee')} {person.maidenName}
                  </p>
                )}
                {person.nickname && (
                  <p className="text-gray-600 mb-2">"{person.nickname}"</p>
                )}

                {person.claimStatus && (
                  <p className="text-xs font-semibold mt-1 text-indigo-700">
                    {t(`personDetail.claimStatus.${person.claimStatus}`)}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                    {person.generation || `Generation ${person.generationNumber || 1}`}
                  </span>
                  {person.gender && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 capitalize">
                      {person.gender}
                    </span>
                  )}
                  {isAlive ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {t('personDetail.living')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      {t('personDetail.deceased')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          {person.isLinked && person.linkedFromBranch && (
            <div className="px-6 py-3 bg-indigo-50 border-t border-indigo-100 text-sm text-indigo-900">
              {t('branchDetail.linkedNotice', { branch: person.linkedFromBranch.surname })}
            </div>
          )}

          {/* Life Information */}
          <div className="border-t border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('personDetail.lifeInfo')}</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {person.birthDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">{t('personDetail.born')}</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(person.birthDate)}
                    {person.birthPlace && ` ${t('personDetail.in')} ${person.birthPlace}`}
                    {age && isAlive && ` (${age} ${t('personDetail.yearsOld')})`}
                  </dd>
                </div>
              )}
              {person.deathDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">{t('personDetail.died')}</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(person.deathDate)}
                    {person.deathPlace && ` ${t('personDetail.in')} ${person.deathPlace}`}
                    {age && ` (${age} ${t('personDetail.years')})`}
                  </dd>
                </div>
              )}
              {person.currentLocation && isAlive && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">{t('persons.currentLocation')}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{person.currentLocation}</dd>
                </div>
              )}
              {person.occupation && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">{t('persons.occupation')}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{person.occupation}</dd>
                </div>
              )}
              {person.education && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">{t('persons.education')}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{person.education}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Biography */}
          {person.biography && (
            <div className="border-t border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('persons.biography')}</h3>
              <p className="text-gray-700 whitespace-pre-line">{person.biography}</p>
            </div>
          )}
        </div>

        {/* Family Section */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">{t('personDetail.family')}</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Parents */}
            {(father || mother) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('personDetail.parents')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {father && (
                    <Link
                      to={`/branches/${branchId}/persons/${father.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition"
                    >
                      <p className="text-sm text-gray-500">{t('persons.father')}</p>
                      <p className="font-medium text-gray-900">{father.fullName}</p>
                      {father.birthDate && (
                        <p className="text-sm text-gray-600">
                          {new Date(father.birthDate).getFullYear()}
                          {father.deathDate && ` - ${new Date(father.deathDate).getFullYear()}`}
                        </p>
                      )}
                    </Link>
                  )}
                  {mother && (
                    <Link
                      to={`/branches/${branchId}/persons/${mother.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition"
                    >
                      <p className="text-sm text-gray-500">{t('persons.mother')}</p>
                      <p className="font-medium text-gray-900">
                        {mother.fullName}
                        {mother.maidenName && ` (${t('personDetail.nee')} ${mother.maidenName})`}
                      </p>
                      {mother.birthDate && (
                        <p className="text-sm text-gray-600">
                          {new Date(mother.birthDate).getFullYear()}
                          {mother.deathDate && ` - ${new Date(mother.deathDate).getFullYear()}`}
                        </p>
                      )}
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Partnerships/Spouses */}
            {partnerships.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {partnerships.length === 1 ? t('personDetail.partnership') : t('personDetail.partnerships')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {partnerships.map((partnership) => (
                    <PartnershipCard
                      key={partnership.id}
                      partnership={partnership}
                      branchId={branchId!}
                      currentPersonId={personId!}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Children */}
            {children.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t('persons.children')} ({children.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {children.map((child) => (
                    <Link
                      key={child.id}
                      to={`/branches/${branchId}/persons/${child.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition"
                    >
                      <p className="font-medium text-gray-900">{child.fullName}</p>
                      {child.birthDate && (
                        <p className="text-sm text-gray-600">
                          b. {new Date(child.birthDate).getFullYear()}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {child.generation || `${t('personDetail.gen')} ${child.generationNumber}`}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Business Addresses Section */}
        <PersonBusinessAddressesSection
          branchId={branchId!}
          personId={personId!}
          canManage={canManage}
        />

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Link
            to={`/branches/${branchId}/partnerships/add?person=${personId}`}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-sm font-medium"
          >
            {t('personDetail.addPartnership')}
          </Link>
          <Link
            to={`/branches/${branchId}/persons`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition text-sm font-medium"
          >
            {t('personDetail.backToList')}
          </Link>
        </div>
      </div>
      {moveModalOpen && branchId && personId && (
        <MovePersonModal
          currentBranchId={branchId}
          loading={moveLoading}
          onClose={() => setMoveModalOpen(false)}
          onMove={async (payload) => {
            setMoveLoading(true);
            try {
              await movePerson(branchId, personId, payload);
              toast.success(t('personDetail.moveSuccess'));
              navigate(`/branches/${payload.targetBranchId}/persons/${personId}`);
            } catch (err: any) {
              toast.error(err.response?.data?.error || t('personDetail.moveError'));
            } finally {
              setMoveLoading(false);
            }
          }}
        />
      )}
    </Layout>
  );
}
interface MovePersonModalProps {
  currentBranchId: string;
  loading: boolean;
  onClose: () => void;
  onMove: (payload: MovePersonPayload) => Promise<void>;
}

function MovePersonModal({ currentBranchId, loading, onClose, onMove }: MovePersonModalProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await getBranches({ limit: 20, search: searchTerm || undefined });
        if (!active) return;
        setBranches(response.branches.filter((branch) => branch.id !== currentBranchId));
      } catch (err) {
        console.error('Failed to load branches', err);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [searchTerm, currentBranchId]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedBranchId) return;
    await onMove({ targetBranchId: selectedBranchId, notes });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h4 className="text-base font-semibold text-gray-900">{t('personDetail.moveModalTitle')}</h4>
            <p className="text-sm text-gray-500">{t('personDetail.moveModalSubtitle')}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        <form onSubmit={submit} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('personDetail.moveSearch')}</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border"
              placeholder={t('personDetail.moveSearchPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('personDetail.moveSelectBranch')}</label>
            <div className="mt-2 max-h-52 overflow-y-auto border rounded-md divide-y divide-gray-200">
              {branches.length === 0 ? (
                <p className="text-sm text-gray-500 p-3">{t('personDetail.moveNoBranches')}</p>
              ) : (
                branches.map((branch) => (
                  <label key={branch.id} className="flex items-center px-3 py-2 gap-2">
                    <input
                      type="radio"
                      name="targetBranch"
                      value={branch.id}
                      checked={selectedBranchId === branch.id}
                      onChange={() => setSelectedBranchId(branch.id)}
                    />
                    <span>
                      <span className="font-medium text-gray-900">{branch.surname}</span>
                      <span className="ml-2 text-xs text-gray-500">{branch.id}</span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('personDetail.moveNotes')}</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="text-sm text-gray-600">
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={!selectedBranchId || loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm disabled:opacity-50"
            >
              {loading ? t('common.loading') : t('personDetail.moveConfirm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
