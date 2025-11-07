import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAdminRegionTree } from '../../api/admin';
import type { AdminRegionTreeNode } from '../../types/admin';

interface AdminRegionSelectorProps {
  value?: string | null;
  onChange: (regionId: string | null, meta: { path: AdminRegionTreeNode[] }) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

function findPath(nodes: AdminRegionTreeNode[], targetId: string, trail: AdminRegionTreeNode[] = []): AdminRegionTreeNode[] | null {
  for (const node of nodes) {
    const nextTrail = [...trail, node];
    if (node.id === targetId) {
      return nextTrail;
    }
    if (node.children.length > 0) {
      const childPath = findPath(node.children, targetId, nextTrail);
      if (childPath) {
        return childPath;
      }
    }
  }
  return null;
}

export default function AdminRegionSelector({
  value,
  onChange,
  disabled,
  required,
  className,
  placeholder,
}: AdminRegionSelectorProps) {
  const { t } = useTranslation();
  const [tree, setTree] = useState<AdminRegionTreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStateId, setSelectedStateId] = useState('');
  const [selectedLevel2Id, setSelectedLevel2Id] = useState('');
  const [selectedLevel3Id, setSelectedLevel3Id] = useState('');

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      try {
        const regions = await getAdminRegionTree();
        if (!ignore) {
          setTree(regions);
        }
      } catch (err) {
        console.error('Failed to load admin region tree', err);
        if (!ignore) {
          setError(t('admin.branches.regionTreeError'));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [t]);

  useEffect(() => {
    if (!value || tree.length === 0) {
      if (!value) {
        setSelectedStateId('');
        setSelectedLevel2Id('');
        setSelectedLevel3Id('');
      }
      return;
    }

    const path = findPath(tree, value);
    if (!path) {
      return;
    }
    setSelectedStateId(path[0]?.id ?? '');
    setSelectedLevel2Id(path[1]?.id ?? '');
    setSelectedLevel3Id(path[2]?.id ?? '');
  }, [tree, value]);

  const level2Options = useMemo(() => {
    if (!selectedStateId) {
      return [];
    }
    const stateNode = tree.find((node) => node.id === selectedStateId);
    return stateNode?.children ?? [];
  }, [selectedStateId, tree]);

  const level3Options = useMemo(() => {
    if (!selectedLevel2Id) {
      return [];
    }
    const level2Node = level2Options.find((node) => node.id === selectedLevel2Id);
    return level2Node?.children ?? [];
  }, [level2Options, selectedLevel2Id]);

  const emitChange = (regionId: string | null) => {
    if (!regionId) {
      onChange(null, { path: [] });
      return;
    }
    const path = findPath(tree, regionId) ?? [];
    onChange(regionId, { path });
  };

  const handleStateChange = (id: string) => {
    setSelectedStateId(id);
    setSelectedLevel2Id('');
    setSelectedLevel3Id('');
    emitChange(id || null);
  };

  const handleLevel2Change = (id: string) => {
    setSelectedLevel2Id(id);
    setSelectedLevel3Id('');
    emitChange(id || (selectedStateId || null));
  };

  const handleLevel3Change = (id: string) => {
    setSelectedLevel3Id(id);
    emitChange(id || (selectedLevel2Id || selectedStateId || null));
  };

  return (
    <div className={className}>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            {t('geoSelector.state')}
            {required ? ' *' : ''}
          </label>
          <select
            value={selectedStateId}
            onChange={(event) => handleStateChange(event.target.value)}
            disabled={disabled || loading || tree.length === 0}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 bg-white disabled:bg-slate-50"
          >
            <option value="">{placeholder ?? t('geoSelector.select')}</option>
            {tree.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
        </div>

        {level2Options.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700">
              {t('geoSelector.regionLevel2')}
            </label>
            <select
              value={selectedLevel2Id}
              onChange={(event) => handleLevel2Change(event.target.value)}
              disabled={disabled || loading}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 bg-white disabled:bg-slate-50"
            >
              <option value="">{t('geoSelector.select')}</option>
              {level2Options.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {level3Options.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700">
              {t('geoSelector.regionLevel3')}
            </label>
            <select
              value={selectedLevel3Id}
              onChange={(event) => handleLevel3Change(event.target.value)}
              disabled={disabled || loading}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 bg-white disabled:bg-slate-50"
            >
              <option value="">{t('geoSelector.select')}</option>
              {level3Options.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
