import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { ExtendedTreeNode } from '../../utils/relativesTreeAdapter';

interface DescendantChartProps {
  nodes: ExtendedTreeNode[];
  rootPersonId: string;
  onPersonSelect: (node: ExtendedTreeNode) => void;
  showLegend?: boolean;
}

export default function DescendantChart({
  nodes,
  rootPersonId,
  onPersonSelect,
}: DescendantChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g');

    // Build hierarchy
    const rootNode = nodes.find(n => n.id === rootPersonId);
    if (!rootNode) return;

    // Build tree data structure for D3
    type TreeNode = Omit<ExtendedTreeNode, 'parents' | 'children'> & {
      children?: TreeNode[];
    };

    const buildDescendantTree = (node: ExtendedTreeNode): TreeNode => {
      const children: TreeNode[] = [];

      if (node.children) {
        node.children.forEach((child) => {
          const childNode = nodes.find(n => n.id === child.id);
          if (childNode) {
            children.push(buildDescendantTree(childNode));
          }
        });
      }

      const { parents: _parents, children: _children, siblings: _siblings, spouses: _spouses, ...rest } = node;

      return {
        ...rest,
        children: children.length > 0 ? children : undefined,
      };
    };

    const treeData = buildDescendantTree(rootNode);

    // Create hierarchy
    const root = d3.hierarchy(treeData);

    // Create tree layout (vertical - descendants go down)
    const treeLayout = d3.tree<TreeNode>()
      .size([width - 200, height - 100])
      .separation((a, b) => (a.parent === b.parent ? 1 : 1.2));

    const treeRoot = treeLayout(root);

    // Draw links (edges) - vertical layout
    const link = g
      .selectAll('.link')
      .data(treeRoot.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d => {
        const sourceX = d.source.x + 100;
        const sourceY = d.source.y + 50;
        const targetX = d.target.x + 100;
        const targetY = d.target.y + 50;

        return `M${sourceX},${sourceY}C${sourceX},${(sourceY + targetY) / 2} ${targetX},${(sourceY + targetY) / 2} ${targetX},${targetY}`;
      })
      .attr('fill', 'none')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 2);

    link
      .transition()
      .duration(500)
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2.5);

    // Draw nodes
    const node = g
      .selectAll('.node')
      .data(treeRoot.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x + 100},${d.y + 50})`)
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        // Find the original node
        const originalNode = nodes.find(n => n.id === d.data.id);
        if (originalNode) {
          onPersonSelect(originalNode);
        }
      });

    // Node circles
    node
      .append('circle')
      .attr('r', 0)
      .attr('fill', d => {
        if (!d.data.isAlive) return '#9ca3af';
        return d.data.gender === 'male' ? '#3b82f6' : '#ec4899';
      })
      .attr('stroke', d => (d.data.id === rootPersonId ? '#10b981' : '#fff'))
      .attr('stroke-width', d => (d.data.id === rootPersonId ? 4 : 2))
      .transition()
      .duration(500)
      .attr('r', 6);

    // Node labels
    node
      .append('text')
      .attr('dy', -12)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', d => (d.data.id === rootPersonId ? 'bold' : 'normal'))
      .attr('fill', '#1f2937')
      .style('opacity', 0)
      .text(d => d.data.fullName)
      .transition()
      .duration(500)
      .delay(200)
      .style('opacity', 1);

    // Generation labels
    node
      .append('text')
      .attr('dy', 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('fill', '#6b7280')
      .style('opacity', 0)
      .text(d => d.data.generation)
      .transition()
      .duration(500)
      .delay(300)
      .style('opacity', 1);

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
      });

    svg.call(zoom);

    // Initial zoom to fit
    const bounds = g.node()?.getBBox();
    if (bounds) {
      const fullWidth = bounds.width;
      const fullHeight = bounds.height;
      const scale = Math.min(
        width / fullWidth,
        height / fullHeight,
        1
      ) * 0.9;

      const translateX = (width - fullWidth * scale) / 2 - bounds.x * scale;
      const translateY = (height - fullHeight * scale) / 2 - bounds.y * scale;

      svg.call(
        zoom.transform as (selection: d3.Selection<SVGSVGElement, unknown, null, undefined>, ...args: unknown[]) => void,
        d3.zoomIdentity.translate(translateX, translateY).scale(scale)
      );
    }
  }, [nodes, rootPersonId, onPersonSelect]);

  return (
    <div ref={containerRef} className="w-full h-full bg-white">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}
