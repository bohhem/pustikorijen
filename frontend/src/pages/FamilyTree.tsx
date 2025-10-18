import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPersonsByBranch } from '../api/person';
import { getBranchById } from '../api/branch';
import { useToast } from '../contexts/ToastContext';
import Layout from '../components/layout/Layout';
import FamilyTreeView from '../components/tree/FamilyTreeView';
import type { Person } from '../types/person';
import type { Branch } from '../types/branch';

export default function FamilyTree() {
  const { branchId } = useParams<{ branchId: string }>();
  const toast = useToast();
  const [persons, setPersons] = useState<Person[]>([]);
  const [branch, setBranch] = useState<Branch | null>(null);
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
      const [personsData, branchData] = await Promise.all([
        getPersonsByBranch(branchId!),
        getBranchById(branchId!)
      ]);
      setPersons(personsData);
      setBranch(branchData);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load family tree');
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
            <Link to="/branches" className="hover:text-indigo-600">Branches</Link>
            <span className="mx-2">/</span>
            <Link to={`/branches/${branchId}`} className="hover:text-indigo-600">
              {branch?.surname}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Family Tree</span>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {branch?.surname} Family Tree
              </h1>
              <p className="text-gray-600 mt-1">
                {persons.length} people across {Math.max(...persons.map(p => p.generationNumber || 0), 0)} generations
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to={`/branches/${branchId}/persons`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                View List
              </Link>
              <Link
                to={`/branches/${branchId}/persons/create`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Add Person
              </Link>
            </div>
          </div>
        </div>

        {/* Tree Visualization */}
        {persons.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🌳</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No family members yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start building your family tree by adding the first person.
            </p>
            <Link
              to={`/branches/${branchId}/persons/create`}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Add First Person
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <FamilyTreeView persons={persons} onPersonSelect={handlePersonSelect} />

            {/* Selected Person Details */}
            {selectedPerson && (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Selected Person</h3>
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
                      Generation {selectedPerson.generation}
                    </span>
                  </div>

                  {/* Life information */}
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-3">Life Information</h5>
                    <dl className="space-y-2 text-sm">
                      {selectedPerson.birthDate && (
                        <div>
                          <dt className="text-gray-600">Born:</dt>
                          <dd className="text-gray-900 font-medium">
                            {new Date(selectedPerson.birthDate).toLocaleDateString()}
                            {selectedPerson.birthPlace && ` in ${selectedPerson.birthPlace}`}
                          </dd>
                        </div>
                      )}
                      {!selectedPerson.isAlive && selectedPerson.deathDate && (
                        <div>
                          <dt className="text-gray-600">Died:</dt>
                          <dd className="text-gray-900 font-medium">
                            {new Date(selectedPerson.deathDate).toLocaleDateString()}
                            {selectedPerson.deathPlace && ` in ${selectedPerson.deathPlace}`}
                          </dd>
                        </div>
                      )}
                      {selectedPerson.isAlive && selectedPerson.birthDate && (
                        <div>
                          <dt className="text-gray-600">Age:</dt>
                          <dd className="text-gray-900 font-medium">
                            {new Date().getFullYear() - new Date(selectedPerson.birthDate).getFullYear()} years old
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Family information */}
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-3">Family</h5>
                    <dl className="space-y-2 text-sm">
                      {selectedPerson.father && (
                        <div>
                          <dt className="text-gray-600">Father:</dt>
                          <dd className="text-gray-900 font-medium">
                            {selectedPerson.father.firstName} {selectedPerson.father.lastName}
                          </dd>
                        </div>
                      )}
                      {selectedPerson.mother && (
                        <div>
                          <dt className="text-gray-600">Mother:</dt>
                          <dd className="text-gray-900 font-medium">
                            {selectedPerson.mother.firstName} {selectedPerson.mother.lastName}
                          </dd>
                        </div>
                      )}
                      {selectedPerson.children && selectedPerson.children.length > 0 && (
                        <div>
                          <dt className="text-gray-600">Children:</dt>
                          <dd className="text-gray-900 font-medium">
                            {selectedPerson.children.map(child => (
                              <div key={child.id}>
                                {child.firstName} {child.lastName}
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
                    <h5 className="font-semibold text-gray-900 mb-2">Biography</h5>
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
