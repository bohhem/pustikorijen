/**
 * Data transformation utilities for converting Pustikorijen data
 * to relatives-tree format for genealogy visualization
 */

import type { Person } from '../types/person';
import type { Partnership } from '../types/partnership';
import type { MultiBranchTreePerson, MultiBranchTreeResponse } from '../types/branch';

/**
 * relatives-tree node format
 * Based on: https://github.com/SanichKotikov/relatives-tree
 */
export interface RelativesTreeNode {
  id: string;
  gender?: 'male' | 'female';
  parents?: Array<{
    id: string;
    type: 'blood' | 'adopted';
  }>;
  children?: Array<{
    id: string;
    type: 'blood' | 'adopted';
  }>;
  siblings?: Array<{
    id: string;
    type: 'blood' | 'half';
  }>;
  spouses?: Array<{
    id: string;
    type: 'married' | 'partner';
  }>;
}

/**
 * Extended node with custom Pustikorijen data for rendering
 */
export interface ExtendedTreeNode extends RelativesTreeNode {
  // Display data
  fullName: string;
  givenName?: string;
  surname?: string;
  maidenName?: string;
  generation: string;
  generationNumber: number;

  // Genealogy metadata
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  currentLocation?: string;
  isAlive: boolean;

  // Branch relationship
  branchId: string;
  isBridge: boolean;
  linkedFromBranch?: {
    id: string;
    surname: string;
  };

  // Visual hints
  profilePhotoUrl?: string;
  // Override gender to include 'other' option
  gender?: 'male' | 'female';
}

/**
 * Convert a single Person to RelativesTreeNode format
 */
export function personToTreeNode(person: Person | MultiBranchTreePerson): ExtendedTreeNode {
  // Determine gender
  let gender: 'male' | 'female' | undefined;
  if ('gender' in person && person.gender) {
    if (person.gender === 'male' || person.gender === 'female') {
      gender = person.gender;
    }
  }

  // Build parents array
  const parents: Array<{ id: string; type: 'blood' | 'adopted' }> = [];
  if (person.fatherId) {
    parents.push({ id: person.fatherId, type: 'blood' });
  }
  if (person.motherId) {
    parents.push({ id: person.motherId, type: 'blood' });
  }

  const node: ExtendedTreeNode = {
    id: person.id,
    gender,
    parents: parents.length > 0 ? parents : undefined,

    // Display data
    fullName: person.fullName,
    givenName: person.givenName,
    surname: person.surname,
    maidenName: person.maidenName,
    generation: person.generation || `G${person.generationNumber || 1}`,
    generationNumber: person.generationNumber || 1,

    // Metadata
    birthDate: person.birthDate,
    deathDate: person.deathDate,
    birthPlace: 'birthPlace' in person ? person.birthPlace : undefined,
    currentLocation: 'currentLocation' in person ? person.currentLocation : undefined,
    isAlive: 'isAlive' in person ? (person.isAlive !== false) : true,

    // Branch data
    branchId: 'branchId' in person ? person.branchId : '',
    isBridge: 'isLinked' in person ? (person.isLinked || false) : false,
    linkedFromBranch: 'linkedFromBranch' in person && person.linkedFromBranch
      ? {
          id: person.linkedFromBranch.id,
          surname: person.linkedFromBranch.surname,
        }
      : undefined,

    // Visual
    profilePhotoUrl: person.profilePhotoUrl,
  };

  return node;
}

/**
 * Add partnerships (spouses) to tree nodes
 */
export function addPartnershipsToNodes(
  nodes: Map<string, ExtendedTreeNode>,
  partnerships: Partnership[]
): void {
  partnerships.forEach((partnership) => {
    const person1 = nodes.get(partnership.person1Id);
    const person2 = nodes.get(partnership.person2Id);

    if (!person1 || !person2) return;

    const partnershipType = partnership.partnershipType === 'marriage' ? 'married' : 'partner';

    // Add spouse to person1
    if (!person1.spouses) person1.spouses = [];
    if (!person1.spouses.find(s => s.id === person2.id)) {
      person1.spouses.push({ id: person2.id, type: partnershipType });
    }

    // Add spouse to person2
    if (!person2.spouses) person2.spouses = [];
    if (!person2.spouses.find(s => s.id === person1.id)) {
      person2.spouses.push({ id: person1.id, type: partnershipType });
    }
  });
}

/**
 * Calculate children relationships
 */
export function calculateChildren(nodes: Map<string, ExtendedTreeNode>): void {
  nodes.forEach((node) => {
    if (!node.parents || node.parents.length === 0) return;

    // Add this person as a child to their parents
    node.parents.forEach((parent) => {
      const parentNode = nodes.get(parent.id);
      if (!parentNode) return;

      if (!parentNode.children) parentNode.children = [];

      // Avoid duplicates
      if (!parentNode.children.find(c => c.id === node.id)) {
        parentNode.children.push({
          id: node.id,
          type: parent.type,
        });
      }
    });
  });
}

/**
 * Calculate sibling relationships
 */
export function calculateSiblings(nodes: Map<string, ExtendedTreeNode>): void {
  // Group people by their parents
  const parentGroupMap = new Map<string, string[]>();

  nodes.forEach((node) => {
    if (!node.parents || node.parents.length === 0) return;

    // Create parent key (sorted parent IDs)
    const parentIds = node.parents.map(p => p.id).sort();
    const parentKey = parentIds.join('_');

    if (!parentGroupMap.has(parentKey)) {
      parentGroupMap.set(parentKey, []);
    }
    parentGroupMap.get(parentKey)!.push(node.id);
  });

  // For each group, mark siblings
  parentGroupMap.forEach((siblingIds) => {
    if (siblingIds.length < 2) return; // No siblings

    siblingIds.forEach((personId) => {
      const person = nodes.get(personId);
      if (!person) return;

      // Add all other siblings
      const otherSiblings = siblingIds.filter(id => id !== personId);

      if (!person.siblings) person.siblings = [];

      otherSiblings.forEach((siblingId) => {
        if (!person.siblings!.find(s => s.id === siblingId)) {
          person.siblings!.push({
            id: siblingId,
            type: 'blood', // Full siblings (same parents)
          });
        }
      });
    });
  });

  // TODO: Handle half-siblings (same father OR same mother, not both)
}

/**
 * Convert Person[] array to relatives-tree format
 */
export function personsToTreeNodes(
  persons: Person[] | MultiBranchTreePerson[],
  partnerships: Partnership[]
): ExtendedTreeNode[] {
  // Convert persons to nodes
  const nodesMap = new Map<string, ExtendedTreeNode>();

  persons.forEach((person) => {
    const node = personToTreeNode(person);
    nodesMap.set(node.id, node);
  });

  // Add partnerships (spouses)
  addPartnershipsToNodes(nodesMap, partnerships);

  // Calculate children (reverse of parents)
  calculateChildren(nodesMap);

  // Calculate siblings
  calculateSiblings(nodesMap);

  return Array.from(nodesMap.values());
}

/**
 * Convert MultiBranchTreeResponse to relatives-tree format
 * Includes main branch + connected branches
 */
export function multiBranchToTreeNodes(
  treeData: MultiBranchTreeResponse
): ExtendedTreeNode[] {
  const allPersons: MultiBranchTreePerson[] = [
    ...treeData.mainBranch.persons,
  ];

  const allPartnerships: Partnership[] = [
    ...treeData.mainBranch.partnerships.map(p => ({
      id: p.id,
      branchId: p.branchId,
      person1Id: p.person1Id,
      person2Id: p.person2Id,
      partnershipType: p.partnershipType as 'marriage' | 'domestic_partnership' | 'common_law' | 'other',
      startDate: p.startDate,
      endDate: p.endDate,
      status: p.status as 'active' | 'ended' | 'annulled',
      isCurrent: p.isCurrent,
      orderNumber: 0,
      visibility: 'public' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
  ];

  // Add connected branches
  treeData.connectedBranches.forEach((connectedBranch) => {
    allPersons.push(...connectedBranch.persons);

    allPartnerships.push(
      ...connectedBranch.partnerships.map(p => ({
        id: p.id,
        branchId: p.branchId,
        person1Id: p.person1Id,
        person2Id: p.person2Id,
        partnershipType: p.partnershipType as 'marriage' | 'domestic_partnership' | 'common_law' | 'other',
        startDate: p.startDate,
        endDate: p.endDate,
        status: p.status as 'active' | 'ended' | 'annulled',
        isCurrent: p.isCurrent,
        orderNumber: 0,
        visibility: 'public' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
    );
  });

  return personsToTreeNodes(allPersons, allPartnerships);
}

/**
 * Filter nodes to get ancestors of a specific person
 * @param rootPersonId - The person whose ancestors to find
 * @param maxGenerations - Maximum number of generations to traverse (default: 10)
 */
export function getAncestorNodes(
  allNodes: ExtendedTreeNode[],
  rootPersonId: string,
  maxGenerations: number = 10
): ExtendedTreeNode[] {
  const nodesMap = new Map(allNodes.map(n => [n.id, n]));
  const ancestorIds = new Set<string>();

  const traverseAncestors = (personId: string, depth: number) => {
    if (depth > maxGenerations) return;

    const person = nodesMap.get(personId);
    if (!person || ancestorIds.has(personId)) return;

    ancestorIds.add(personId);

    // Traverse parents
    person.parents?.forEach((parent) => {
      traverseAncestors(parent.id, depth + 1);
    });
  };

  traverseAncestors(rootPersonId, 0);

  return allNodes.filter(node => ancestorIds.has(node.id));
}

/**
 * Filter nodes to get descendants of a specific person
 * @param rootPersonId - The person whose descendants to find
 * @param maxGenerations - Maximum number of generations to traverse (default: 10)
 */
export function getDescendantNodes(
  allNodes: ExtendedTreeNode[],
  rootPersonId: string,
  maxGenerations: number = 10
): ExtendedTreeNode[] {
  const nodesMap = new Map(allNodes.map(n => [n.id, n]));
  const descendantIds = new Set<string>();

  const traverseDescendants = (personId: string, depth: number) => {
    if (depth > maxGenerations) return;

    const person = nodesMap.get(personId);
    if (!person || descendantIds.has(personId)) return;

    descendantIds.add(personId);

    // Traverse children
    person.children?.forEach((child) => {
      traverseDescendants(child.id, depth + 1);
    });
  };

  traverseDescendants(rootPersonId, 0);

  return allNodes.filter(node => descendantIds.has(node.id));
}

/**
 * Get ancestors + descendants of a person (hourglass view)
 */
export function getHourglassNodes(
  allNodes: ExtendedTreeNode[],
  rootPersonId: string,
  maxGenerations: number = 10
): ExtendedTreeNode[] {
  const ancestors = getAncestorNodes(allNodes, rootPersonId, maxGenerations);
  const descendants = getDescendantNodes(allNodes, rootPersonId, maxGenerations);

  // Combine and deduplicate
  const combinedIds = new Set([
    ...ancestors.map(n => n.id),
    ...descendants.map(n => n.id),
  ]);

  return allNodes.filter(node => combinedIds.has(node.id));
}
