import { useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import PersonNode from './PersonNode';
import BridgePersonNode from './BridgePersonNode';
import type { MultiBranchTreeResponse, MultiBranchTreePerson, MultiBranchTreeBranch } from '../../types/branch';

interface MultiBranchTreeViewProps {
  treeData: MultiBranchTreeResponse;
  onPersonSelect?: (person: MultiBranchTreePerson) => void;
}

const nodeTypes = {
  person: PersonNode,
  bridge: BridgePersonNode,
};

type ViewMode = 'network' | 'branches' | 'focus';

export default function MultiBranchTreeView({ treeData, onPersonSelect }: MultiBranchTreeViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [viewMode, setViewMode] = useState<ViewMode>('branches');
  const [showControls, setShowControls] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  useEffect(() => {
    if (!treeData) return;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    const VERTICAL_SPACING = 250;
    const HORIZONTAL_SPACING = 220;
    const BRANCH_HORIZONTAL_OFFSET = 1500; // Space between branches

    // Helper: Create person nodes for a branch
    const createBranchNodes = (
      branch: MultiBranchTreeBranch,
      branchIndex: number
    ) => {
      const { persons, partnerships, bridgeLinks } = branch;

      // Build generation map
      const generationMap = new Map<number, MultiBranchTreePerson[]>();
      persons.forEach(person => {
        const gen = person.generationNumber || 1;
        if (!generationMap.has(gen)) {
          generationMap.set(gen, []);
        }
        generationMap.get(gen)!.push(person);
      });

      const generations = Array.from(generationMap.keys()).sort((a, b) => a - b);
      const branchXOffset = branchIndex * BRANCH_HORIZONTAL_OFFSET;

      // Track bridge person IDs
      const bridgePersonIds = new Set(bridgeLinks.map(bl => bl.personId));

      generations.forEach((gen, genIndex) => {
        const personsInGen = generationMap.get(gen)!;
        const yPosition = genIndex * VERTICAL_SPACING + 50;

        personsInGen.forEach((person, personIndex) => {
          const xPosition = personIndex * HORIZONTAL_SPACING + 100 + branchXOffset;
          const isBridgePerson = bridgePersonIds.has(person.id);

          newNodes.push({
            id: `${branch.branch.id}-${person.id}`,
            type: isBridgePerson ? 'bridge' : 'person',
            position: { x: xPosition, y: yPosition },
            data: {
              person,
              branchSurname: isBridgePerson ? branch.branch.surname : undefined,
              onSelect: onPersonSelect,
            },
          });

          // Add parent edges (inner-branch relationships)
          // Special styling for bridge person -> parent connections
          if (person.fatherId) {
            const fatherColor = isBridgePerson ? '#8b5cf6' : '#6366f1'; // purple for bridge, indigo for normal
            newEdges.push({
              id: `${branch.branch.id}-father-${person.fatherId}-${person.id}`,
              source: `${branch.branch.id}-${person.fatherId}`,
              target: `${branch.branch.id}-${person.id}`,
              type: 'smoothstep',
              animated: isBridgePerson, // Animate bridge person parent connections
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: fatherColor,
                width: 15,
                height: 15,
              },
              style: {
                stroke: fatherColor,
                strokeWidth: isBridgePerson ? 3 : 2.5,
                strokeDasharray: isBridgePerson ? '8 4' : '0', // Dashed for bridge persons
                opacity: isBridgePerson ? 0.95 : 0.85,
              },
              label: isBridgePerson ? '👨🌉' : '👨',
              labelStyle: {
                fontSize: isBridgePerson ? 14 : 12,
                fill: fatherColor,
                fontWeight: 600,
              },
              labelBgStyle: {
                fill: isBridgePerson ? '#f3e8ff' : '#eef2ff', // lighter purple for bridge
                fillOpacity: 0.95,
              },
            });
          }

          if (person.motherId) {
            const motherColor = isBridgePerson ? '#d946ef' : '#ec4899'; // fuchsia for bridge, pink for normal
            newEdges.push({
              id: `${branch.branch.id}-mother-${person.motherId}-${person.id}`,
              source: `${branch.branch.id}-${person.motherId}`,
              target: `${branch.branch.id}-${person.id}`,
              type: 'smoothstep',
              animated: isBridgePerson, // Animate bridge person parent connections
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: motherColor,
                width: 15,
                height: 15,
              },
              style: {
                stroke: motherColor,
                strokeWidth: isBridgePerson ? 3 : 2.5,
                strokeDasharray: isBridgePerson ? '8 4' : '0', // Dashed for bridge persons
                opacity: isBridgePerson ? 0.95 : 0.85,
              },
              label: isBridgePerson ? '👩🌉' : '👩',
              labelStyle: {
                fontSize: isBridgePerson ? 14 : 12,
                fill: motherColor,
                fontWeight: 600,
              },
              labelBgStyle: {
                fill: isBridgePerson ? '#fdf4ff' : '#fdf2f8', // lighter fuchsia for bridge
                fillOpacity: 0.95,
              },
            });
          }
        });
      });

      // Add partnership edges (inner-branch relationships)
      partnerships.forEach((partnership) => {
        const person1 = persons.find(p => p.id === partnership.person1Id);
        const person2 = persons.find(p => p.id === partnership.person2Id);

        if (person1 && person2) {
          const isActive = partnership.status === 'active';
          const edgeColor = isActive ? '#10b981' : '#94a3b8';

          newEdges.push({
            id: `${branch.branch.id}-partnership-${partnership.id}`,
            source: `${branch.branch.id}-${partnership.person1Id}`,
            target: `${branch.branch.id}-${partnership.person2Id}`,
            type: 'straight',
            animated: isActive,
            style: {
              stroke: edgeColor,
              strokeWidth: 3.5,
              strokeDasharray: isActive ? '0' : '8 4',
              opacity: isActive ? 0.9 : 0.6,
            },
            label: partnership.partnershipType === 'marriage' ? '💑' : '🤝',
            labelStyle: {
              fontSize: 14,
              fontWeight: 600,
            },
            labelBgStyle: {
              fill: isActive ? '#d1fae5' : '#f1f5f9',
              fillOpacity: 0.95,
            },
          });
        }
      });
    };

    // Create nodes for main branch (index 0)
    createBranchNodes(treeData.mainBranch, 0);

    // Ensure bridge persons from connected branches also appear in main branch space
    const existingNodeIds = new Set(newNodes.map((node) => node.id));
    let bridgePlaceholderIndex = 0;

    treeData.mainBranch.bridgeLinks?.forEach((bridgeLink) => {
      const nodeId = `${treeData.mainBranch.branch.id}-${bridgeLink.personId}`;
      if (existingNodeIds.has(nodeId)) {
        return;
      }

      const person =
        treeData.mainBranch.persons.find((p) => p.id === bridgeLink.personId) ??
        treeData.connectedBranches
          .flatMap((connectedBranch) => connectedBranch.persons)
          .find((p) => p.id === bridgeLink.personId);

      if (!person) {
        return;
      }

      const displayGeneration = Math.max(
        1,
        bridgeLink.displayGenerationOverride ?? person.generationNumber ?? 1
      );
      const yPosition = (displayGeneration - 1) * VERTICAL_SPACING + 50;
      const xPosition = bridgePlaceholderIndex * HORIZONTAL_SPACING + 100;
      const displayPerson: MultiBranchTreePerson = {
        ...person,
        generationNumber: displayGeneration,
        generation: `G${displayGeneration}`,
      };
      newNodes.push({
        id: nodeId,
        type: 'bridge',
        position: { x: xPosition, y: yPosition },
        data: {
          person: displayPerson,
          branchSurname: treeData.mainBranch.branch.surname,
          onSelect: onPersonSelect,
        },
      });

      existingNodeIds.add(nodeId);
      bridgePlaceholderIndex += 1;
    });

    // Create nodes for connected branches (index 1, 2, 3...)
    treeData.connectedBranches.forEach((connectedBranch, index) => {
      createBranchNodes(connectedBranch, index + 1);
    });

    // Add bridge connection edges (inter-branch connections - visually prominent!)
    treeData.connectedBranches.forEach((connectedBranch) => {
      connectedBranch.bridgeLinks.forEach((bridgeLink) => {
        const mainNodeId = `${treeData.mainBranch.branch.id}-${bridgeLink.personId}`;
        const connectedNodeId = `${connectedBranch.branch.id}-${bridgeLink.personId}`;

        // Check if both nodes exist in the prepared node list
        const hasMainNode = newNodes.some((node) => node.id === mainNodeId);
        const hasConnectedNode = newNodes.some((node) => node.id === connectedNodeId);

        if (hasMainNode && hasConnectedNode) {
          const isPrimary = Boolean(bridgeLink.isPrimary);

          newEdges.push({
            id: `bridge-${bridgeLink.linkId}`,
            source: mainNodeId,
            target: connectedNodeId,
            type: 'default', // Use bezier curves for inter-branch connections
            animated: true,
            style: {
              stroke: isPrimary ? '#f59e0b' : '#fbbf24', // amber-500 vs amber-400
              strokeWidth: isPrimary ? 6 : 5,
              strokeDasharray: isPrimary ? '0' : '12 8',
              opacity: 1,
              // Add shadow/glow effect for bridge connections
              filter: isPrimary
                ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))'
                : 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.4))',
            },
            label: isPrimary ? '🌉 ⭐ PRIMARY' : '🌉 BRIDGE',
            labelStyle: {
              fontSize: isPrimary ? 14 : 12,
              fontWeight: 'bold',
              fill: '#92400e', // amber-800
            },
            labelBgStyle: {
              fill: isPrimary ? '#fef3c7' : '#fef9e7', // amber-100 vs lighter
              fillOpacity: 1,
              stroke: '#f59e0b',
              strokeWidth: 1.5,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isPrimary ? '#f59e0b' : '#fbbf24',
              width: isPrimary ? 24 : 20,
              height: isPrimary ? 24 : 20,
            },
            markerStart: {
              type: MarkerType.ArrowClosed,
              color: isPrimary ? '#f59e0b' : '#fbbf24',
              width: isPrimary ? 24 : 20,
              height: isPrimary ? 24 : 20,
            },
          });
        }
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [treeData, onPersonSelect]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    // TODO: Implement zoom/pan animation for different view modes
  };

  const branchCount = 1 + treeData.connectedBranches.length;
  const totalPersons = treeData.mainBranch.persons.length +
    treeData.connectedBranches.reduce((sum, b) => sum + b.persons.length, 0);

  return (
    <div className="w-full h-[500px] sm:h-[700px] bg-gray-50 rounded-lg border border-gray-200 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls />

        {/* View Mode Controls Toggle */}
        <Panel position="top-left">
          <button
            onClick={() => setShowControls(!showControls)}
            className="bg-white rounded-lg shadow-lg p-2 touch-manipulation hover:bg-gray-50 transition"
            aria-label="Toggle controls"
            title={showControls ? "Hide view controls" : "Show view controls"}
          >
            {showControls ? '✕' : '☰'}
          </button>
        </Panel>

        {/* View Mode Controls */}
        {showControls && (
          <Panel position="top-left" className="bg-white rounded-lg shadow-lg p-3 sm:p-4 space-y-2 max-w-[280px] mt-12">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 text-sm">View Mode</h3>
              <button
                onClick={() => setShowControls(false)}
                className="text-gray-400 hover:text-gray-600 transition p-1"
                aria-label="Close controls"
              >
                ✕
              </button>
            </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleViewModeChange('network')}
              className={`px-3 py-2 rounded text-xs font-medium transition touch-manipulation ${
                viewMode === 'network'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Network view - See all branches"
            >
              🌐 Network ({branchCount})
            </button>
            <button
              onClick={() => handleViewModeChange('branches')}
              className={`px-3 py-2 rounded text-xs font-medium transition touch-manipulation ${
                viewMode === 'branches'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Branch view - See all persons in branches"
            >
              🌳 Branches ({totalPersons})
            </button>
            <button
              onClick={() => handleViewModeChange('focus')}
              className={`px-3 py-2 rounded text-xs font-medium transition touch-manipulation ${
                viewMode === 'focus'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Person focus - Zoom to individual person"
            >
              👤 Focus
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 text-xs mb-2">Branches</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-indigo-600">{treeData.mainBranch.branch.surname}</span>
                <span className="text-gray-500">({treeData.mainBranch.persons.length})</span>
              </div>
              {treeData.connectedBranches.map((branch) => (
                <div key={branch.branch.id} className="flex items-center justify-between">
                  <span className="text-amber-600">🌉 {branch.branch.surname}</span>
                  <span className="text-gray-500">({branch.persons.length})</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
        )}

        {/* Legend Toggle */}
        <Panel position="top-right">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="bg-white rounded-lg shadow-lg p-2 touch-manipulation hover:bg-gray-50 transition"
            aria-label="Toggle legend"
            title={showLegend ? "Hide legend" : "Show legend"}
          >
            {showLegend ? '✕' : 'ℹ'}
          </button>
        </Panel>

        {/* Legend */}
        {showLegend && (
          <Panel position="top-right" className="bg-white rounded-lg shadow-lg p-3 sm:p-4 max-w-[240px] mt-12">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">Legend</h3>
              <button
                onClick={() => setShowLegend(false)}
                className="text-gray-400 hover:text-gray-600 transition p-1"
                aria-label="Close legend"
              >
                ✕
              </button>
            </div>
          <div className="space-y-4 text-xs">
            {/* Inner-Branch Relationships */}
            <div>
              <h4 className="font-semibold text-gray-700 text-[10px] uppercase tracking-wide mb-2">Within Branch</h4>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-indigo-500 rounded-full"></div>
                  <span className="text-gray-700">👨 Father</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-pink-500 rounded-full"></div>
                  <span className="text-gray-700">👩 Mother</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-purple-500" style={{ backgroundImage: 'linear-gradient(to right, #8b5cf6 50%, transparent 50%)', backgroundSize: '6px 2px' }}></div>
                  <span className="text-gray-700">👨🌉 Bridge parent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-green-500"></div>
                  <span className="text-gray-700">💑 Partnership</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-gray-400" style={{ backgroundImage: 'linear-gradient(to right, #94a3b8 50%, transparent 50%)', backgroundSize: '6px 2px' }}></div>
                  <span className="text-gray-700">💔 Ended</span>
                </div>
              </div>
            </div>

            {/* Inter-Branch Connections */}
            <div className="pt-2 border-t border-gray-200">
              <h4 className="font-semibold text-amber-700 text-[10px] uppercase tracking-wide mb-2">Between Branches</h4>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-amber-500 rounded-full shadow-sm"></div>
                  <span className="text-gray-700">🌉⭐ Primary</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-amber-400" style={{ backgroundImage: 'linear-gradient(to right, #fbbf24 50%, transparent 50%)', backgroundSize: '8px 2px' }}></div>
                  <span className="text-gray-700">🌉 Bridge</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-400 shadow-sm"></div>
                  <span className="text-gray-700">Bridge person</span>
                </div>
              </div>
            </div>
          </div>
        </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
