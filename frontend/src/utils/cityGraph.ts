import type { SimulationLinkDatum, SimulationNodeDatum } from 'd3';
import type { ExtendedTreeNode } from './relativesTreeAdapter';

export type CityGraphLinkType = 'parent' | 'partnership';

export interface CityGraphNode extends SimulationNodeDatum {
  id: string;
  name: string;
  fullName: string;
  familyLabel: string;
  branchId: string;
  generationNumber: number;
  isBridge: boolean;
  isAlive: boolean;
  metadata: {
    givenName?: string;
    surname?: string;
    maidenName?: string;
    generation?: string;
    birthDate?: string;
    deathDate?: string;
    birthPlace?: string;
    currentLocation?: string;
    profilePhotoUrl?: string;
  };
}

export interface CityGraphLink extends SimulationLinkDatum<CityGraphNode> {
  type: CityGraphLinkType;
  partnershipStatus?: 'married' | 'partner';
}

export interface CityGraphData {
  nodes: CityGraphNode[];
  links: CityGraphLink[];
}

/**
 * Prepare nodes and links for the D3 city graph.
 */
export function buildCityGraphData(nodes: ExtendedTreeNode[]): CityGraphData {
  const nodeMap = new Map(nodes.map(node => [node.id, node]));

  const graphNodes: CityGraphNode[] = nodes.map(node => ({
    id: node.id,
    name: node.fullName,
    fullName: node.fullName,
    familyLabel: node.surname || node.maidenName || node.branchId,
    branchId: node.branchId,
    generationNumber: node.generationNumber,
    isBridge: node.isBridge,
    isAlive: node.isAlive,
    metadata: {
      givenName: node.givenName,
      surname: node.surname,
      maidenName: node.maidenName,
      generation: node.generation,
      birthDate: node.birthDate,
      deathDate: node.deathDate,
      birthPlace: node.birthPlace,
      currentLocation: node.currentLocation,
      profilePhotoUrl: node.profilePhotoUrl,
    },
  }));

  const links: CityGraphLink[] = [];

  nodes.forEach(node => {
    // Parent-child links
    node.parents?.forEach(parent => {
      if (nodeMap.has(parent.id)) {
        links.push({
          source: parent.id,
          target: node.id,
          type: 'parent',
        });
      }
    });

    // Partnership links (avoid duplicates)
    if (node.spouses && node.spouses.length > 0) {
      node.spouses.forEach(spouse => {
        if (!nodeMap.has(spouse.id)) return;
        if (node.id > spouse.id) return; // ensure only one direction

        links.push({
          source: node.id,
          target: spouse.id,
          type: 'partnership',
          partnershipStatus: spouse.type === 'married' ? 'married' : 'partner',
        });
      });
    }
  });

  return { nodes: graphNodes, links };
}
