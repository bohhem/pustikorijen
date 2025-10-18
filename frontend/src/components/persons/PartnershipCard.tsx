import { Link } from 'react-router-dom';
import type { Partnership } from '../../types/partnership';

interface PartnershipCardProps {
  partnership: Partnership;
  branchId: string;
  currentPersonId: string;
}

export default function PartnershipCard({ partnership, branchId, currentPersonId }: PartnershipCardProps) {
  // Determine which person is the partner (the other person)
  const partner = partnership.person1Id === currentPersonId ? partnership.person2 : partnership.person1;

  if (!partner) return null;

  const partnerName = partner.fullName || `${partner.givenName} ${partner.surname}`;
  const maidenName = partner.maidenName ? `(née ${partner.maidenName})` : '';

  const statusColor = {
    active: 'bg-green-100 text-green-800',
    ended: 'bg-gray-100 text-gray-800',
    annulled: 'bg-red-100 text-red-800',
  }[partnership.status];

  const typeLabel = {
    marriage: 'Marriage',
    domestic_partnership: 'Domestic Partnership',
    common_law: 'Common Law',
    other: 'Partnership',
  }[partnership.partnershipType];

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Link
            to={`/branches/${branchId}/persons/${partner.id}`}
            className="text-lg font-semibold text-gray-900 hover:text-indigo-600"
          >
            {partnerName}
          </Link>
          {maidenName && (
            <span className="ml-2 text-sm text-gray-500">{maidenName}</span>
          )}
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
          {partnership.status}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center">
          <span className="font-medium mr-2">Type:</span>
          <span>{typeLabel}</span>
        </div>

        {partnership.startDate && (
          <div className="flex items-center">
            <span className="font-medium mr-2">Started:</span>
            <span>
              {formatDate(partnership.startDate)}
              {partnership.startPlace && ` in ${partnership.startPlace}`}
            </span>
          </div>
        )}

        {partnership.ceremonyType && (
          <div className="flex items-center">
            <span className="font-medium mr-2">Ceremony:</span>
            <span className="capitalize">{partnership.ceremonyType}</span>
          </div>
        )}

        {partnership.endDate && (
          <div className="flex items-center text-gray-500">
            <span className="font-medium mr-2">Ended:</span>
            <span>
              {formatDate(partnership.endDate)}
              {partnership.endPlace && ` in ${partnership.endPlace}`}
              {partnership.endReason && ` (${partnership.endReason})`}
            </span>
          </div>
        )}

        {partnership.orderNumber > 1 && (
          <div className="mt-2 pt-2 border-t">
            <span className="text-xs text-gray-500">
              Marriage #{partnership.orderNumber}
            </span>
          </div>
        )}

        {partnership.notes && (
          <div className="mt-2 pt-2 border-t">
            <p className="text-sm text-gray-600 italic">{partnership.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
