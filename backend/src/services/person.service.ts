import { randomUUID } from 'crypto';
import prisma from '../utils/prisma';
import { ensureBranchIsActive } from '../utils/branch.guard';
import type { CreatePersonInput, UpdatePersonInput } from '../validators/person.validator';
import type { JwtPayload } from '../utils/jwt';
import type { PersonClaimStatus } from './person-claim.service';

type PersonRecord = {
  person_id: string;
  branch_id: string;
  full_name: string;
  given_name: string | null;
  surname: string | null;
  maiden_name: string | null;
  nickname: string | null;
  gender: string | null;
  birth_date: Date | null;
  birth_place: string | null;
  death_date: Date | null;
  death_place: string | null;
  current_location: string | null;
  current_country: string | null;
  occupation: string | null;
  education: string | null;
  biography: string | null;
  profile_photo_url: string | null;
  generation: string | null;
  generation_number: number | null;
  father_id: string | null;
  mother_id: string | null;
  is_living: boolean | null;
  share_in_ledger: boolean;
  estimated_birth_year: number | null;
  visibility: string;
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  family_branches?: {
    branch_id: string;
    surname: string;
    city_name: string | null;
  } | null;
};

type PersonDto = {
  id: string;
  branchId: string;
  fullName: string;
  givenName?: string;
  surname?: string;
  maidenName?: string;
  nickname?: string;
  gender?: string;
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  currentLocation?: string;
  currentCountry?: string;
  occupation?: string;
  education?: string;
  biography?: string;
  generation?: string;
  generationNumber?: number;
  fatherId?: string;
  motherId?: string;
  profilePhotoUrl?: string;
  isAlive?: boolean;
  shareInLedger?: boolean;
  estimatedBirthYear?: number | null;
  privacyLevel?: string;
  createdAt?: string;
  updatedAt?: string;
  createdById?: string;
  firstName?: string;
  lastName?: string;
  homeBranch?: {
    id: string;
    surname: string;
    cityName?: string | null;
  } | null;
  isLinked: boolean;
  linkId?: string;
  linkedFromBranch?: {
    id: string;
    surname: string;
    cityName?: string | null;
  } | null;
  linkStatus?: string;
  linkDisplayName?: string | null;
  canBeClaimed?: boolean;
  claimStatus?: PersonClaimStatus;
};

const toIso = (value?: Date | null): string | undefined => {
  if (!value) {
    return undefined;
  }
  return value.toISOString();
};

function mapPerson(
  record: PersonRecord,
  options: {
    isLinked?: boolean;
    linkId?: string;
    linkedFromBranch?: { id: string; surname: string; cityName?: string | null } | null;
    linkStatus?: string;
    linkDisplayName?: string | null;
    canBeClaimed?: boolean;
    claimStatus?: PersonClaimStatus;
  } = {}
): PersonDto {
  return {
    id: record.person_id,
    branchId: record.branch_id,
    fullName: record.full_name,
    givenName: record.given_name ?? undefined,
    surname: record.surname ?? undefined,
    maidenName: record.maiden_name ?? undefined,
    nickname: record.nickname ?? undefined,
    gender: record.gender ?? undefined,
    birthDate: toIso(record.birth_date),
    birthPlace: record.birth_place ?? undefined,
    deathDate: toIso(record.death_date),
    deathPlace: record.death_place ?? undefined,
    currentLocation: record.current_location ?? undefined,
    currentCountry: record.current_country ?? undefined,
    occupation: record.occupation ?? undefined,
    education: record.education ?? undefined,
    biography: record.biography ?? undefined,
    generation: record.generation ?? undefined,
    generationNumber: record.generation_number ?? undefined,
    fatherId: record.father_id ?? undefined,
    motherId: record.mother_id ?? undefined,
    profilePhotoUrl: record.profile_photo_url ?? undefined,
    isAlive: record.is_living ?? undefined,
    shareInLedger: record.share_in_ledger ?? false,
    estimatedBirthYear: record.estimated_birth_year ?? undefined,
    privacyLevel: record.visibility ?? undefined,
    createdAt: toIso(record.created_at),
    updatedAt: toIso(record.updated_at),
    createdById: record.created_by ?? undefined,
    firstName: record.given_name ?? undefined,
    lastName: record.surname ?? undefined,
    homeBranch: record.family_branches
      ? {
          id: record.family_branches.branch_id,
          surname: record.family_branches.surname,
          cityName: record.family_branches.city_name,
        }
      : null,
    isLinked: options.isLinked ?? false,
    linkId: options.linkId,
    linkedFromBranch: options.linkedFromBranch ?? null,
    linkStatus: options.linkStatus,
    linkDisplayName: options.linkDisplayName ?? null,
    canBeClaimed: options.canBeClaimed,
    claimStatus: options.claimStatus,
  };
}

export class PersonService {
  // Create a new person
  async createPerson(branchId: string, actor: JwtPayload, data: CreatePersonInput) {
    const userId = actor.userId;
    const isElevated = actor.globalRole === 'SUPER_GURU' || actor.globalRole === 'ADMIN';

    let membership: { role: string } | null = null;
    if (!isElevated) {
      membership = await prisma.branchMember.findFirst({
        where: {
          branch_id: branchId,
          user_id: userId,
          status: 'active',
        },
        select: {
          role: true,
        },
      });

      if (!membership) {
        throw new Error('You must be a member of this branch to add people');
      }
    }

    const canManageGenerations = isElevated || membership?.role === 'guru';

    // Calculate generation based on parents
    let generationNumber = 1; // Default for root ancestors

    if (data.fatherId || data.motherId) {
      const parentId = data.fatherId ?? data.motherId;

      if (!parentId) {
        throw new Error('Parent must have a valid ID');
      }

      const parent = await prisma.person.findUnique({
        where: { person_id: parentId },
        select: {
          branch_id: true,
          generation_number: true,
        },
      });

      if (!parent) {
        throw new Error('Parent not found');
      }

      if (parent.branch_id !== branchId) {
        throw new Error('Parent must be in the same branch');
      }

      generationNumber = (parent.generation_number || 1) + 1;
    }

    if (data.generationNumber !== undefined && data.generationNumber !== null) {
      if (!canManageGenerations) {
        throw new Error('Only branch Gurus can set generation numbers manually');
      }
      generationNumber = data.generationNumber;
    }

    const canShareInLedger = canManageGenerations;
    const shareInLedger = canShareInLedger && Boolean(data.shareInLedger);
    const estimatedBirthYear =
      typeof data.estimatedBirthYear === 'number' ? data.estimatedBirthYear : null;

    // Create the person
    const person = await prisma.person.create({
      data: {
        person_id: randomUUID(),
        branch_id: branchId,
        full_name: `${data.firstName} ${data.lastName}`,
        surname: data.lastName,
        given_name: data.firstName,
        maiden_name: data.maidenName ?? null,
        gender: data.gender,
        generation_number: generationNumber,
        generation: `G${generationNumber}`,
        birth_date: data.birthDate ? new Date(data.birthDate) : null,
        birth_place: data.birthPlace ?? null,
        death_date: data.deathDate ? new Date(data.deathDate) : null,
        death_place: data.deathPlace ?? null,
        biography: data.biography ?? null,
        is_living: data.isAlive,
        visibility: data.privacyLevel ?? 'family_only',
        share_in_ledger: shareInLedger,
        estimated_birth_year: estimatedBirthYear,
        father_id: data.fatherId ?? null,
        mother_id: data.motherId ?? null,
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        family_branches: {
          select: {
            branch_id: true,
            surname: true,
            city_name: true,
          },
        },
      },
    });

    // Recalculate generations to keep tree consistent
    await this.recalculateGenerations(branchId);

    const refreshed = await prisma.person.findFirst({
      where: { person_id: person.person_id },
      include: {
        family_branches: {
          select: {
            branch_id: true,
            surname: true,
            city_name: true,
          },
        },
      },
    });

    return mapPerson((refreshed ?? person) as PersonRecord);
  }

  // Get all persons in a branch
  async getPersonsByBranch(branchId: string, actor?: JwtPayload | null) {
    const [canonicalPersons, linkedPersons] = await Promise.all([
      prisma.person.findMany({
        where: {
          branch_id: branchId,
        },
        include: {
          family_branches: {
            select: {
              branch_id: true,
              surname: true,
              city_name: true,
            },
          },
        },
        orderBy: [
          { generation_number: 'asc' },
          { birth_date: 'asc' },
        ],
      }),
      prisma.branchPersonLink.findMany({
        where: {
          branch_id: branchId,
          status: 'approved',
        },
        include: {
          persons: {
            include: {
              family_branches: {
                select: {
                  branch_id: true,
                  surname: true,
                  city_name: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
    ]);

    const canonicalRecords = canonicalPersons as PersonRecord[];
    const linkRecords = linkedPersons as Array<{
      link_id: string;
      status: string;
      display_name: string | null;
      display_generation_override: number | null;
      persons: PersonRecord;
    }>;

    const canonicalDtos = await Promise.all(
      canonicalRecords.map(async (record) => {
        let claimStatus: PersonClaimStatus | undefined;
        let canBeClaimed = false;
        if (actor) {
          [claimStatus, canBeClaimed] = await this.computeClaimInfo(branchId, record.person_id, actor);
        }

        return mapPerson(record, {
          canBeClaimed,
          claimStatus,
        });
      })
    );

    const linkedDtos = linkRecords.map((link) => {
      // Use display_generation_override for bridge persons if set
      const personRecord = link.persons as PersonRecord;
      if (link.display_generation_override) {
        personRecord.generation_number = link.display_generation_override;
        personRecord.generation = `G${link.display_generation_override}`;
      }

      return mapPerson(personRecord, {
        isLinked: true,
        linkId: link.link_id,
        linkedFromBranch: link.persons.family_branches
          ? {
              id: link.persons.family_branches.branch_id,
              surname: link.persons.family_branches.surname,
              cityName: link.persons.family_branches.city_name,
            }
          : null,
        linkStatus: link.status,
        linkDisplayName: link.display_name,
        canBeClaimed: false,
        claimStatus: undefined,
      });
    });

    return [...canonicalDtos, ...linkedDtos];
  }

  // Get a single person by ID
  async getPersonById(branchId: string, personId: string, actor?: JwtPayload | null) {
    const canonical = await prisma.person.findFirst({
      where: {
        person_id: personId,
        branch_id: branchId,
      },
      include: {
        family_branches: {
          select: {
            branch_id: true,
            surname: true,
            city_name: true,
          },
        },
      },
    });

    if (canonical) {
      const [claimStatus, canBeClaimed] = await this.computeClaimInfo(branchId, personId, actor);

      return mapPerson(canonical as PersonRecord, {
        canBeClaimed,
        claimStatus,
      });
    }

    const link = await prisma.branchPersonLink.findFirst({
      where: {
        branch_id: branchId,
        person_id: personId,
        status: 'approved',
      },
      include: {
        persons: {
          include: {
            family_branches: {
              select: {
                branch_id: true,
                surname: true,
                city_name: true,
              },
            },
          },
        },
      },
    });

    if (!link) {
      throw new Error('Person not found');
    }

    return mapPerson(link.persons as PersonRecord, {
      isLinked: true,
      linkId: link.link_id,
      linkedFromBranch: link.persons.family_branches
        ? {
            id: link.persons.family_branches.branch_id,
            surname: link.persons.family_branches.surname,
            cityName: link.persons.family_branches.city_name,
          }
        : null,
      linkStatus: link.status,
      linkDisplayName: link.display_name,
      canBeClaimed: false,
      claimStatus: undefined,
    });
  }

  // Update a person
  async updatePerson(
    branchId: string,
    personId: string,
    actor: JwtPayload,
    data: UpdatePersonInput
  ) {
    const isElevated = actor.globalRole === 'SUPER_GURU' || actor.globalRole === 'ADMIN';

    let membership: { role: string } | null = null;
    if (!isElevated) {
      membership = await prisma.branchMember.findFirst({
        where: {
          branch_id: branchId,
          user_id: actor.userId,
          status: 'active',
        },
        select: {
          role: true,
        },
      });

      if (!membership) {
        throw new Error('You must be a member of this branch to edit people');
      }
    }

    // Verify person exists and belongs to branch
    const existingPerson = await prisma.person.findFirst({
      where: {
        person_id: personId,
        branch_id: branchId,
      },
    });

    if (!existingPerson) {
      throw new Error('Person not found');
    }

    // Build update data
    const canManageGenerations = isElevated || membership?.role === 'guru';
    const canShareInLedger = canManageGenerations;

    const updateData: {
      full_name?: string;
      given_name?: string | null;
      surname?: string | null;
      maiden_name?: string | null;
      gender?: string | null;
      birth_date?: Date | null;
      birth_place?: string | null;
      death_date?: Date | null;
      death_place?: string | null;
      biography?: string | null;
      is_living?: boolean | null;
      visibility?: string;
      father_id?: string | null;
      mother_id?: string | null;
      share_in_ledger?: boolean;
      estimated_birth_year?: number | null;
      generation_number?: number | null;
      generation?: string | null;
    } = {};
    let shouldRecalculate = false;

    if (data.firstName || data.lastName) {
      const firstName = data.firstName || existingPerson.given_name || '';
      const lastName = data.lastName || existingPerson.surname || '';
      updateData.full_name = `${firstName} ${lastName}`.trim();
      if (data.firstName !== undefined) updateData.given_name = data.firstName;
      if (data.lastName !== undefined) updateData.surname = data.lastName;
    }

    if (data.maidenName !== undefined) updateData.maiden_name = data.maidenName;
    if (data.gender) updateData.gender = data.gender;

    if (data.birthDate !== undefined) {
      updateData.birth_date = data.birthDate ? new Date(data.birthDate) : null;
    }

    if (data.birthPlace !== undefined) {
      updateData.birth_place = data.birthPlace ?? null;
    }

    if (data.deathDate !== undefined) {
      updateData.death_date = data.deathDate ? new Date(data.deathDate) : null;
    }

    if (data.deathPlace !== undefined) {
      updateData.death_place = data.deathPlace ?? null;
    }

    if (data.biography !== undefined) updateData.biography = data.biography;
    if (data.isAlive !== undefined) updateData.is_living = data.isAlive;
    if (data.privacyLevel) updateData.visibility = data.privacyLevel;
    if (data.fatherId !== undefined) {
      updateData.father_id = data.fatherId;
      shouldRecalculate = true;
    }
    if (data.motherId !== undefined) {
      updateData.mother_id = data.motherId;
      shouldRecalculate = true;
    }
    if (data.shareInLedger !== undefined) {
      updateData.share_in_ledger = canShareInLedger && data.shareInLedger;
    }
    if (data.estimatedBirthYear !== undefined) {
      updateData.estimated_birth_year =
        typeof data.estimatedBirthYear === 'number' ? data.estimatedBirthYear : null;
    }
    if (data.generationNumber !== undefined) {
      if (!canManageGenerations) {
        throw new Error('Only branch Gurus can set generation numbers manually');
      }
      if (data.generationNumber === null) {
        updateData.generation_number = null;
        updateData.generation = null;
      } else {
        updateData.generation_number = data.generationNumber;
        updateData.generation = `G${data.generationNumber}`;
      }
      shouldRecalculate = true;
    }

    // Update the person
    const person = await prisma.person.update({
      where: { person_id: personId },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
    });

    if (shouldRecalculate) {
      await this.recalculateGenerations(branchId);
      const refreshed = await prisma.person.findFirst({
        where: { person_id: personId },
        include: {
          family_branches: {
            select: {
              branch_id: true,
              surname: true,
              city_name: true,
            },
          },
        },
      });
      return mapPerson((refreshed ?? person) as PersonRecord);
    }

    return mapPerson(person as PersonRecord);
  }

  // Delete a person
  async deletePerson(branchId: string, personId: string, actor: JwtPayload) {
    const isElevated = actor.globalRole === 'SUPER_GURU' || actor.globalRole === 'ADMIN';
    if (!isElevated) {
      const membership = await prisma.branchMember.findFirst({
        where: {
          branch_id: branchId,
          user_id: actor.userId,
          status: 'active',
          role: 'guru',
        },
      });

      if (!membership) {
        throw new Error('Only branch Gurus can delete people');
      }
    }

    // Check if person has children
    const person = await prisma.person.findFirst({
      where: {
        person_id: personId,
        branch_id: branchId,
      },
      include: {
        branch_person_links: {
          where: {
            status: 'approved',
          },
          select: {
            link_id: true,
          },
        },
      },
    });

    if (!person) {
      throw new Error('Person not found');
    }

    const childCount = await prisma.person.count({
      where: {
        branch_id: branchId,
        OR: [{ father_id: personId }, { mother_id: personId }],
      },
    });

    if (childCount > 0) {
      throw new Error('Cannot delete person with children. Remove children first or reassign them.');
    }

    if (person.branch_person_links && person.branch_person_links.length > 0) {
      throw new Error('Cannot delete person with active cross-branch links');
    }

    // Delete the person
    await prisma.person.delete({
      where: { person_id: personId },
    });

    // Update branch statistics
    await this.updateBranchStatistics(branchId);

    return { success: true };
  }

  private async computeClaimInfo(
    _branchId: string,
    personId: string,
    actor?: JwtPayload | null
  ): Promise<[PersonClaimStatus | undefined, boolean]> {
    if (!actor) {
      return [undefined, false];
    }

    const [actorClaim, pendingClaim, hasCrossBranchLink] = await Promise.all([
      prisma.personClaim.findFirst({
        where: {
          person_id: personId,
          user_id: actor.userId,
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
      prisma.personClaim.findFirst({
        where: {
          person_id: personId,
          status: 'pending',
        },
      }),
      this.hasActiveCrossBranchLink(personId),
    ]);

    const claimStatus = actorClaim ? (actorClaim.status as PersonClaimStatus) : undefined;

    if (hasCrossBranchLink) {
      return [claimStatus, false];
    }

    if (pendingClaim && pendingClaim.user_id !== actor.userId) {
      return [claimStatus, false];
    }

    if (actorClaim && actorClaim.status === 'pending') {
      return [claimStatus, false];
    }

    const canClaim = !actorClaim || actorClaim.status === 'rejected';
    return [claimStatus, canClaim];
  }

  private async hasActiveCrossBranchLink(personId: string): Promise<boolean> {
    const linkCount = await prisma.branchPersonLink.count({
      where: {
        person_id: personId,
        status: 'approved',
      },
    });

    return linkCount > 0;
  }

  // Get family tree for a branch
  async getFamilyTree(branchId: string) {
    await ensureBranchIsActive(branchId);

    const persons = await prisma.person.findMany({
      where: { branch_id: branchId },
      orderBy: [
        { generation_number: 'asc' },
        { birth_date: 'asc' },
      ],
    });

    return (persons as PersonRecord[]).map((record) => mapPerson(record));
  }

  // Update branch statistics
  private async updateBranchStatistics(branchId: string) {
    await ensureBranchIsActive(branchId);

    const persons = await prisma.person.findMany({
      where: { branch_id: branchId },
      select: { generation_number: true },
    }) as Array<{ generation_number: number | null }>;

    const totalPeople = persons.length;
    const totalGenerations = persons.reduce((max, current) => {
      const value = current.generation_number ?? 0;
      return value > max ? value : max;
    }, 0);

    await prisma.familyBranch.update({
      where: { branch_id: branchId },
      data: {
        total_people: totalPeople,
        total_generations: totalGenerations,
      },
    });
  }

  /**
   * Recalculate generation numbers for all persons in a branch
   * Uses depth-first search from root ancestors and adjusts spouses
   */
  async recalculateGenerations(branchId: string) {
    await ensureBranchIsActive(branchId);

    type GenerationPerson = {
      person_id: string;
      father_id: string | null;
      mother_id: string | null;
      generation_number: number | null;
    };

    const persons = await prisma.person.findMany({
      where: { branch_id: branchId },
      select: {
        person_id: true,
        father_id: true,
        mother_id: true,
        generation_number: true,
      },
    }) as GenerationPerson[];

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

      const person = persons.find((p) => p.person_id === personId);
      if (!person) {
        return 1;
      }

      // If no parents, check if they have children to infer generation
      if (!person.father_id && !person.mother_id) {
        const children = persons.filter(
          (p) => p.father_id === person.person_id || p.mother_id === person.person_id
        );

        if (children.length > 0) {
          // Calculate generation based on children (their gen - 1)
          const childGenerations = children.map((child) =>
            calculateGeneration(child.person_id, new Set(visited))
          );
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

      if (person.father_id) {
        const fatherGen = calculateGeneration(person.father_id, new Set(visited));
        parentGeneration = Math.max(parentGeneration, fatherGen);
      }

      if (person.mother_id) {
        const motherGen = calculateGeneration(person.mother_id, new Set(visited));
        parentGeneration = Math.max(parentGeneration, motherGen);
      }

      const generation = parentGeneration + 1;
      generationMap.set(personId, generation);
      return generation;
    };

    // Calculate generations for all persons
    persons.forEach((person) => {
      calculateGeneration(person.person_id);
    });

    // Update all persons with correct generation numbers
    const updates = [];
    for (const [personId, generationNum] of generationMap.entries()) {
      updates.push(
        prisma.person.update({
          where: { person_id: personId },
          data: {
            generation_number: generationNum,
            generation: `G${generationNum}`,
            updated_at: new Date(),
          },
        })
      );
    }

    await Promise.all(updates);

    // Update branch statistics
    const maxGeneration = Math.max(...Array.from(generationMap.values()));
    const totalPeople = persons.length;

    await prisma.familyBranch.update({
      where: { branch_id: branchId },
      data: {
        total_generations: maxGeneration,
        total_people: totalPeople,
        updated_at: new Date(),
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
