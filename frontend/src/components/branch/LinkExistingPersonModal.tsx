import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { searchPersonLinkCandidates, requestPersonLink } from '../../api/branch';
import { useToast } from '../../contexts/ToastContext';
import type { PersonLinkCandidate } from '../../types/branch';

interface LinkExistingPersonModalProps {
  branchId: string;
  onClose: () => void;
  onLinked: () => void;
}

export default function LinkExistingPersonModal({ branchId, onClose, onLinked }: LinkExistingPersonModalProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PersonLinkCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadCandidates();
  }, [branchId]);

  const loadCandidates = async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchPersonLinkCandidates(branchId, search, 25);
      setResults(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || t('branchDetail.linkSearchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    await loadCandidates(query.trim() || undefined);
  };

  const handleLink = async (personId: string) => {
    setSubmittingId(personId);
    try {
      await requestPersonLink(branchId, { personId });
      toast.success(t('branchDetail.linkRequestSubmitted'));
      onLinked();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t('branchDetail.linkRequestFailed'));
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t('branchDetail.linkExistingModalTitle')}</h2>
            <p className="text-sm text-gray-500">{t('branchDetail.linkExistingModalSubtitle')}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-4 border-b border-gray-100">
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('branchDetail.linkSearchPlaceholder')}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
            >
              {t('common.search')}
            </button>
          </form>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="px-6 py-10 text-center text-red-600">
              <p>{error}</p>
            </div>
          ) : results.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-500">
              <p>{t('branchDetail.linkNoResults', { query: query || t('common.all').toLowerCase() })}</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {results.map((candidate) => (
                <li key={candidate.id} className="px-6 py-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {candidate.fullName}
                      {candidate.maidenName && (
                        <span className="text-sm text-gray-500 ml-2">
                          ({t('branchDetail.maidenNameLabel', { name: candidate.maidenName })})
                        </span>
                      )}
                    </p>
                    {candidate.homeBranch && (
                      <p className="text-xs text-gray-500">
                        {t('branchDetail.linkHomeBranch', {
                          branch: candidate.homeBranch.surname,
                          city: candidate.homeBranch.cityName || '',
                        })}
                      </p>
                    )}
                    {candidate.birthDate && (
                      <p className="text-xs text-gray-500">
                        {t('branchDetail.linkBirthYear', {
                          year: new Date(candidate.birthDate).getFullYear(),
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLink(candidate.id)}
                      disabled={submittingId === candidate.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {submittingId === candidate.id ? t('common.loading') : t('branchDetail.linkRequestAction')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
