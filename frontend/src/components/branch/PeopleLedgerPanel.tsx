import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getPeopleLedger } from '../../api/geo';
import type { PeopleLedgerEntry } from '../../types/geo';

interface PeopleLedgerPanelProps {
  regionId?: string;
  onSelect?: (entry: PeopleLedgerEntry) => void;
  title?: string;
  subtitle?: string;
}

export default function PeopleLedgerPanel({
  regionId,
  onSelect,
  title,
  subtitle,
}: PeopleLedgerPanelProps) {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<PeopleLedgerEntry[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLedger = useCallback(
    async (region: string, query?: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPeopleLedger(region, { q: query, limit: 200 });
        setEntries(data);
      } catch (err: any) {
        setError(err?.response?.data?.error || t('ledger.loadError'));
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    if (regionId) {
      void fetchLedger(regionId);
    } else {
      setEntries([]);
    }
  }, [regionId, fetchLedger]);

  const filteredEntries = useMemo(() => {
    if (!search.trim()) {
      return entries;
    }
    const s = search.trim().toLowerCase();
    return entries.filter(
      (entry) =>
        entry.fullName.toLowerCase().includes(s) ||
        (entry.branchName && entry.branchName.toLowerCase().includes(s)) ||
        (entry.cityName && entry.cityName.toLowerCase().includes(s))
    );
  }, [entries, search]);

  return (
    <section className="bg-white shadow rounded-lg h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          {title ?? t('ledger.title')}
        </h3>
        <p className="text-sm text-gray-600">
          {subtitle ?? t('ledger.subtitle')}
        </p>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('ledger.searchPlaceholder')}
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border text-sm"
            disabled={!regionId}
          />
          <button
            type="button"
            onClick={() => regionId && fetchLedger(regionId, search)}
            className="px-3 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            disabled={!regionId || loading}
          >
            {loading ? t('common.loading') : t('common.refresh')}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!regionId ? (
          <p className="text-sm text-gray-500 p-4">{t('ledger.noRegionSelected')}</p>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-600 p-4">{error}</p>
        ) : filteredEntries.length === 0 ? (
          <p className="text-sm text-gray-500 p-4">{t('ledger.empty')}</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredEntries.map((entry) => (
              <li key={entry.personId} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {entry.fullName}
                      {entry.approxAge ? (
                        <span className="ml-2 text-gray-500 text-xs">
                          ~{entry.approxAge}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-gray-500">
                      {entry.branchName} • {entry.cityName || entry.regionName || t('ledger.unknownLocation')}
                    </p>
                  </div>
                  {onSelect && (
                    <button
                      type="button"
                      onClick={() => onSelect(entry)}
                      className="text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      {t('ledger.claimAction')}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
