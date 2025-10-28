import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { Person } from '../../types/person';

interface PersonNodeProps {
  data: {
    person: Person;
    onSelect: (person: Person) => void;
  };
}

function PersonNode({ data }: PersonNodeProps) {
  const { person, onSelect } = data;

  const firstName = person.givenName || person.firstName || '';
  const lastName = person.surname || person.lastName || '';
  const isAlive = person.isAlive !== false;

  const age = person.birthDate && isAlive
    ? new Date().getFullYear() - new Date(person.birthDate).getFullYear()
    : null;

  const birthYear = person.birthDate
    ? new Date(person.birthDate).getFullYear()
    : null;

  const deathYear = person.deathDate
    ? new Date(person.deathDate).getFullYear()
    : null;

  return (
    <div
      onClick={() => onSelect(person)}
      className="bg-white rounded-lg shadow-md border-2 border-gray-200 hover:border-indigo-400 hover:shadow-lg transition-all cursor-pointer min-w-[160px] sm:min-w-[200px] touch-manipulation"
    >
      {/* Parent connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-indigo-500"
      />

      <div className="p-3 sm:p-4">
        {/* Profile Photo */}
        <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
          {person.profilePhotoUrl ? (
            <img
              src={person.profilePhotoUrl}
              alt={person.fullName || `${firstName} ${lastName}`}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
            />
          ) : (
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base ${
              person.gender === 'male'
                ? 'bg-blue-500'
                : person.gender === 'female'
                ? 'bg-pink-500'
                : 'bg-purple-500'
            }`}>
              {firstName[0] || 'U'}{lastName[0] || 'N'}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
              {person.fullName || `${firstName} ${lastName}`}
            </p>
            {person.maidenName && (
              <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                née {person.maidenName}
              </p>
            )}
          </div>
        </div>

        {/* Life info */}
        <div className="text-[10px] sm:text-xs text-gray-600 space-y-1">
          {birthYear && (
            <div className="flex items-center justify-between">
              <span>
                {isAlive ? (
                  <>
                    <span className="text-green-600">●</span> {age} years old
                  </>
                ) : (
                  <>b. {birthYear}{deathYear && ` - d. ${deathYear}`}</>
                )}
              </span>
            </div>
          )}
          {person.birthPlace && (
            <div className="text-gray-500 truncate">
              📍 {person.birthPlace}
            </div>
          )}
        </div>

        {/* Generation badge */}
        <div className="mt-2 pt-2 border-t border-gray-200">
          <span className="inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 bg-indigo-100 text-indigo-700 text-[10px] sm:text-xs font-medium rounded">
            {person.generation || `G${person.generationNumber || 1}`}
          </span>
        </div>
      </div>

      {/* Children connection handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-indigo-500"
      />
    </div>
  );
}

export default memo(PersonNode);
