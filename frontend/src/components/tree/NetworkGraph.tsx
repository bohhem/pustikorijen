import { useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  MiniMap,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import PersonNode from './PersonNode';
import BridgePersonNode from './BridgePersonNode';
import type { MultiBranchTreeResponse } from '../../types/branch';
import type { ExtendedTreeNode } from '../../utils/relativesTreeAdapter';

interface NetworkGraphProps {
  nodes: ExtendedTreeNode[];
  treeData: MultiBranchTreeResponse;
  onPersonSelect: (node: ExtendedTreeNode) => void;
  focusPersonId?: string;
  showLegend?: boolean;
}

const nodeTypes = {
  person: PersonNode,
  bridge: BridgePersonNode,
};

// Helper to identify family groups (parents + their children)
interface FamilyGroup {
  id: string;
  parentIds: string[];
  childrenIds: string[];
  generation: number;
  branchId: string;
}

function ViewportToolbar() {
  const instance = useReactFlow();

  return (
    <div className="flex items-center gap-2 bg-white/90 border border-slate-200 rounded-full px-3 py-1 shadow-sm text-xs font-semibold text-slate-600">
      <button
        type="button"
        onClick={() => instance.zoomIn({ duration: 300 })}
        className="px-2 py-1 rounded-full hover:bg-slate-100"
      >
        +
      </button>
      <button
        type="button"
        onClick={() => instance.zoomOut({ duration: 300 })}
        className="px-2 py-1 rounded-full hover:bg-slate-100"
      >
        −
      </button>
      <button
        type="button"
        onClick={() => instance.fitView({ padding: 0.2, duration: 350 })}
        className="px-2 py-1 rounded-full hover:bg-slate-100"
      >
        Fit
      </button>
    </div>
  );
}

function GraphInner({
  onNodesChange,
  onEdgesChange,
  flowNodes,
  flowEdges,
}: {
  onNodesChange: ReturnType<typeof useNodesState>[2];
  onEdgesChange: ReturnType<typeof useEdgesState>[2];
  flowNodes: Node[];
  flowEdges: Edge[];
}) {
  return (
    <ReactFlow
      nodes={flowNodes}
      edges={flowEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      minZoom={0.1}
      maxZoom={2}
      defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
    >
      <Background color="#e5e7eb" gap={16} />
      <MiniMap zoomable pannable className="bg-white/80" />
      <Panel position="top-right">
        <ViewportToolbar />
      </Panel>
    </ReactFlow>
  );
}

export default function NetworkGraph({
  nodes: filteredNodes,
  treeData,
  onPersonSelect,
  focusPersonId,
}: NetworkGraphProps) {
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState([]);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (filteredNodes.length === 0) return;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    const VERTICAL_SPACING = 250;
    const HORIZONTAL_SPACING = 220;
    const BRANCH_GAP = 100; // Gap between branches
    const FAMILY_GROUP_PADDING = 40;

    // Build generation map
    const generationMap = new Map<number, ExtendedTreeNode[]>();
    filteredNodes.forEach(node => {
      const gen = node.generationNumber;
      if (!generationMap.has(gen)) {
        generationMap.set(gen, []);
      }
      generationMap.get(gen)!.push(node);
    });

    const generations = Array.from(generationMap.keys()).sort((a, b) => a - b);

    // Track branch offsets - calculate based on actual branch widths
    const branchIds = Array.from(new Set(filteredNodes.map(n => n.branchId)));
    const branchOffsets = new Map<string, number>();
    const branchWidths = new Map<string, number>();

    // Calculate width for each branch (max people in any generation)
    branchIds.forEach(branchId => {
      const branchNodes = filteredNodes.filter(n => n.branchId === branchId);
      const branchGenMap = new Map<number, number>();
      branchNodes.forEach(node => {
        const count = branchGenMap.get(node.generationNumber) || 0;
        branchGenMap.set(node.generationNumber, count + 1);
      });
      const maxInGeneration = Math.max(...Array.from(branchGenMap.values()));
      const width = maxInGeneration * HORIZONTAL_SPACING;
      branchWidths.set(branchId, width);
    });

    // Calculate cumulative offsets
    let cumulativeOffset = 100;
    branchIds.forEach(branchId => {
      branchOffsets.set(branchId, cumulativeOffset);
      cumulativeOffset += branchWidths.get(branchId)! + BRANCH_GAP;
    });

    // Create nodes
    generations.forEach((gen, genIndex) => {
      const personsInGen = generationMap.get(gen)!;
      const yPosition = genIndex * VERTICAL_SPACING + 50;

      // Group persons by branch within this generation
      const personsByBranch = new Map<string, ExtendedTreeNode[]>();
      personsInGen.forEach(node => {
        if (!personsByBranch.has(node.branchId)) {
          personsByBranch.set(node.branchId, []);
        }
        personsByBranch.get(node.branchId)!.push(node);
      });

      // Position each branch's persons
      personsByBranch.forEach((branchPersons, branchId) => {
        const branchOffset = branchOffsets.get(branchId) || 0;

        branchPersons.forEach((node, indexInBranch) => {
          const xPosition = indexInBranch * HORIZONTAL_SPACING + branchOffset;

        const isFocused = node.id === focusPersonId;

        newNodes.push({
          id: node.id,
          type: node.isBridge ? 'bridge' : 'person',
          position: { x: xPosition, y: yPosition },
          data: {
            person: {
              id: node.id,
              fullName: node.fullName,
              givenName: node.givenName,
              surname: node.surname,
              maidenName: node.maidenName,
              generation: node.generation,
              generationNumber: node.generationNumber,
              fatherId: node.parents?.find(p => p.id)?.id,
              motherId: node.parents?.find(p => p.id)?.id,
              birthDate: node.birthDate,
              deathDate: node.deathDate,
              profilePhotoUrl: node.profilePhotoUrl,
              branchId: node.branchId,
              isAlive: node.isAlive,
            },
            branchSurname: node.isBridge ? node.linkedFromBranch?.surname : undefined,
            onSelect: () => onPersonSelect(node),
          },
          style: isFocused
            ? {
                boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.5)',
                borderColor: '#6366f1',
              }
            : undefined,
        });

        // Add parent edges
        node.parents?.forEach((parent) => {
          const parentNode = filteredNodes.find(n => n.id === parent.id);
          if (!parentNode) return;

          // Determine if this is father or mother based on gender
          const isFather = parentNode.gender === 'male';
          const color = isFather ? '#6366f1' : '#ec4899';

          newEdges.push({
            id: `parent-${parent.id}-${node.id}`,
            source: parent.id,
            target: node.id,
            type: 'smoothstep',
            animated: node.isBridge,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color,
              width: 15,
              height: 15,
            },
            style: {
              stroke: color,
              strokeWidth: node.isBridge ? 3 : 2.5,
              strokeDasharray: node.isBridge ? '8 4' : '0',
              opacity: node.isBridge ? 0.95 : 0.85,
            },
            label: isFather ? (node.isBridge ? '👨🌉' : '👨') : (node.isBridge ? '👩🌉' : '👩'),
            labelStyle: {
              fontSize: node.isBridge ? 14 : 12,
              fill: color,
              fontWeight: 600,
            },
            labelBgStyle: {
              fill: isFather ? (node.isBridge ? '#f3e8ff' : '#eef2ff') : (node.isBridge ? '#fdf4ff' : '#fdf2f8'),
              fillOpacity: 0.95,
            },
          });
        });

        // Add spouse edges
        node.spouses?.forEach((spouse) => {
          // Only add edge once (avoid duplicates)
          if (spouse.id > node.id) return;

          const spouseNode = filteredNodes.find(n => n.id === spouse.id);
          if (!spouseNode) return;

          const isMarried = spouse.type === 'married';
          const edgeColor = isMarried ? '#10b981' : '#94a3b8';

          newEdges.push({
            id: `spouse-${node.id}-${spouse.id}`,
            source: node.id,
            target: spouse.id,
            type: 'straight',
            animated: isMarried,
            style: {
              stroke: edgeColor,
              strokeWidth: 3.5,
              strokeDasharray: isMarried ? '0' : '8 4',
              opacity: isMarried ? 0.9 : 0.6,
            },
            label: isMarried ? '💑' : '🤝',
            labelStyle: {
              fontSize: 14,
              fontWeight: 600,
            },
            labelBgStyle: {
              fill: isMarried ? '#d1fae5' : '#f1f5f9',
              fillOpacity: 0.95,
            },
          });
        });
        });
      });
    });

    // Add bridge connection edges (inter-branch connections)
    treeData.connectedBranches.forEach((connectedBranch) => {
      connectedBranch.bridgeLinks.forEach((bridgeLink) => {
        const person = filteredNodes.find(n => n.id === bridgeLink.personId);
        if (!person) return;

        const isPrimary = bridgeLink.isPrimary;

        newEdges.push({
          id: `bridge-${bridgeLink.linkId}`,
          source: bridgeLink.personId,
          target: bridgeLink.personId, // Self-loop indicating bridge
          type: 'default',
          animated: true,
          style: {
            stroke: isPrimary ? '#f59e0b' : '#fbbf24',
            strokeWidth: isPrimary ? 6 : 5,
            strokeDasharray: isPrimary ? '0' : '12 8',
            opacity: 1,
            filter: isPrimary
              ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))'
              : 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.4))',
          },
          label: isPrimary ? '🌉 ⭐' : '🌉',
          labelStyle: {
            fontSize: isPrimary ? 14 : 12,
            fontWeight: 'bold',
            fill: '#92400e',
          },
          labelBgStyle: {
            fill: isPrimary ? '#fef3c7' : '#fef9e7',
            fillOpacity: 1,
            stroke: '#f59e0b',
            strokeWidth: 1.5,
          },
        });
      });
    });

    // Create family grouping background nodes
    // Identify couples (partnerships) and their children
    const familyGroups: FamilyGroup[] = [];
    const nodesMap = new Map(newNodes.map(n => [n.id, n]));

    filteredNodes.forEach(node => {
      // For each person with spouses, create a family group
      if (node.spouses && node.spouses.length > 0) {
        node.spouses.forEach(spouse => {
          const spouseNode = filteredNodes.find(n => n.id === spouse.id);
          if (!spouseNode) return;

          // Find shared children
          const sharedChildren: string[] = [];
          filteredNodes.forEach(potentialChild => {
            const hasNodeAsParent = potentialChild.parents?.some(p => p.id === node.id);
            const hasSpouseAsParent = potentialChild.parents?.some(p => p.id === spouse.id);
            if (hasNodeAsParent && hasSpouseAsParent) {
              sharedChildren.push(potentialChild.id);
            }
          });

          // Only create family group if there are children
          if (sharedChildren.length > 0) {
            const familyId = `family-${[node.id, spouse.id].sort().join('-')}`;

            // Check if we already added this family group
            if (!familyGroups.find(fg => fg.id === familyId)) {
              familyGroups.push({
                id: familyId,
                parentIds: [node.id, spouse.id],
                childrenIds: sharedChildren,
                generation: node.generationNumber,
                branchId: node.branchId,
              });
            }
          }
        });
      }
    });

    // Create background nodes for family groups
    const familyGroupNodes: Node[] = [];
    familyGroups.forEach(family => {
      // Get positions of all family members
      const memberNodes = [
        ...family.parentIds.map(id => nodesMap.get(id)),
        ...family.childrenIds.map(id => nodesMap.get(id)),
      ].filter(Boolean) as Node[];

      if (memberNodes.length === 0) return;

      // Calculate bounding box
      const positions = memberNodes.map(n => n.position);
      const minX = Math.min(...positions.map(p => p.x)) - FAMILY_GROUP_PADDING;
      const maxX = Math.max(...positions.map(p => p.x)) + FAMILY_GROUP_PADDING;
      const minY = Math.min(...positions.map(p => p.y)) - FAMILY_GROUP_PADDING;
      const maxY = Math.max(...positions.map(p => p.y)) + FAMILY_GROUP_PADDING;

      const width = maxX - minX;
      const height = maxY - minY;

      // Create a custom background node (using a special type that renders as a rectangle)
      familyGroupNodes.push({
        id: family.id,
        type: 'group',
        position: { x: minX, y: minY },
        style: {
          width,
          height,
          backgroundColor: 'rgba(99, 102, 241, 0.05)', // Very light indigo
          border: '1px solid rgba(99, 102, 241, 0.1)',
          borderRadius: '12px',
          zIndex: -1,
          pointerEvents: 'none',
        },
        data: { label: '' },
        selectable: false,
        draggable: false,
      });
    });

    // Add family group nodes first (so they render behind person nodes)
    setFlowNodes([...familyGroupNodes, ...newNodes]);
    setFlowEdges(newEdges);
  }, [filteredNodes, treeData, onPersonSelect, focusPersonId]);

  return (
    <div className="w-full h-full relative">
      <ReactFlowProvider>
        <GraphInner
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          flowNodes={flowNodes}
          flowEdges={flowEdges}
        />
      </ReactFlowProvider>
    </div>
  );
}
