import { PrismaClient } from '@prisma/client';
import type { CreatePersonInput, UpdatePersonInput } from '../validators/person.validator';

const prisma = new PrismaClient();

export class PersonService {
  // Create a new person
  async createPerson(branchId: string, userId: string, data: CreatePersonInput) {
    // Verify user is a member of the branch
    const membership = await prisma.branchMember.findFirst({
      where: {
        branchId,
        userId,
        status: 'active',
      },
    });

    if (!membership) {
      throw new Error('You must be a member of this branch to add people');
    }

    // Calculate generation based on parents
    let generationNumber = 1; // Default for root ancestors

    if (data.fatherId || data.motherId) {
      const parentId = data.fatherId ?? data.motherId;

      if (!parentId) {
        throw new Error('Parent must have a valid ID');
      }

      const parent = await prisma.person.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        throw new Error('Parent not found');
      }

      if (parent.branchId !== branchId) {
        throw new Error('Parent must be in the same branch');
      }

      generationNumber = (parent.generationNumber || 1) + 1;
    }

    // Create the person
    const person = await prisma.person.create({
      data: {
        branchId,
        fullName: `${data.firstName} ${data.lastName}`,
        surname: data.lastName,
        givenName: data.firstName,
        maidenName: data.maidenName,
        gender: data.gender,
        generationNumber,
        generation: `G${generationNumber}`,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        birthPlace: data.birthPlace ?? null,
        deathDate: data.deathDate ? new Date(data.deathDate) : null,
        deathPlace: data.deathPlace ?? null,
        biography: data.biography ?? null,
        isLiving: data.isAlive,
        visibility: data.privacyLevel ?? 'family_only',
        fatherId: data.fatherId ?? null,
        motherId: data.motherId ?? null,
        createdById: userId,
      },
      include: {
        father: true,
        mother: true,
      },
    });

    // Update branch statistics
    await this.updateBranchStatistics(branchId);

    return person;
  }

  // Get all persons in a branch
  async getPersonsByBranch(branchId: string) {
    const persons = await prisma.person.findMany({
      where: {
        branchId,
        // TODO: Add privacy filtering based on user membership
      },
      include: {
        father: true,
        mother: true,
        children: true,
      },
      orderBy: [
        { generationNumber: 'asc' },
        { birthDate: 'asc' },
      ],
    });

    return persons;
  }

  // Get a single person by ID
  async getPersonById(branchId: string, personId: string) {
    const person = await prisma.person.findFirst({
      where: {
        id: personId,
        branchId,
      },
      include: {
        father: true,
        mother: true,
        children: true,
        branch: true,
      },
    });

    if (!person) {
      throw new Error('Person not found');
    }

    return person;
  }

  // Update a person
  async updatePerson(branchId: string, personId: string, userId: string, data: UpdatePersonInput) {
    // Verify user is a member of the branch
    const membership = await prisma.branchMember.findFirst({
      where: {
        branchId,
        userId,
        status: 'active',
      },
    });

    if (!membership) {
      throw new Error('You must be a member of this branch to edit people');
    }

    // Verify person exists and belongs to branch
    const existingPerson = await prisma.person.findFirst({
      where: {
        id: personId,
        branchId,
      },
    });

    if (!existingPerson) {
      throw new Error('Person not found');
    }

    // Build update data
    const updateData: any = {};

    if (data.firstName || data.lastName) {
      const firstName = data.firstName || existingPerson.givenName || '';
      const lastName = data.lastName || existingPerson.surname || '';
      updateData.fullName = `${firstName} ${lastName}`;
      if (data.firstName) updateData.givenName = data.firstName;
      if (data.lastName) updateData.surname = data.lastName;
    }

    if (data.maidenName !== undefined) updateData.maidenName = data.maidenName;
    if (data.gender) updateData.gender = data.gender;

    if (data.birthDate !== undefined) {
      updateData.birthDate = data.birthDate ? new Date(data.birthDate) : null;
    }

    if (data.birthPlace !== undefined) {
      updateData.birthPlace = data.birthPlace;
    }

    if (data.deathDate !== undefined) {
      updateData.deathDate = data.deathDate ? new Date(data.deathDate) : null;
    }

    if (data.deathPlace !== undefined) {
      updateData.deathPlace = data.deathPlace;
    }

    if (data.biography !== undefined) updateData.biography = data.biography;
    if (data.isAlive !== undefined) updateData.isLiving = data.isAlive;
    if (data.privacyLevel) updateData.visibility = data.privacyLevel;
    if (data.fatherId !== undefined) updateData.fatherId = data.fatherId;
    if (data.motherId !== undefined) updateData.motherId = data.motherId;

    // Update the person
    const person = await prisma.person.update({
      where: { id: personId },
      data: updateData,
      include: {
        father: true,
        mother: true,
        children: true,
      },
    });

    return person;
  }

  // Delete a person
  async deletePerson(branchId: string, personId: string, userId: string) {
    // Verify user is a Guru of the branch
    const membership = await prisma.branchMember.findFirst({
      where: {
        branchId,
        userId,
        status: 'active',
        role: 'guru',
      },
    });

    if (!membership) {
      throw new Error('Only Gurus can delete people');
    }

    // Check if person has children
    const person = await prisma.person.findFirst({
      where: {
        id: personId,
        branchId,
      },
      include: {
        children: true,
      },
    });

    if (!person) {
      throw new Error('Person not found');
    }

    if (person.children && person.children.length > 0) {
      throw new Error('Cannot delete person with children. Remove children first or reassign them.');
    }

    // Delete the person
    await prisma.person.delete({
      where: { id: personId },
    });

    // Update branch statistics
    await this.updateBranchStatistics(branchId);

    return { success: true };
  }

  // Get family tree for a branch
  async getFamilyTree(branchId: string) {
    const persons = await prisma.person.findMany({
      where: { branchId },
      include: {
        father: true,
        mother: true,
        children: true,
      },
      orderBy: [
        { generationNumber: 'asc' },
        { birthDate: 'asc' },
      ],
    });

    return persons;
  }

  // Update branch statistics
  private async updateBranchStatistics(branchId: string) {
    const persons = await prisma.person.findMany({
      where: { branchId },
      select: { generationNumber: true },
    });

    const totalPeople = persons.length;
    const totalGenerations = persons.length > 0
      ? Math.max(...persons.map(p => p.generationNumber || 0))
      : 0;

    await prisma.familyBranch.update({
      where: { id: branchId },
      data: {
        totalPeople,
        totalGenerations,
      },
    });
  }

  /**
   * Recalculate generation numbers for all persons in a branch
   * Uses depth-first search from root ancestors and adjusts spouses
   */
  async recalculateGenerations(branchId: string) {
    const persons = await prisma.person.findMany({
      where: { branchId },
      include: {
        father: true,
        mother: true,
      },
    });

    // Map to store calculated generations
    const generationMap = new Map<string, number>();

    // Helper function to calculate generation recursively based on parents
    const calculateGeneration = (personId: string, visited = new Set<string>()): number => {
      // Avoid circular references
      if (visited.has(personId)) {
        return 1;
      }

      // If already calculated, return it
      if (generationMap.has(personId)) {
        return generationMap.get(personId)!;
      }

      visited.add(personId);

      const person = persons.find(p => p.id === personId);
      if (!person) {
        return 1;
      }

      // If no parents, check if they have children to infer generation
      if (!person.fatherId && !person.motherId) {
        const children = persons.filter(p => p.fatherId === person.id || p.motherId === person.id);

        if (children.length > 0) {
          // Calculate generation based on children (their gen - 1)
          const childGenerations = children.map(child => calculateGeneration(child.id, new Set(visited)));
          const minChildGen = Math.min(...childGenerations);
          const inferredGen = Math.max(1, minChildGen - 1);
          generationMap.set(personId, inferredGen);
          return inferredGen;
        }

        // No parents and no children, must be G1
        generationMap.set(personId, 1);
        return 1;
      }

      // Calculate based on parents (take max + 1)
      let parentGeneration = 0;

      if (person.fatherId) {
        const fatherGen = calculateGeneration(person.fatherId, new Set(visited));
        parentGeneration = Math.max(parentGeneration, fatherGen);
      }

      if (person.motherId) {
        const motherGen = calculateGeneration(person.motherId, new Set(visited));
        parentGeneration = Math.max(parentGeneration, motherGen);
      }

      const generation = parentGeneration + 1;
      generationMap.set(personId, generation);
      return generation;
    };

    // Calculate generations for all persons
    persons.forEach(person => {
      calculateGeneration(person.id);
    });

    // Update all persons with correct generation numbers
    const updates = [];
    for (const [personId, generationNum] of generationMap.entries()) {
      updates.push(
        prisma.person.update({
          where: { id: personId },
          data: {
            generationNumber: generationNum,
            generation: `G${generationNum}`,
          },
        })
      );
    }

    await Promise.all(updates);

    // Update branch statistics
    const maxGeneration = Math.max(...Array.from(generationMap.values()));
    const totalPeople = persons.length;

    await prisma.familyBranch.update({
      where: { id: branchId },
      data: {
        totalGenerations: maxGeneration,
        totalPeople,
      },
    });

    return {
      totalPeople,
      totalGenerations: maxGeneration,
      updated: updates.length,
      generationMap: Object.fromEntries(generationMap),
    };
  }
}

export default new PersonService();
