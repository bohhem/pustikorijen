import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Person } from '../../types/person';
import type { Partnership } from '../../types/partnership';

interface PartnerBadge {
  partner: Person;
  status: Partnership['status'];
  type: Partnership['partnershipType'];
}

interface PersonCardProps {
  person: Person;
  branchId: string;
  partners?: PartnerBadge[];
}

const statusStyles: Record<Partnership['status'], string> = {
  active: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  ended: 'bg-slate-100 text-slate-600 border border-slate-200',
  annulled: 'bg-amber-100 text-amber-800 border border-amber-200',
};

const statusIcon: Record<Partnership['status'], string> = {
  active: '💞',
  ended: '💔',
  annulled: '⚖️',
};

const typeIcon = (type: Partnership['partnershipType']) => {
  switch (type) {
    case 'marriage':
      return '💍';
    case 'domestic_partnership':
      return '🏠';
    case 'common_law':
      return '🤝';
    default:
      return '🪢';
  }
};

export default function PersonCard({ person, branchId, partners }: PersonCardProps) {
  const { t } = useTranslation();
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
                <div>{t('persons.father')}: {person.father.fullName || `${person.father.givenName} ${person.father.surname}`}</div>
              )}
              {person.mother && (
                <div>{t('persons.mother')}: {person.mother.fullName || `${person.mother.givenName} ${person.mother.surname}`}</div>
              )}
            </div>
          )}

          {partners && partners.length > 0 && (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                <span className="text-sm leading-none">💞</span>
                <span>{t('personList.partnersLabel')}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {partners.map(({ partner, status, type }) => {
                  const partnerName = partner.fullName || `${partner.givenName || ''} ${partner.surname || ''}`.trim() || t('personList.person');
                  const statusKey = status;
                  return (
                    <span
                      key={`${partner.id}-${statusKey}-${type}`}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[statusKey]}`}
                    >
                      <span>{statusIcon[statusKey]}</span>
                      <span>{typeIcon(type)}</span>
                      <span className="truncate max-w-[120px]">{partnerName}</span>
                      <span className="uppercase text-[10px] font-semibold">
                        {t(`personList.partnerStatus.${statusKey}`)}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
