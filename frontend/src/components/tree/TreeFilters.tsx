import { useTranslation } from 'react-i18next';
import type { TreeFiltersState } from './EnhancedTreeView';
import type { ExtendedTreeNode } from '../../utils/relativesTreeAdapter';

interface TreeFiltersProps {
  filters: TreeFiltersState;
  onFiltersChange: (filters: TreeFiltersState) => void;
  allNodes: ExtendedTreeNode[];
}

export default function TreeFilters({ filters, onFiltersChange, allNodes }: TreeFiltersProps) {
  const { t } = useTranslation();

  // Get unique generations
  const availableGenerations = Array.from(
    new Set(allNodes.map(n => n.generationNumber))
  ).sort((a, b) => a - b);

  const handleGenerationToggle = (gen: number) => {
    const current = filters.generationNumbers;
    const updated = current.includes(gen)
      ? current.filter(g => g !== gen)
      : [...current, gen];

    onFiltersChange({ ...filters, generationNumbers: updated });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      generationNumbers: [],
      showLivingOnly: false,
      showDeceasedOnly: false,
    });
  };

  const hasActiveFilters =
    filters.generationNumbers.length > 0 ||
    filters.showLivingOnly ||
    filters.showDeceasedOnly ||
    filters.geoStateId ||
    filters.geoRegionId ||
    filters.geoCityId;

  return (
    <div className="space-y-4">
      {/* Filter header with clear button */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-sm">
          {t('tree.filters.title', 'Filters')}
        </h3>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {t('tree.filters.clearAll', 'Clear all')}
          </button>
        )}
      </div>

      {/* Generation filter */}
      <div>
        <h4 className="text-xs font-semibold text-gray-700 mb-2">
          {t('tree.filters.generation', 'Generation')}
        </h4>
        <div className="flex flex-wrap gap-2">
          {availableGenerations.map(gen => {
            const count = allNodes.filter(n => n.generationNumber === gen).length;
            const isActive = filters.generationNumbers.includes(gen);

            return (
              <button
                key={gen}
                onClick={() => handleGenerationToggle(gen)}
                className={`px-3 py-1 rounded text-xs font-medium transition touch-manipulation ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                G{gen} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Living/Deceased filter */}
      <div>
        <h4 className="text-xs font-semibold text-gray-700 mb-2">
          {t('tree.filters.lifeStatus', 'Life Status')}
        </h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() =>
              onFiltersChange({
                ...filters,
                showLivingOnly: !filters.showLivingOnly,
                showDeceasedOnly: false,
              })
            }
            className={`px-3 py-1 rounded text-xs font-medium transition touch-manipulation ${
              filters.showLivingOnly
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🟢 {t('tree.filters.livingOnly', 'Living only')}
          </button>
          <button
            onClick={() =>
              onFiltersChange({
                ...filters,
                showDeceasedOnly: !filters.showDeceasedOnly,
                showLivingOnly: false,
              })
            }
            className={`px-3 py-1 rounded text-xs font-medium transition touch-manipulation ${
              filters.showDeceasedOnly
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ⚫ {t('tree.filters.deceasedOnly', 'Deceased only')}
          </button>
        </div>
      </div>

      {/* Geographic filter - TODO: Implement with geo_cities API */}
      {/* <div>
        <h4 className="text-xs font-semibold text-gray-700 mb-2">
          {t('tree.filters.location', 'Location')}
        </h4>
        <div className="text-xs text-gray-500">
          {t('tree.filters.locationComingSoon', 'Geographic filtering coming soon...')}
        </div>
      </div> */}

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="pt-3 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">
            {t('tree.filters.active', 'Active Filters')}
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {filters.generationNumbers.map(gen => (
              <span
                key={gen}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700"
              >
                G{gen}
                <button
                  onClick={() => handleGenerationToggle(gen)}
                  className="hover:text-indigo-900"
                >
                  ✕
                </button>
              </span>
            ))}
            {filters.showLivingOnly && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                🟢 {t('tree.filters.living', 'Living')}
                <button
                  onClick={() => onFiltersChange({ ...filters, showLivingOnly: false })}
                  className="hover:text-green-900"
                >
                  ✕
                </button>
              </span>
            )}
            {filters.showDeceasedOnly && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                ⚫ {t('tree.filters.deceased', 'Deceased')}
                <button
                  onClick={() => onFiltersChange({ ...filters, showDeceasedOnly: false })}
                  className="hover:text-gray-900"
                >
                  ✕
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
