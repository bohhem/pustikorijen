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

          // Add parent edges
          if (person.fatherId) {
            newEdges.push({
              id: `${branch.branch.id}-father-${person.fatherId}-${person.id}`,
              source: `${branch.branch.id}-${person.fatherId}`,
              target: `${branch.branch.id}-${person.id}`,
              type: 'smoothstep',
              animated: false,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#6366f1',
              },
              style: {
                stroke: '#6366f1',
                strokeWidth: 2,
              },
            });
          }

          if (person.motherId) {
            newEdges.push({
              id: `${branch.branch.id}-mother-${person.motherId}-${person.id}`,
              source: `${branch.branch.id}-${person.motherId}`,
              target: `${branch.branch.id}-${person.id}`,
              type: 'smoothstep',
              animated: false,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#ec4899',
              },
              style: {
                stroke: '#ec4899',
                strokeWidth: 2,
              },
            });
          }
        });
      });

      // Add partnership edges
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
              strokeWidth: 3,
              strokeDasharray: isActive ? '0' : '5 5',
            },
            label: partnership.partnershipType === 'marriage' ? '💑' : '🤝',
          });
        }
      });
    };

    // Create nodes for main branch (index 0)
    createBranchNodes(treeData.mainBranch, 0);

    // Create nodes for connected branches (index 1, 2, 3...)
    treeData.connectedBranches.forEach((connectedBranch, index) => {
      createBranchNodes(connectedBranch, index + 1);
    });

    // Add bridge connection edges (yellow lines between branches)
    treeData.connectedBranches.forEach((connectedBranch) => {
      connectedBranch.bridgeLinks.forEach((bridgeLink) => {
        const mainNodeId = `${treeData.mainBranch.branch.id}-${bridgeLink.personId}`;
        const connectedNodeId = `${connectedBranch.branch.id}-${bridgeLink.personId}`;

        // Check if both nodes exist
        const hasMainNode = treeData.mainBranch.persons.some(p => p.id === bridgeLink.personId);
        const hasConnectedNode = connectedBranch.persons.some(p => p.id === bridgeLink.personId);

        if (hasMainNode && hasConnectedNode) {
          newEdges.push({
            id: `bridge-${bridgeLink.linkId}`,
            source: mainNodeId,
            target: connectedNodeId,
            type: 'straight',
            animated: true,
            style: {
              stroke: '#f59e0b', // amber-500
              strokeWidth: 4,
              strokeDasharray: '10 5',
            },
            label: '🌉',
            labelStyle: {
              fontSize: 20,
              fontWeight: 'bold',
            },
            labelBgStyle: {
              fill: '#fef3c7', // amber-100
              fillOpacity: 0.9,
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
    <div className="w-full h-[700px] bg-gray-50 rounded-lg border border-gray-200">
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

        {/* View Mode Controls */}
        <Panel position="top-left" className="bg-white rounded-lg shadow-lg p-4 space-y-2">
          <h3 className="font-semibold text-gray-900 text-sm mb-2">View Mode</h3>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleViewModeChange('network')}
              className={`px-3 py-2 rounded text-xs font-medium transition ${
                viewMode === 'network'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Network view - See all branches"
            >
              🌐 Network ({branchCount} branches)
            </button>
            <button
              onClick={() => handleViewModeChange('branches')}
              className={`px-3 py-2 rounded text-xs font-medium transition ${
                viewMode === 'branches'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Branch view - See all persons in branches"
            >
              🌳 Branches ({totalPersons} persons)
            </button>
            <button
              onClick={() => handleViewModeChange('focus')}
              className={`px-3 py-2 rounded text-xs font-medium transition ${
                viewMode === 'focus'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Person focus - Zoom to individual person"
            >
              👤 Person Focus
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

        {/* Legend */}
        <Panel position="top-right" className="bg-white rounded-lg shadow-lg p-4">
          <h3 className="font-semibold text-gray-900 text-sm mb-2">Legend</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-indigo-500"></div>
              <span className="text-gray-700">Father connection</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-pink-500"></div>
              <span className="text-gray-700">Mother connection</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-green-500"></div>
              <span className="text-gray-700">Active partnership 💑</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-amber-500" style={{ backgroundImage: 'linear-gradient(to right, #f59e0b 50%, transparent 50%)', backgroundSize: '8px 2px', height: '2px' }}></div>
              <span className="text-gray-700">Bridge connection 🌉</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-400"></div>
              <span className="text-gray-700">Bridge person</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
