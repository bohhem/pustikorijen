import type { Person } from '../types/person';
import type { Partnership } from '../types/partnership';

export interface PartnerOrderingResult {
  generationMap: Map<number, Person[]>;
  generations: number[];
  orderedPersons: Person[];
  partnersByPerson: Map<string, Person[]>;
}

const sortKey = (person: Person) => {
  const surname = (person.surname || person.lastName || '').toLocaleLowerCase();
  const given = (person.givenName || person.firstName || '').toLocaleLowerCase();
  return `${surname} ${given} ${person.id}`;
};

/**
 * Orders persons by generation ensuring that partners (same-generation partnerships)
 * are positioned next to each other. Returns both a generation map and a flattened list.
 */
export function orderPersonsByPartnerPairing(
  persons: Person[],
  partnerships: Partnership[]
): PartnerOrderingResult {
  const generationMap = new Map<number, Person[]>();
  const orderedGenerationMap = new Map<number, Person[]>();
  const orderedPersons: Person[] = [];
  const partnersByPerson = new Map<string, Person[]>();
  const personMap = new Map(persons.map(person => [person.id, person]));

  // Group persons by generation
  persons.forEach(person => {
    const gen = person.generationNumber || 1;
    if (!generationMap.has(gen)) {
      generationMap.set(gen, []);
    }
    generationMap.get(gen)!.push(person);
  });

  // Build partnership adjacency map for same-generation couples
  const partnerMap = new Map<string, Set<string>>();

  const registerPartner = (sourceId: string, targetId: string) => {
    if (!partnerMap.has(sourceId)) {
      partnerMap.set(sourceId, new Set());
    }
    partnerMap.get(sourceId)!.add(targetId);
  };

  partnerships.forEach(partnership => {
    const person1 = personMap.get(partnership.person1Id);
    const person2 = personMap.get(partnership.person2Id);

    if (!person1 || !person2) return;

    const gen1 = person1.generationNumber || 1;
    const gen2 = person2.generationNumber || 1;

    if (gen1 !== gen2) return;

    registerPartner(person1.id, person2.id);
    registerPartner(person2.id, person1.id);
  });

  const generations = Array.from(generationMap.keys()).sort((a, b) => a - b);

  generations.forEach(gen => {
    const people = generationMap.get(gen);
    if (!people) return;

    const sorted = [...people].sort((a, b) => {
      const keyA = sortKey(a);
      const keyB = sortKey(b);
      return keyA.localeCompare(keyB);
    });

    const visited = new Set<string>();
    const orderedThisGeneration: Person[] = [];

    sorted.forEach(person => {
      if (visited.has(person.id)) return;

      orderedThisGeneration.push(person);
      visited.add(person.id);

      const partnerIds = partnerMap.get(person.id);
      if (!partnerIds) return;

      const partners = Array.from(partnerIds)
        .map(id => personMap.get(id))
        .filter((partner): partner is Person => Boolean(partner))
        .sort((a, b) => {
          const keyA = sortKey(a);
          const keyB = sortKey(b);
          return keyA.localeCompare(keyB);
        });

      partners.forEach(partner => {
        if (!visited.has(partner.id)) {
          orderedThisGeneration.push(partner);
          visited.add(partner.id);
        }
      });
    });

    orderedGenerationMap.set(gen, orderedThisGeneration);
    orderedPersons.push(...orderedThisGeneration);
  });

  partnerMap.forEach((partnerIds, personId) => {
    const partners = Array.from(partnerIds)
      .map(id => personMap.get(id))
      .filter((partner): partner is Person => Boolean(partner))
      .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
    partnersByPerson.set(personId, partners);
  });

  return {
    generationMap: orderedGenerationMap,
    generations,
    orderedPersons,
    partnersByPerson,
  };
}
