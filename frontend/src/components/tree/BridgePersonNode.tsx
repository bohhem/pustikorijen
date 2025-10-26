import { Handle, Position } from 'reactflow';
import type { MultiBranchTreePerson } from '../../types/branch';

interface BridgePersonNodeProps {
  data: {
    person: MultiBranchTreePerson;
    branchSurname?: string;
    onSelect?: (person: MultiBranchTreePerson) => void;
  };
}

export default function BridgePersonNode({ data }: BridgePersonNodeProps) {
  const { person, branchSurname, onSelect } = data;

  const handleClick = () => {
    if (onSelect) {
      onSelect(person);
    }
  };

  // Calculate age or life span
  const getLifeSpan = () => {
    if (!person.birthDate) return '';

    const birthYear = new Date(person.birthDate).getFullYear();
    if (person.deathDate) {
      const deathYear = new Date(person.deathDate).getFullYear();
      return `${birthYear}-${deathYear}`;
    }

    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    return `b. ${birthYear} (${age})`;
  };

  return (
    <div
      onClick={handleClick}
      className="relative px-4 py-3 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg shadow-md border-2 border-amber-400 cursor-pointer hover:shadow-xl transition-all min-w-[180px] max-w-[220px]"
      style={{
        animation: 'pulse-glow 2s ease-in-out infinite',
      }}
    >
      {/* Bridge Badge */}
      <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
        <span>🌉</span>
        <span>Bridge</span>
      </div>

      {/* Branch Label */}
      {branchSurname && (
        <div className="absolute -top-2 -left-2 bg-indigo-600 text-white text-xs font-semibold px-2 py-0.5 rounded shadow-md">
          {branchSurname}
        </div>
      )}

      {/* Person Photo */}
      {person.profilePhotoUrl ? (
        <img
          src={person.profilePhotoUrl}
          alt={person.fullName}
          className="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-amber-400 object-cover"
        />
      ) : (
        <div className="w-12 h-12 rounded-full mx-auto mb-2 bg-amber-200 flex items-center justify-center border-2 border-amber-400">
          <span className="text-amber-700 font-bold text-lg">
            {person.givenName?.[0] || person.fullName[0]}
          </span>
        </div>
      )}

      {/* Person Name */}
      <div className="text-center">
        <div className="font-semibold text-gray-900 text-sm leading-tight">
          {person.givenName || person.fullName}
        </div>
        {person.surname && (
          <div className="text-xs text-gray-600 font-medium">{person.surname}</div>
        )}
        {person.maidenName && (
          <div className="text-xs text-gray-500 italic">({person.maidenName})</div>
        )}
      </div>

      {/* Life Span */}
      {getLifeSpan() && (
        <div className="text-xs text-gray-500 text-center mt-1">{getLifeSpan()}</div>
      )}

      {/* Generation Badge */}
      {person.generation && (
        <div className="absolute bottom-2 left-2 bg-amber-100 text-amber-800 text-xs px-1.5 py-0.5 rounded font-medium">
          {person.generation}
        </div>
      )}

      {/* Handles for connections */}
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-amber-500" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-amber-500" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-amber-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-amber-500" />

      {/* Glow animation styles */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 10px rgba(251, 191, 36, 0.4), 0 0 20px rgba(251, 191, 36, 0.2);
          }
          50% {
            box-shadow: 0 0 20px rgba(251, 191, 36, 0.6), 0 0 30px rgba(251, 191, 36, 0.3);
          }
        }
      `}</style>
    </div>
  );
}
