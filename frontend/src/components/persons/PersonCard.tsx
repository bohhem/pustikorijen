import { Link } from 'react-router-dom';
import type { Person } from '../../types/person';

interface PersonCardProps {
  person: Person;
  branchId: string;
}

export default function PersonCard({ person, branchId }: PersonCardProps) {
  const firstName = person.givenName || person.firstName || '';
  const lastName = person.surname || person.lastName || '';
  const isAlive = person.isAlive !== false; // Default to true if not specified

  const age = person.birthDate && isAlive
    ? new Date().getFullYear() - new Date(person.birthDate).getFullYear()
    : null;

  const lifespan = person.birthDate && !isAlive && person.deathDate
    ? `${new Date(person.birthDate).getFullYear()} - ${new Date(person.deathDate).getFullYear()}`
    : person.birthDate
    ? `b. ${new Date(person.birthDate).getFullYear()}`
    : null;

  return (
    <Link
      to={`/branches/${branchId}/persons/${person.id}`}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition"
    >
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {person.profilePhotoUrl ? (
            <img
              src={person.profilePhotoUrl}
              alt={person.fullName || `${firstName} ${lastName}`}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-indigo-700">
                {firstName[0] || 'U'}{lastName[0] || 'N'}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 truncate">
                {person.fullName || `${firstName} ${lastName}`}
                {person.maidenName && (
                  <span className="text-sm text-gray-500 ml-1">
                    (née {person.maidenName})
                  </span>
                )}
              </h4>
              {(age || lifespan) && (
                <p className="text-sm text-gray-600">
                  {age ? `${age} years old` : lifespan}
                </p>
              )}
              {person.birthPlace && (
                <p className="text-xs text-gray-500 mt-1">
                  📍 {person.birthPlace}
                </p>
              )}
            </div>
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
              {person.generation || `Gen ${person.generationNumber || 1}`}
            </span>
          </div>

          {person.biography && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {person.biography}
            </p>
          )}

          {(person.father || person.mother) && (
            <div className="text-xs text-gray-500 mt-2 space-y-1">
              {person.father && (
                <div>Father: {person.father.fullName || `${person.father.givenName} ${person.father.surname}`}</div>
              )}
              {person.mother && (
                <div>Mother: {person.mother.fullName || `${person.mother.givenName} ${person.mother.surname}`}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
