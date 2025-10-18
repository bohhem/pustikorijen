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
import type { Person } from '../../types/person';

interface FamilyTreeViewProps {
  persons: Person[];
  onPersonSelect: (person: Person) => void;
}

const nodeTypes = {
  person: PersonNode,
};

export default function FamilyTreeView({ persons, onPersonSelect }: FamilyTreeViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedGeneration, setSelectedGeneration] = useState<number | null>(null);

  useEffect(() => {
    if (persons.length === 0) return;

    // Build family tree layout
    const generationMap = new Map<number, Person[]>();

    persons.forEach(person => {
      const gen = person.generationNumber || 1;
      if (!generationMap.has(gen)) {
        generationMap.set(gen, []);
      }
      generationMap.get(gen)!.push(person);
    });

    const generations = Array.from(generationMap.keys()).sort((a, b) => a - b);

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    const VERTICAL_SPACING = 250;
    const HORIZONTAL_SPACING = 280;

    generations.forEach((gen, genIndex) => {
      const personsInGen = generationMap.get(gen)!;
      const yPosition = genIndex * VERTICAL_SPACING + 50;

      personsInGen.forEach((person, personIndex) => {
        const xPosition = personIndex * HORIZONTAL_SPACING + 100;

        newNodes.push({
          id: person.id,
          type: 'person',
          position: { x: xPosition, y: yPosition },
          data: {
            person,
            onSelect: onPersonSelect,
          },
        });

        // Add edges to parents
        if (person.fatherId) {
          newEdges.push({
            id: `${person.fatherId}-${person.id}`,
            source: person.fatherId,
            target: person.id,
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
            id: `${person.motherId}-${person.id}`,
            source: person.motherId,
            target: person.id,
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

    setNodes(newNodes);
    setEdges(newEdges);
  }, [persons, onPersonSelect]);

  const handleGenerationFilter = (gen: number | null) => {
    setSelectedGeneration(gen);

    if (gen === null) {
      // Show all
      setNodes(prevNodes =>
        prevNodes.map(node => ({ ...node, hidden: false }))
      );
    } else {
      // Filter by generation
      setNodes(prevNodes =>
        prevNodes.map(node => ({
          ...node,
          hidden: (node.data as any).person.generationNumber !== gen,
        }))
      );
    }
  };

  // const fitView = useCallback(() => {
  //   const event = new CustomEvent('fitview');
  //   window.dispatchEvent(event);
  // }, []);

  const generations = Array.from(
    new Set(persons.map(p => p.generationNumber || 1))
  ).sort((a, b) => a - b);

  return (
    <div className="w-full h-[700px] bg-gray-50 rounded-lg border border-gray-200">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls />

        <Panel position="top-left" className="bg-white rounded-lg shadow-lg p-4 space-y-2">
          <h3 className="font-semibold text-gray-900 text-sm mb-2">Filter by Generation</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleGenerationFilter(null)}
              className={`px-3 py-1 rounded text-xs font-medium transition ${
                selectedGeneration === null
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({persons.length})
            </button>
            {generations.map(gen => {
              const count = persons.filter(p => (p.generationNumber || 1) === gen).length;
              return (
                <button
                  key={gen}
                  onClick={() => handleGenerationFilter(gen)}
                  className={`px-3 py-1 rounded text-xs font-medium transition ${
                    selectedGeneration === gen
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Gen {gen} ({count})
                </button>
              );
            })}
          </div>
        </Panel>

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
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-700">Male</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pink-500"></div>
              <span className="text-gray-700">Female</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 text-sm">●</span>
              <span className="text-gray-700">Living</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
