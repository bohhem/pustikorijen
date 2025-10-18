import { PrismaClient } from '@prisma/client';
import type { Partnership } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreatePartnershipInput {
  branchId: string;
  person1Id: string;
  person2Id: string;
  partnershipType?: string;
  startDate?: string;
  startPlace?: string;
  endDate?: string;
  endPlace?: string;
  endReason?: string;
  status?: string;
  orderNumber?: number;
  notes?: string;
  ceremonyType?: string;
  visibility?: string;
}

export interface UpdatePartnershipInput {
  partnershipType?: string;
  startDate?: string;
  startPlace?: string;
  endDate?: string;
  endPlace?: string;
  endReason?: string;
  status?: string;
  isCurrent?: boolean;
  orderNumber?: number;
  notes?: string;
  ceremonyType?: string;
  visibility?: string;
}

/**
 * Create a new partnership
 */
export async function createPartnership(
  input: CreatePartnershipInput,
  userId: string
): Promise<Partnership> {
  const { branchId, person1Id, person2Id, startDate, endDate, ...rest } = input;

  // Validate that both persons exist and belong to the branch
  const [person1, person2] = await Promise.all([
    prisma.person.findUnique({ where: { id: person1Id } }),
    prisma.person.findUnique({ where: { id: person2Id } }),
  ]);

  if (!person1 || person1.branchId !== branchId) {
    throw new Error('Person 1 not found in this branch');
  }

  if (!person2 || person2.branchId !== branchId) {
    throw new Error('Person 2 not found in this branch');
  }

  // Ensure person1Id < person2Id for consistency
  const [partnerId1, partnerId2] = [person1Id, person2Id].sort();

  // Check for existing partnership
  const existing = await prisma.partnership.findFirst({
    where: {
      OR: [
        { person1Id: partnerId1, person2Id: partnerId2 },
        { person1Id: partnerId2, person2Id: partnerId1 },
      ],
      orderNumber: rest.orderNumber || 1,
    },
  });

  if (existing) {
    throw new Error('Partnership already exists between these persons');
  }

  // Create partnership
  const partnership = await prisma.partnership.create({
    data: {
      branchId,
      person1Id: partnerId1,
      person2Id: partnerId2,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      createdById: userId,
      ...rest,
    },
    include: {
      person1: {
        select: {
          id: true,
          fullName: true,
          givenName: true,
          surname: true,
          birthDate: true,
          deathDate: true,
          profilePhotoUrl: true,
        },
      },
      person2: {
        select: {
          id: true,
          fullName: true,
          givenName: true,
          surname: true,
          birthDate: true,
          deathDate: true,
          profilePhotoUrl: true,
        },
      },
    },
  });

  return partnership;
}

/**
 * Get partnerships for a branch
 */
export async function getBranchPartnerships(branchId: string) {
  const partnerships = await prisma.partnership.findMany({
    where: { branchId },
    include: {
      person1: {
        select: {
          id: true,
          fullName: true,
          givenName: true,
          surname: true,
          birthDate: true,
          deathDate: true,
          profilePhotoUrl: true,
        },
      },
      person2: {
        select: {
          id: true,
          fullName: true,
          givenName: true,
          surname: true,
          birthDate: true,
          deathDate: true,
          profilePhotoUrl: true,
        },
      },
    },
    orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
  });

  return partnerships;
}

/**
 * Get partnerships for a specific person
 */
export async function getPersonPartnerships(personId: string) {
  const partnerships = await prisma.partnership.findMany({
    where: {
      OR: [{ person1Id: personId }, { person2Id: personId }],
    },
    include: {
      person1: {
        select: {
          id: true,
          fullName: true,
          givenName: true,
          surname: true,
          maidenName: true,
          birthDate: true,
          deathDate: true,
          profilePhotoUrl: true,
        },
      },
      person2: {
        select: {
          id: true,
          fullName: true,
          givenName: true,
          surname: true,
          maidenName: true,
          birthDate: true,
          deathDate: true,
          profilePhotoUrl: true,
        },
      },
    },
    orderBy: [{ orderNumber: 'asc' }, { startDate: 'desc' }],
  });

  return partnerships;
}

/**
 * Get partnership by ID
 */
export async function getPartnershipById(id: string) {
  const partnership = await prisma.partnership.findUnique({
    where: { id },
    include: {
      person1: {
        select: {
          id: true,
          fullName: true,
          givenName: true,
          surname: true,
          maidenName: true,
          birthDate: true,
          deathDate: true,
          profilePhotoUrl: true,
        },
      },
      person2: {
        select: {
          id: true,
          fullName: true,
          givenName: true,
          surname: true,
          maidenName: true,
          birthDate: true,
          deathDate: true,
          profilePhotoUrl: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  if (!partnership) {
    throw new Error('Partnership not found');
  }

  return partnership;
}

/**
 * Update partnership
 */
export async function updatePartnership(
  id: string,
  input: UpdatePartnershipInput,
  _userId: string
) {
  const existing = await prisma.partnership.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Partnership not found');
  }

  const { startDate, endDate, ...rest } = input;

  const partnership = await prisma.partnership.update({
    where: { id },
    data: {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      ...rest,
      updatedAt: new Date(),
    },
    include: {
      person1: {
        select: {
          id: true,
          fullName: true,
          givenName: true,
          surname: true,
          birthDate: true,
          deathDate: true,
          profilePhotoUrl: true,
        },
      },
      person2: {
        select: {
          id: true,
          fullName: true,
          givenName: true,
          surname: true,
          birthDate: true,
          deathDate: true,
          profilePhotoUrl: true,
        },
      },
    },
  });

  return partnership;
}

/**
 * Delete partnership
 */
export async function deletePartnership(id: string, _userId: string) {
  const existing = await prisma.partnership.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Partnership not found');
  }

  await prisma.partnership.delete({
    where: { id },
  });

  return { message: 'Partnership deleted successfully' };
}

/**
 * Get spouse for a person (current active partnership)
 */
export async function getPersonSpouse(personId: string) {
  const partnership = await prisma.partnership.findFirst({
    where: {
      OR: [{ person1Id: personId }, { person2Id: personId }],
      status: 'active',
      isCurrent: true,
    },
    include: {
      person1: {
        select: {
          id: true,
          fullName: true,
          givenName: true,
          surname: true,
          maidenName: true,
          birthDate: true,
          deathDate: true,
          profilePhotoUrl: true,
        },
      },
      person2: {
        select: {
          id: true,
          fullName: true,
          givenName: true,
          surname: true,
          maidenName: true,
          birthDate: true,
          deathDate: true,
          profilePhotoUrl: true,
        },
      },
    },
  });

  if (!partnership) {
    return null;
  }

  // Return the other person (spouse)
  return partnership.person1Id === personId
    ? partnership.person2
    : partnership.person1;
}
