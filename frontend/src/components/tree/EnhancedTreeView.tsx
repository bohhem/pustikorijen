import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import PedigreeChart from './PedigreeChart';
import DescendantChart from './DescendantChart';
import NetworkGraph from './NetworkGraph';
import TreeFilters from './TreeFilters';
import PersonSearchBox from './PersonSearchBox';
import type { MultiBranchTreeResponse, MultiBranchTreePerson } from '../../types/branch';
import type { ExtendedTreeNode } from '../../utils/relativesTreeAdapter';
import {
  multiBranchToTreeNodes,
  getAncestorNodes,
  getDescendantNodes,
  getHourglassNodes,
} from '../../utils/relativesTreeAdapter';

interface EnhancedTreeViewProps {
  treeData: MultiBranchTreeResponse;
  onPersonSelect?: (person: MultiBranchTreePerson) => void;
}

export type TreeViewMode = 'pedigree' | 'descendants' | 'hourglass' | 'network';

export interface TreeFiltersState {
  generationNumbers: number[];
  showLivingOnly: boolean;
  showDeceasedOnly: boolean;
  geoStateId?: string;
  geoRegionId?: string;
  geoCityId?: string;
  searchQuery?: string;
  selectedPersonId?: string;
}

export default function EnhancedTreeView({ treeData, onPersonSelect }: EnhancedTreeViewProps) {
  const { t } = useTranslation();

  // View mode state
  const [viewMode, setViewMode] = useState<TreeViewMode>('network');
  const [focusPersonId, setFocusPersonId] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<TreeFiltersState>({
    generationNumbers: [],
    showLivingOnly: false,
    showDeceasedOnly: false,
  });

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  // Convert to relatives-tree format
  const allTreeNodes = useMemo(() => {
    return multiBranchToTreeNodes(treeData);
  }, [treeData]);

  // Apply filters
  const filteredNodes = useMemo(() => {
    let nodes = allTreeNodes;

    // Generation filter
    if (filters.generationNumbers.length > 0) {
      nodes = nodes.filter(node =>
        filters.generationNumbers.includes(node.generationNumber)
      );
    }

    // Living/Deceased filter
    if (filters.showLivingOnly) {
      nodes = nodes.filter(node => node.isAlive);
    }
    if (filters.showDeceasedOnly) {
      nodes = nodes.filter(node => !node.isAlive);
    }

    // Geographic filter
    if (filters.geoCityId) {
      nodes = nodes.filter(node =>
        node.birthPlace?.includes(filters.geoCityId!) ||
        node.currentLocation?.includes(filters.geoCityId!)
      );
    }

    // Search query filter
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      nodes = nodes.filter(node =>
        node.fullName.toLowerCase().includes(query) ||
        node.givenName?.toLowerCase().includes(query) ||
        node.surname?.toLowerCase().includes(query)
      );
    }

    return nodes;
  }, [allTreeNodes, filters]);

  // Get nodes for current view mode
  const viewNodes = useMemo(() => {
    if (!focusPersonId || viewMode === 'network') {
      return filteredNodes;
    }

    switch (viewMode) {
      case 'pedigree':
        return getAncestorNodes(filteredNodes, focusPersonId, 10);
      case 'descendants':
        return getDescendantNodes(filteredNodes, focusPersonId, 10);
      case 'hourglass':
        return getHourglassNodes(filteredNodes, focusPersonId, 10);
      default:
        return filteredNodes;
    }
  }, [filteredNodes, focusPersonId, viewMode]);

  // Auto-select focus person if needed
  useEffect(() => {
    if (!focusPersonId && viewMode !== 'network' && allTreeNodes.length > 0) {
      // Auto-select the oldest generation person
      const oldestGen = Math.min(...allTreeNodes.map(n => n.generationNumber));
      const oldestPerson = allTreeNodes.find(n => n.generationNumber === oldestGen);
      if (oldestPerson) {
        setFocusPersonId(oldestPerson.id);
      }
    }
  }, [focusPersonId, viewMode, allTreeNodes]);

  const handlePersonSelect = (node: ExtendedTreeNode) => {
    setFocusPersonId(node.id);

    // Find the original person object to pass to callback
    const originalPerson = [
      ...treeData.mainBranch.persons,
      ...treeData.connectedBranches.flatMap(b => b.persons),
    ].find(p => p.id === node.id);

    if (originalPerson && onPersonSelect) {
      onPersonSelect(originalPerson);
    }
  };

  const handleViewModeChange = (mode: TreeViewMode) => {
    setViewMode(mode);

    // If switching to network view, clear focus person
    if (mode === 'network') {
      setFocusPersonId(null);
    }
  };

  const handleSearch = (personId: string) => {
    setFocusPersonId(personId);
    setFilters(prev => ({ ...prev, selectedPersonId: personId }));
  };

  const totalPersons = allTreeNodes.length;
  const visiblePersons = viewNodes.length;
  const branchCount = 1 + treeData.connectedBranches.length;

  // Get focus person node
  const focusPersonNode = focusPersonId
    ? allTreeNodes.find(n => n.id === focusPersonId)
    : null;

  return (
    <div className="w-full h-full bg-gray-50 rounded-lg border border-gray-200 flex flex-col">
      {/* Header with controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between p-3 sm:p-4 bg-white border-b border-gray-200">
        <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
          <span className="font-medium">{t('tree.viewModes.selectLabel', 'Visualization')}</span>
          <select
            value={viewMode}
            onChange={(event) => handleViewModeChange(event.target.value as TreeViewMode)}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="network">🌐 {t('tree.viewModes.networkShort', 'Network')}</option>
            <option value="pedigree">⬆️ {t('tree.viewModes.pedigreeShort', 'Ancestors')}</option>
            <option value="descendants">⬇️ {t('tree.viewModes.descendantsShort', 'Descendants')}</option>
            <option value="hourglass">⏳ {t('tree.viewModes.hourglassShort', 'Hourglass')}</option>
          </select>
        </label>

        {/* Search and filter toggles */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <PersonSearchBox
            nodes={allTreeNodes}
            onSelect={handleSearch}
            className="flex-1 sm:w-64"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition touch-manipulation whitespace-nowrap ${
              showFilters
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={t('tree.filters.toggle', 'Toggle Filters')}
          >
            🔍 {t('tree.filters.title', 'Filters')}
          </button>
          <button
            onClick={() => setShowLegend(!showLegend)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition touch-manipulation ${
              showLegend
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={t('tree.legend.toggle', 'Toggle Legend')}
          >
            ℹ️
          </button>
        </div>
      </div>

      {/* Filters panel (collapsible) */}
      {showFilters && (
        <div className="p-3 sm:p-4 bg-gray-50 border-b border-gray-200">
          <TreeFilters
            filters={filters}
            onFiltersChange={setFilters}
            allNodes={allTreeNodes}
          />
        </div>
      )}

      {/* Info bar */}
      <div className="px-3 sm:px-4 py-2 bg-white border-b border-gray-200 text-xs text-gray-600 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span>
            {t('tree.stats.showing', 'Showing')} <strong>{visiblePersons}</strong>{' '}
            {t('tree.stats.of', 'of')} <strong>{totalPersons}</strong>{' '}
            {t('tree.stats.people', 'people')}
          </span>
          <span className="text-gray-400">|</span>
          <span>
            <strong>{branchCount}</strong> {t('tree.stats.branches', 'branches')}
          </span>
        </div>
        {focusPersonNode && viewMode !== 'network' && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500">{t('tree.stats.focusOn', 'Focus:')}</span>
            <strong className="text-indigo-700">{focusPersonNode.fullName}</strong>
          </div>
        )}
      </div>

      {/* Tree visualization area */}
      <div className="flex-1 relative">
        {viewMode === 'network' && (
          <NetworkGraph
            nodes={viewNodes}
            treeData={treeData}
            onPersonSelect={handlePersonSelect}
            focusPersonId={focusPersonId || undefined}
            showLegend={showLegend}
          />
        )}
        {viewMode === 'pedigree' && focusPersonId && (
          <PedigreeChart
            nodes={viewNodes}
            rootPersonId={focusPersonId}
            onPersonSelect={handlePersonSelect}
            showLegend={showLegend}
          />
        )}
        {viewMode === 'descendants' && focusPersonId && (
          <DescendantChart
            nodes={viewNodes}
            rootPersonId={focusPersonId}
            onPersonSelect={handlePersonSelect}
            showLegend={showLegend}
          />
        )}
        {viewMode === 'hourglass' && focusPersonId && (
          <PedigreeChart
            nodes={viewNodes}
            rootPersonId={focusPersonId}
            onPersonSelect={handlePersonSelect}
            showLegend={showLegend}
            mode="hourglass"
          />
        )}
      </div>
    </div>
  );
}
