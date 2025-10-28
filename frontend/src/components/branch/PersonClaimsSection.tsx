import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPersonClaims, resolvePersonClaim } from '../../api/branch';
import type { PersonClaim } from '../../types/branch';
import { useToast } from '../../contexts/ToastContext';

interface PersonClaimsSectionProps {
  branchId: string;
  canModerate: boolean;
}

export default function PersonClaimsSection({ branchId, canModerate }: PersonClaimsSectionProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [claims, setClaims] = useState<PersonClaim[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    if (!canModerate) {
      return;
    }

    let ignore = false;
    const loadClaims = async () => {
      setLoading(true);
      try {
        const data = await getPersonClaims(branchId);
        if (!ignore) {
          setClaims(data);
        }
      } catch (err) {
        console.error('Failed to load person claims', err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void loadClaims();
    return () => {
      ignore = true;
    };
  }, [branchId, canModerate]);

  const handleResolve = async (claimId: string, status: 'approved' | 'rejected') => {
    setResolvingId(claimId);
    try {
      await resolvePersonClaim(branchId, claimId, status);
      setClaims((prev) => prev.filter((claim) => claim.id !== claimId));
      toast.success(
        status === 'approved'
          ? t('branchDetail.claims.approved')
          : t('branchDetail.claims.rejected')
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t('branchDetail.claims.resolveError'));
    } finally {
      setResolvingId(null);
    }
  };

  if (!canModerate) {
    return null;
  }

  return (
    <section className="bg-white shadow rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('branchDetail.claims.title')}</h2>
          <p className="text-sm text-gray-600">{t('branchDetail.claims.subtitle')}</p>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          {claims.length}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : claims.length === 0 ? (
        <p className="text-sm text-gray-500">{t('branchDetail.claims.empty')}</p>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => (
            <div key={claim.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {claim.personName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t('branchDetail.claims.requestedBy', { user: claim.user.fullName })}
                  </p>
                  {claim.message && (
                    <p className="text-sm text-gray-600 mt-2">“{claim.message}”</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(claim.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleResolve(claim.id, 'approved')}
                    disabled={resolvingId === claim.id}
                    className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {resolvingId === claim.id ? t('common.loading') : t('branchDetail.claims.approve')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResolve(claim.id, 'rejected')}
                    disabled={resolvingId === claim.id}
                    className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-60"
                  >
                    {resolvingId === claim.id ? t('common.loading') : t('branchDetail.claims.reject')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
