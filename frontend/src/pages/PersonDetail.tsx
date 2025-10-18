import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPersonsByBranch } from '../api/person';
import { getPersonPartnerships } from '../api/partnership';
import { getBranchById } from '../api/branch';
import { useToast } from '../contexts/ToastContext';
import Layout from '../components/layout/Layout';
import PartnershipCard from '../components/persons/PartnershipCard';
import type { Person } from '../types/person';
import type { Branch } from '../types/branch';
import type { Partnership } from '../types/partnership';

export default function PersonDetail() {
  const { branchId, personId } = useParams<{ branchId: string; personId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [person, setPerson] = useState<Person | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [allPersons, setAllPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (branchId && personId) {
      loadData();
    }
  }, [branchId, personId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [personsData, branchData] = await Promise.all([
        getPersonsByBranch(branchId!),
        getBranchById(branchId!),
      ]);

      const currentPerson = personsData.find(p => p.id === personId);
      if (!currentPerson) {
        toast.error('Person not found');
        navigate(`/branches/${branchId}/persons`);
        return;
      }

      setPerson(currentPerson);
      setBranch(branchData);
      setAllPersons(personsData);

      // Load partnerships
      try {
        const partnershipData = await getPersonPartnerships(branchId!, personId!);
        setPartnerships(partnershipData);
      } catch (err) {
        console.error('Failed to load partnerships:', err);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load person details');
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

  const findPersonById = (id?: string) => {
    if (!id) return null;
    return allPersons.find(p => p.id === id);
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
          <Link to="/branches" className="hover:text-indigo-600">Branches</Link>
          <span className="mx-2">/</span>
          <Link to={`/branches/${branchId}`} className="hover:text-indigo-600">
            {branch?.surname}
          </Link>
          <span className="mx-2">/</span>
          <Link to={`/branches/${branchId}/persons`} className="hover:text-indigo-600">
            People
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{person.fullName}</span>
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
                {person.maidenName && (
                  <p className="text-lg text-gray-600 mb-2">
                    née {person.maidenName}
                  </p>
                )}
                {person.nickname && (
                  <p className="text-gray-600 mb-2">"{person.nickname}"</p>
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
                      Living
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      Deceased
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Life Information */}
          <div className="border-t border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Life Information</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {person.birthDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Born</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(person.birthDate)}
                    {person.birthPlace && ` in ${person.birthPlace}`}
                    {age && isAlive && ` (${age} years old)`}
                  </dd>
                </div>
              )}
              {person.deathDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Died</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(person.deathDate)}
                    {person.deathPlace && ` in ${person.deathPlace}`}
                    {age && ` (${age} years)`}
                  </dd>
                </div>
              )}
              {person.currentLocation && isAlive && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Current Location</dt>
                  <dd className="mt-1 text-sm text-gray-900">{person.currentLocation}</dd>
                </div>
              )}
              {person.occupation && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Occupation</dt>
                  <dd className="mt-1 text-sm text-gray-900">{person.occupation}</dd>
                </div>
              )}
              {person.education && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Education</dt>
                  <dd className="mt-1 text-sm text-gray-900">{person.education}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Biography */}
          {person.biography && (
            <div className="border-t border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Biography</h3>
              <p className="text-gray-700 whitespace-pre-line">{person.biography}</p>
            </div>
          )}
        </div>

        {/* Family Section */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Family</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Parents */}
            {(father || mother) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Parents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {father && (
                    <Link
                      to={`/branches/${branchId}/persons/${father.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition"
                    >
                      <p className="text-sm text-gray-500">Father</p>
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
                      <p className="text-sm text-gray-500">Mother</p>
                      <p className="font-medium text-gray-900">
                        {mother.fullName}
                        {mother.maidenName && ` (née ${mother.maidenName})`}
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
                  {partnerships.length === 1 ? 'Partnership' : 'Partnerships'}
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
                  Children ({children.length})
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
                        {child.generation || `Gen ${child.generationNumber}`}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            to={`/branches/${branchId}/partnerships/add?person=${personId}`}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-sm font-medium"
          >
            Add Partnership
          </Link>
          <Link
            to={`/branches/${branchId}/persons`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition text-sm font-medium"
          >
            Back to List
          </Link>
        </div>
      </div>
    </Layout>
  );
}
