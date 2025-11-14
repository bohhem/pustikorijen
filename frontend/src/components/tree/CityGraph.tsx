import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useTranslation } from 'react-i18next';
import type { ExtendedTreeNode } from '../../utils/relativesTreeAdapter';
import type { CityGraphData, CityGraphLink, CityGraphNode } from '../../utils/cityGraph';

interface CityGraphProps {
  nodes: ExtendedTreeNode[];
  graphData: CityGraphData;
  onPersonSelect: (node: ExtendedTreeNode) => void;
  focusPersonId?: string;
  showLegend?: boolean;
}

type LayoutMode = 'generations' | 'city';

function getStableColor(label?: string) {
  if (!label) return '#93c5fd'; // fallback blue
  let hash = 0;
  for (let i = 0; i < label.length; i += 1) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 60%, 60%)`;
}

function resolveLinkNode(value: CityGraphLink['source']) {
  return typeof value === 'object' ? value : undefined;
}

function linkKey(link: CityGraphLink) {
  const source = resolveLinkNode(link.source);
  const target = resolveLinkNode(link.target);
  const sourceId = source?.id ?? String(link.source);
  const targetId = target?.id ?? String(link.target);
  return `${link.type}-${sourceId}-${targetId}`;
}

function getNodePosition(value: CityGraphLink['source']) {
  const node = resolveLinkNode(value);
  return {
    x: node?.x ?? 0,
    y: node?.y ?? 0,
  };
}

function formatLifeSpan(
  node: ExtendedTreeNode,
  translate: (key: string, defaultValue?: string) => string
) {
  const birth = node.birthDate;
  const death = node.deathDate;
  if (!birth && !death) {
    return node.isAlive ? translate('tree.city.lifeLiving', 'Living') : translate('tree.city.lifeUnknown', 'Unknown dates');
  }
  const endLabel = node.isAlive ? translate('tree.city.lifePresent', 'Present') : (death || translate('tree.city.lifeUnknown', 'Unknown'));
  return `${birth || translate('tree.city.lifeUnknown', 'Unknown')} – ${endLabel}`;
}

function formatLocation(node: ExtendedTreeNode, translate: (key: string, defaultValue?: string) => string) {
  if (node.currentLocation) return node.currentLocation;
  if (node.birthPlace) return node.birthPlace;
  return translate('tree.city.locationUnknown', 'Unknown location');
}

export default function CityGraph({
  nodes,
  graphData,
  onPersonSelect,
  focusPersonId,
  showLegend,
}: CityGraphProps) {
  const { t } = useTranslation();
  const translate = (key: string, defaultValue?: string) => t(key, { defaultValue });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgSelectionRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const groupRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const simulationRef = useRef<d3.Simulation<CityGraphNode, CityGraphLink> | null>(null);
  const linkSelectionRef = useRef<d3.Selection<SVGLineElement, CityGraphLink, SVGGElement, unknown> | null>(null);
  const nodeSelectionRef = useRef<d3.Selection<SVGGElement, CityGraphNode, SVGGElement, unknown> | null>(null);
  const generationForceYRef = useRef<d3.ForceY<CityGraphNode>>();
  const generationForceXRef = useRef<d3.ForceX<CityGraphNode>>();
  const centerForceRef = useRef<d3.ForceCenter<CityGraphNode>>();

  const [layoutMode, setLayoutMode] = useState<LayoutMode>('generations');
  const [isFrozen, setIsFrozen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const nodeLookup = useMemo(() => new Map(nodes.map(node => [node.id, node])), [nodes]);
  const graphNodes = graphData.nodes;
  const graphLinks = graphData.links;
  const selectedNode = selectedNodeId ? nodeLookup.get(selectedNodeId) : undefined;

  useEffect(() => {
    if (selectedNodeId && !graphNodes.some(node => node.id === selectedNodeId)) {
      setSelectedNodeId(null);
    }
  }, [graphNodes, selectedNodeId]);

  // Initialize SVG + simulation
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || container.offsetWidth || 800;
    const height = container.clientHeight || container.offsetHeight || 600;

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`);

    const group = svg.append('g');

    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on('zoom', (event) => {
        group.attr('transform', event.transform);
        group
          .selectAll<SVGTextElement, CityGraphNode>('text')
          .style('display', event.transform.k < 0.7 ? 'none' : 'block');
      });

    svg.call(zoomBehavior).on('dblclick.zoom', null);
    svg.on('click', () => {
      setSelectedNodeId(null);
    });

    const generationForceY = d3.forceY<CityGraphNode>(node => node.generationNumber * 180).strength(0.8);
    const generationForceX = d3.forceX<CityGraphNode>(width / 2).strength(0.1);
    const centerForce = d3.forceCenter<CityGraphNode>(width / 2, height / 2);

    const simulation = d3
      .forceSimulation<CityGraphNode>()
      .force(
        'link',
        d3
          .forceLink<CityGraphNode, CityGraphLink>()
          .id(d => d.id)
          .distance(link => (link.type === 'partnership' ? 60 : 100))
          .strength(link => (link.type === 'partnership' ? 1 : 0.5))
      )
      .force('charge', d3.forceManyBody().strength(-400))
      .force('collide', d3.forceCollide<CityGraphNode>().radius(30))
      .force('y', generationForceY)
      .force('x', generationForceX);

    simulation.on('tick', () => {
      const linkSelection = linkSelectionRef.current;
      const nodeSelection = nodeSelectionRef.current;
      if (linkSelection) {
        linkSelection
          .attr('x1', d => getNodePosition(d.source).x)
          .attr('y1', d => getNodePosition(d.source).y)
          .attr('x2', d => getNodePosition(d.target).x)
          .attr('y2', d => getNodePosition(d.target).y);
      }
      if (nodeSelection) {
        nodeSelection.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
      }
    });

    svgSelectionRef.current = svg;
    zoomBehaviorRef.current = zoomBehavior;
    groupRef.current = group;
    simulationRef.current = simulation;
    generationForceXRef.current = generationForceX;
    generationForceYRef.current = generationForceY;
    centerForceRef.current = centerForce;

    return () => {
      simulation.stop();
      svg.remove();
      linkSelectionRef.current = null;
      nodeSelectionRef.current = null;
    };
  }, []);

  // Update nodes + links when data changes
  useEffect(() => {
    const simulation = simulationRef.current;
    const group = groupRef.current;
    if (!simulation || !group) return;

    simulation.nodes(graphNodes);
    const linkForce = simulation.force<d3.ForceLink<CityGraphNode, CityGraphLink>>('link');
    if (linkForce) {
      linkForce.links(graphLinks);
    }

    const linkSelection = group
      .selectAll<SVGLineElement, CityGraphLink>('line.relationship')
      .data(graphLinks, linkKey)
      .join(enter =>
        enter
          .append('line')
          .attr('class', 'relationship')
      )
      .attr('stroke', d => (d.type === 'partnership' ? '#ff69b4' : '#999'))
      .attr('stroke-width', d => (d.type === 'partnership' ? 3 : 1.5))
      .attr('stroke-dasharray', d => (d.type === 'partnership' && d.partnershipStatus !== 'married' ? '5,5' : '0'))
      .attr('stroke-opacity', d => (d.type === 'partnership' ? 0.8 : 0.6));

    linkSelectionRef.current = linkSelection;

    const nodeSelection = group
      .selectAll<SVGGElement, CityGraphNode>('g.city-node')
      .data(graphNodes, d => d.id)
      .join(enter => {
        const nodeEnter = enter
          .append('g')
          .attr('class', 'city-node cursor-pointer select-none');

        nodeEnter
          .append('circle')
          .attr('r', 10)
          .attr('stroke', '#fff')
          .attr('stroke-width', 2);

        nodeEnter
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '-1.2em')
          .attr('class', 'text-[10px] font-medium fill-slate-900')
          .style('display', 'none')
          .text(d => d.name);

        return nodeEnter;
      });

    nodeSelection
      .select('circle')
      .attr('fill', d => getStableColor(d.familyLabel))
      .attr('stroke', d => ((focusPersonId === d.id || selectedNodeId === d.id) ? '#4338ca' : '#fff'))
      .attr('stroke-width', d => ((focusPersonId === d.id || selectedNodeId === d.id) ? 4 : 2));

    nodeSelection.on('click', (event, datum) => {
      event.stopPropagation();
      const match = nodeLookup.get(datum.id);
      if (match) {
        setSelectedNodeId(match.id);
        onPersonSelect(match);
      }
    });

    const dragBehavior = d3
      .drag<SVGGElement, CityGraphNode>()
      .on('start', (event, datum) => {
        if (!isFrozen && !event.active) {
          simulation.alphaTarget(0.3).restart();
        }
        datum.fx = datum.x;
        datum.fy = datum.y;
      })
      .on('drag', (event, datum) => {
        datum.fx = event.x;
        datum.fy = event.y;
      })
      .on('end', (event, datum) => {
        if (!isFrozen && !event.active) {
          simulation.alphaTarget(0);
        }
        if (!isFrozen) {
          datum.fx = null;
          datum.fy = null;
        }
      });

    nodeSelection.call(dragBehavior as never);

    nodeSelectionRef.current = nodeSelection;

    if (!isFrozen) {
      simulation.alpha(0.5).restart();
    }
  }, [graphNodes, graphLinks, nodeLookup, onPersonSelect, isFrozen, focusPersonId, selectedNodeId]);

  // Layout toggle effect
  useEffect(() => {
    const simulation = simulationRef.current;
    if (!simulation) return;

    if (layoutMode === 'generations') {
      simulation.force('y', generationForceYRef.current || null);
      simulation.force('x', generationForceXRef.current || null);
      simulation.force('center', null);
    } else {
      simulation.force('y', null);
      simulation.force('x', null);
      if (centerForceRef.current) {
        simulation.force('center', centerForceRef.current);
      }
    }

    if (!isFrozen) {
      simulation.alpha(0.5).restart();
    }
  }, [layoutMode, isFrozen]);

  // Freeze/unfreeze effect
  useEffect(() => {
    const simulation = simulationRef.current;
    if (!simulation) return;

    if (isFrozen) {
      simulation.stop();
    } else {
      graphNodes.forEach(node => {
        node.fx = null;
        node.fy = null;
      });
      simulation.alpha(0.5).restart();
    }
  }, [isFrozen, graphNodes]);

  const handleResetZoom = () => {
    const svg = svgSelectionRef.current;
    const zoom = zoomBehaviorRef.current;
    if (!svg || !zoom) return;

    const applyTransform = zoom.transform as unknown as (
      selection: d3.Selection<SVGSVGElement, unknown, null, undefined>,
      transform: d3.ZoomTransform
    ) => void;
    applyTransform(svg, d3.zoomIdentity);
  };

  const toggleLayout = () => {
    setLayoutMode(prev => (prev === 'generations' ? 'city' : 'generations'));
  };

  const toggleFreeze = () => {
    setIsFrozen(prev => !prev);
  };

  return (
    <div className="w-full h-full relative bg-slate-50">
      <div ref={containerRef} className="w-full h-full" />

      <div className="absolute top-4 left-4 w-72 max-w-full space-y-3 rounded-xl border border-white/60 bg-white/90 p-4 shadow-lg backdrop-blur">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {translate('tree.city.infoTitle', 'Family City View')}
          </h2>
          <p className="text-xs text-slate-600">
            {translate('tree.city.infoDescription', 'Zoom between city-scale clusters and detailed families.')}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={toggleLayout}
            className={`rounded-md px-3 py-2 text-white transition ${
              layoutMode === 'generations' ? 'bg-purple-500 hover:bg-purple-600' : 'bg-teal-500 hover:bg-teal-600'
            }`}
          >
            {layoutMode === 'generations'
              ? translate('tree.city.layoutCity', 'City Layout')
              : translate('tree.city.layoutGenerations', 'Generations')}
          </button>
          <button
            type="button"
            onClick={toggleFreeze}
            className={`rounded-md px-3 py-2 text-white transition ${
              isFrozen ? 'bg-green-500 hover:bg-green-600' : 'bg-slate-500 hover:bg-slate-600'
            }`}
          >
            {isFrozen ? translate('tree.city.unfreeze', 'Unfreeze') : translate('tree.city.freeze', 'Freeze')}
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="rounded-md bg-sky-500 px-3 py-2 text-white transition hover:bg-sky-600"
          >
            {translate('tree.city.reset', 'Reset')}
          </button>
        </div>

        {showLegend && (
          <div className="space-y-2 rounded-lg border border-slate-200 bg-white/90 p-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <svg width="36" height="6">
                <line x1="0" y1="3" x2="36" y2="3" stroke="#999" strokeWidth="2" />
              </svg>
              <span>{translate('tree.city.legendParent', 'Parent → Child')}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="36" height="6">
                <line x1="0" y1="3" x2="36" y2="3" stroke="#ff69b4" strokeWidth="3" strokeDasharray="5,5" />
              </svg>
              <span>{translate('tree.city.legendPartnership', 'Partnership')}</span>
            </div>
          </div>
        )}
      </div>

      {selectedNode && (
        <div className="absolute top-4 right-4 w-80 max-w-full rounded-xl border border-white/70 bg-white/95 p-4 shadow-xl backdrop-blur-lg">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                {selectedNode.generation || translate('tree.city.branchLabel', 'Branch')}
              </p>
              <h3 className="text-lg font-semibold text-slate-900">{selectedNode.fullName}</h3>
              <p className="text-xs text-slate-500">
                {selectedNode.branchId || translate('tree.city.branchLabel', 'Branch')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedNodeId(null)}
              className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close person details"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          <dl className="mt-4 space-y-2 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">{translate('tree.city.status', 'Status')}</dt>
              <dd className="font-medium text-slate-900">
                {selectedNode.isAlive
                  ? translate('common.active', 'Active')
                  : translate('common.inactive', 'Inactive')}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">{translate('tree.city.life', 'Life')}</dt>
              <dd className="text-right font-medium text-slate-900">{formatLifeSpan(selectedNode, translate)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">{translate('tree.city.location', 'Location')}</dt>
              <dd className="text-right font-medium text-slate-900">{formatLocation(selectedNode, translate)}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
