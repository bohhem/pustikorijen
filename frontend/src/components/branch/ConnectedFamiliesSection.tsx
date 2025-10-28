import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ConnectedFamily } from '../../types/branch';
import { getConnectedFamilies } from '../../api/branch';

interface ConnectedFamiliesSectionProps {
  branchId: string;
  canModerate: boolean;
  onShowPendingLinks?: () => void;
}

type FilterOption = 'all' | 'approved' | 'pending';
type ViewMode = 'cards' | 'graph';

export default function ConnectedFamiliesSection({ branchId, canModerate, onShowPendingLinks }: ConnectedFamiliesSectionProps) {
  const { t } = useTranslation();
  const [families, setFamilies] = useState<ConnectedFamily[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterOption>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);

  useEffect(() => {
    if (!canModerate) {
      return;
    }

    let ignore = false;
    setLoading(true);
    setError(null);
    getConnectedFamilies(branchId)
      .then((result) => {
        if (!ignore) {
          setFamilies(result.connectedFamilies);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err?.response?.data?.error || t('connectedFamilies.loadError'));
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [branchId, canModerate, t]);

  const filteredFamilies = useMemo(() => {
    if (filter === 'approved') {
      return families.filter((family) => family.stats.approvedLinks > 0);
    }
    if (filter === 'pending') {
      return families.filter((family) => family.stats.pendingLinks > 0);
    }
    return families;
  }, [families, filter]);

  if (!canModerate) {
    return null;
  }

  return (
    <section className="bg-white shadow rounded-lg p-6 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">{t('connectedFamilies.title')}</h2>
            <div className="inline-flex rounded-md border border-gray-200 text-xs font-medium">
              {(['cards', 'graph'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 ${
                    viewMode === mode ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                  } ${mode !== 'graph' ? 'border-r border-gray-200' : ''}`}
                >
                  {t(`connectedFamilies.viewMode.${mode}`)}
                </button>
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">{t('connectedFamilies.subtitle')}</p>
        </div>
        <div className="inline-flex rounded-md border border-gray-200 text-sm font-medium self-start">
          {(['all', 'approved', 'pending'] as FilterOption[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`px-3 py-1.5 ${
                filter === option ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              } ${option !== 'pending' ? 'border-r border-gray-200' : ''}`}
            >
              {t(`connectedFamilies.filter.${option}`)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : filteredFamilies.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-gray-500">
          {t('connectedFamilies.empty')}
        </div>
      ) : viewMode === 'graph' ? (
        <ConnectedFamiliesGraph
          families={filteredFamilies}
          selectedId={selectedFamilyId}
          onSelect={(id) => setSelectedFamilyId((prev) => (prev === id ? null : id))}
          onShowPendingLinks={onShowPendingLinks}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredFamilies.map((family) => (
            <ConnectedFamilyCard
              key={family.branch.id}
              family={family}
              onShowPendingLinks={onShowPendingLinks}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface ConnectedFamiliesGraphProps {
  families: ConnectedFamily[];
  selectedId: string | null;
  onSelect: (branchId: string) => void;
  onShowPendingLinks?: () => void;
}

function ConnectedFamiliesGraph({ families, selectedId, onSelect, onShowPendingLinks }: ConnectedFamiliesGraphProps) {
  const { t } = useTranslation();
  const radius = 180;
  const center = 220;

  if (families.length === 0) {
    return null;
  }

  const nodePositions = families.map((family, index) => {
    const angle = (index / families.length) * Math.PI * 2 - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return { id: family.branch.id, x, y, family, angle };
  });

  const selectedFamily = families.find((family) => family.branch.id === selectedId);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-b from-slate-50 to-white">
        <svg width={440} height={440} className="block mx-auto">
          {/* edges */}
          {nodePositions.map((node) => (
            <line
              key={`edge-${node.id}`}
              x1={center}
              y1={center}
              x2={node.x}
              y2={node.y}
              stroke="#CBD5F5"
              strokeWidth={selectedId === node.id ? 3 : 1.5}
              className="transition-all duration-200"
            />
          ))}
          {/* center node */}
          <g>
            <circle cx={center} cy={center} r={40} className="fill-indigo-600 shadow-lg" />
            <text
              x={center}
              y={center}
              className="text-white font-semibold"
              textAnchor="middle"
              alignmentBaseline="middle"
              fontSize="12"
            >
              {t('connectedFamilies.thisBranch')}
            </text>
          </g>
          {/* family nodes */}
          {nodePositions.map((node) => {
            const pending = node.family.stats.pendingLinks;
            const approved = node.family.stats.approvedLinks;
            const size = Math.min(approved + pending, 8) + 18;
            return (
              <g key={node.id} className="cursor-pointer" onClick={() => onSelect(node.id)}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={size}
                  className={`transition-all duration-200 ${
                    selectedId === node.id ? 'fill-amber-500' : 'fill-white'
                  }`}
                  stroke="#6366F1"
                  strokeWidth={selectedId === node.id ? 3 : 2}
                  filter="url(#shadow)"
                />
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fontSize="11"
                  className="fill-gray-800 font-semibold"
                >
                  {node.family.branch.surname}
                </text>
                {pending > 0 && (
                  <text
                    x={node.x}
                    y={node.y + size + 12}
                    textAnchor="middle"
                    fontSize="10"
                    className="fill-amber-600"
                  >
                    {t('connectedFamilies.pendingCount', { count: pending })}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      {selectedFamily ? (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-indigo-900">{selectedFamily.branch.surname}</h3>
            <div className="text-sm text-indigo-600">
              {t('connectedFamilies.stats.approved', { count: selectedFamily.stats.approvedLinks })} •{' '}
              {t('connectedFamilies.stats.pending', { count: selectedFamily.stats.pendingLinks })}
            </div>
          </div>
          <p className="text-sm text-indigo-700">
            {selectedFamily.branch.cityName}
            {selectedFamily.branch.region ? `, ${selectedFamily.branch.region}` : ''}
          </p>
          {selectedFamily.stats.pendingLinks > 0 && onShowPendingLinks && (
            <button
              type="button"
              onClick={onShowPendingLinks}
              className="inline-flex items-center text-sm font-semibold text-amber-700 bg-amber-100 rounded-md px-3 py-1 hover:bg-amber-200 transition"
            >
              {t('connectedFamilies.reviewPending', { count: selectedFamily.stats.pendingLinks })}
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">{t('connectedFamilies.graphHint')}</p>
      )}
    </div>
  );
}

function ConnectedFamilyCard({
  family,
  onShowPendingLinks,
}: {
  family: ConnectedFamily;
  onShowPendingLinks?: () => void;
}) {
  const { t } = useTranslation();

  const location = useMemo(() => {
    if (family.branch.cityName && family.branch.region) {
      return `${family.branch.cityName}, ${family.branch.region}`;
    }
    if (family.branch.cityName) {
      return family.branch.cityName;
    }
    return family.branch.country ?? '';
  }, [family.branch]);

  const statusChips = [
    {
      label: t('connectedFamilies.stats.approved', { count: family.stats.approvedLinks }),
      color: 'bg-green-100 text-green-800',
    },
    {
      label: t('connectedFamilies.stats.pending', { count: family.stats.pendingLinks }),
      color: 'bg-amber-100 text-amber-800',
    },
  ];

  const firstLinked = family.stats.firstLinkAt
    ? new Date(family.stats.firstLinkAt).toLocaleDateString()
    : null;
  const lastUpdated = family.stats.lastLinkAt
    ? new Date(family.stats.lastLinkAt).toLocaleDateString()
    : null;

  return (
    <div className="border border-gray-200 rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{family.branch.surname}</h3>
            {family.branch.isVerified && (
              <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                {t('connectedFamilies.verified')}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">{location}</p>
        </div>
        <a
          href={`/branches/${family.branch.id}`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          {t('connectedFamilies.viewBranch')}
        </a>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusChips.map((chip) => (
          <span key={chip.label} className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${chip.color}`}>
            {chip.label}
          </span>
        ))}
      </div>
      {family.stats.pendingLinks > 0 && onShowPendingLinks && (
        <button
          type="button"
          onClick={onShowPendingLinks}
          className="inline-flex items-center text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-3 py-1 hover:bg-amber-100"
        >
          {t('connectedFamilies.reviewPending', { count: family.stats.pendingLinks })}
        </button>
      )}

      {firstLinked && (
        <p className="text-xs text-gray-500">
          {t('connectedFamilies.linkedSince', { date: firstLinked })}
          {lastUpdated && (
            <>
              {' '}
              • {t('connectedFamilies.lastUpdated', { date: lastUpdated })}
            </>
          )}
        </p>
      )}

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">{t('connectedFamilies.bridgesHeading')}</p>
        {family.bridges.length === 0 ? (
          <p className="text-sm text-gray-500">{t('connectedFamilies.noBridges')}</p>
        ) : (
          <ul className="space-y-2">
            {family.bridges.map((bridge) => (
              <li key={bridge.id} className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{bridge.person.fullName}</p>
                  {bridge.person.homeBranch && (
                    <p className="text-xs text-gray-500">
                      {t('connectedFamilies.homeBranch', { branch: bridge.person.homeBranch.surname })}
                    </p>
                  )}
                  {bridge.displayName && (
                    <p className="text-xs text-gray-500">
                      {t('connectedFamilies.displayAs', { name: bridge.displayName })}
                    </p>
                  )}
                  {bridge.notes && (
                    <p className="text-xs text-gray-500 italic mt-1">“{bridge.notes}”</p>
                  )}
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                    bridge.status === 'approved'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {t(`connectedFamilies.bridgeStatus.${bridge.status}`)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
