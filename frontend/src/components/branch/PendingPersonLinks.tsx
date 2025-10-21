import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PersonLinkRecord } from '../../types/branch';

interface PendingPersonLinksProps {
  branchId: string;
  links: PersonLinkRecord[];
  onApprove: (linkId: string) => Promise<void>;
  onReject: (linkId: string) => Promise<void>;
}

export default function PendingPersonLinks({ branchId, links, onApprove, onReject }: PendingPersonLinksProps) {
  const { t } = useTranslation();
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (links.length === 0) {
    return null;
  }

  const handleApprove = async (linkId: string) => {
    setProcessingId(linkId);
    try {
      await onApprove(linkId);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (linkId: string) => {
    if (!window.confirm(t('branchDetail.confirmRejectLink'))) {
      return;
    }
    setProcessingId(linkId);
    try {
      await onReject(linkId);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t('branchDetail.pendingPersonLinksTitle')}</h2>
            <p className="text-sm text-gray-500">{t('branchDetail.pendingPersonLinksCaption')}</p>
          </div>
          <span className="text-sm font-semibold text-indigo-600">{links.length}</span>
        </div>
      </div>

      <ul className="divide-y divide-gray-200">
        {links.map((link) => {
          const isSourceBranch = link.sourceBranchId === branchId;
          const awaitingApproval = isSourceBranch ? !link.sourceApprovedBy : !link.targetApprovedBy;
          const personName = link.displayName || link.person.fullName;

          return (
            <li key={link.id} className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {personName}
                  {link.person.maidenName && (
                    <span className="text-sm text-gray-500 ml-2">
                      ({t('branchDetail.maidenNameLabel', { name: link.person.maidenName })})
                    </span>
                  )}
                </p>
                {link.person.homeBranch && (
                  <p className="text-xs text-gray-500">
                    {t('branchDetail.linkHomeBranch', {
                      branch: link.person.homeBranch.surname,
                      city: link.person.homeBranch.cityName || '',
                    })}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {awaitingApproval
                    ? isSourceBranch
                      ? t('branchDetail.awaitingSourceApproval')
                      : t('branchDetail.awaitingTargetApproval')
                    : t('branchDetail.awaitingOtherBranch')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(link.id)}
                  disabled={!awaitingApproval || processingId === link.id}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50"
                >
                  {processingId === link.id ? t('common.loading') : t('branchDetail.approveLink')}
                </button>
                <button
                  onClick={() => handleReject(link.id)}
                  disabled={!awaitingApproval || processingId === link.id}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50"
                >
                  {t('branchDetail.rejectLink')}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
