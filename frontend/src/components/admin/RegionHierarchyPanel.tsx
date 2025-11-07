import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAdminRegionTree } from '../../api/admin';
import type { AdminRegionTreeNode } from '../../types/admin';

interface RegionHierarchyPanelProps {
  selectedRegionId?: string | null;
  onSelect?: (regionId: string) => void;
  className?: string;
  title?: string;
  subtitle?: string;
  defaultExpandedLevel?: number;
  emptyHint?: string;
}

export default function RegionHierarchyPanel({
  selectedRegionId,
  onSelect,
  className,
  title,
  subtitle,
  defaultExpandedLevel = 1,
  emptyHint,
}: RegionHierarchyPanelProps) {
  const { t } = useTranslation();
  const [tree, setTree] = useState<AdminRegionTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let ignore = false;

    const loadTree = async () => {
      try {
        setLoading(true);
        const response = await getAdminRegionTree();
        if (ignore) return;
        setTree(response);

        // Expand default levels
        const defaults: Record<string, boolean> = {};
        const markDefaults = (node: AdminRegionTreeNode) => {
          if (node.level <= defaultExpandedLevel) {
            defaults[node.id] = true;
          }
          node.children.forEach(markDefaults);
        };
        response.forEach(markDefaults);
        setExpandedNodes(defaults);
      } catch (err) {
        console.error('Failed to load region hierarchy', err);
        if (!ignore) {
          setError(t('admin.manageRegions.hierarchyError', 'Unable to load region hierarchy.'));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadTree();
    return () => {
      ignore = true;
    };
  }, [defaultExpandedLevel, t]);

  const handleToggle = useCallback((id: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? false),
    }));
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      onSelect?.(id);
    },
    [onSelect]
  );

  const renderNodes = useCallback(
    (nodes: AdminRegionTreeNode[], depth = 0): JSX.Element[] =>
      nodes.map((node) => {
        const hasChildren = node.children.length > 0;
        const isExpanded = expandedNodes[node.id] ?? depth < defaultExpandedLevel;
        const isSelected = selectedRegionId === node.id;

        return (
          <div key={node.id} className="space-y-1">
            <div
              className={`flex items-center gap-2 rounded-lg px-2 py-1 transition ${
                isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
              }`}
              data-testid={`region-node-${node.id}`}
            >
              {hasChildren && (
                <button
                  type="button"
                  onClick={() => handleToggle(node.id)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                  aria-label={
                    isExpanded
                      ? t('admin.accessibility.collapseRegion', 'Collapse region')
                      : t('admin.accessibility.expandRegion', 'Expand region')
                  }
                >
                  {isExpanded ? '−' : '+'}
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSelect(node.id)}
                className="flex-1 text-left"
              >
                <p className={`text-sm font-medium ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                  {node.name}
                </p>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">{node.code}</p>
              </button>
            </div>
            {hasChildren && isExpanded && (
              <div className="ml-4 border-l border-slate-100 pl-3 space-y-1">
                {renderNodes(node.children, depth + 1)}
              </div>
            )}
          </div>
        );
      }),
    [defaultExpandedLevel, expandedNodes, handleSelect, handleToggle, selectedRegionId, t]
  );

  const containerClasses = useMemo(
    () =>
      [
        'bg-white',
        'border',
        'border-slate-200',
        'rounded-xl',
        'shadow-sm',
        'p-4',
        'space-y-3',
        'max-h-[520px]',
        'overflow-y-auto',
        className,
      ]
        .filter(Boolean)
        .join(' '),
    [className]
  );

  return (
    <div className={containerClasses} data-testid="region-hierarchy-panel">
      {(title || subtitle) && (
        <div>
          {title && <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>}
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      )}

      {loading && <p className="text-sm text-slate-500">{t('common.loading', 'Loading...')}</p>}
      {!loading && error && <p className="text-sm text-rose-600">{error}</p>}
      {!loading && !error && tree.length === 0 && (
        <p className="text-sm text-slate-500">
          {emptyHint ?? t('admin.manageRegions.noRegions', 'No regions available in the hierarchy.')}
        </p>
      )}
      {!loading && !error && tree.length > 0 && <div className="space-y-1">{renderNodes(tree)}</div>}
    </div>
  );
}
