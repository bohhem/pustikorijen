import { randomUUID } from 'crypto';
import prisma from '../utils/prisma';

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

type PartnershipPersonRecord = {
  person_id: string;
  full_name: string;
  given_name: string | null;
  surname: string | null;
  maiden_name: string | null;
  birth_date: Date | null;
  death_date: Date | null;
  profile_photo_url: string | null;
};

type PartnershipRecord = {
  partnership_id: string;
  branch_id: string;
  person1_id: string;
  person2_id: string;
  partnership_type: string;
  start_date: Date | null;
  start_place: string | null;
  end_date: Date | null;
  end_place: string | null;
  end_reason: string | null;
  status: string;
  is_current: boolean;
  order_number: number;
  notes: string | null;
  ceremony_type: string | null;
  visibility: string;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  persons_partnerships_person1_idTopersons?: PartnershipPersonRecord | null;
  persons_partnerships_person2_idTopersons?: PartnershipPersonRecord | null;
  users_partnerships_created_byTousers?: { user_id: string; full_name: string } | null;
};

const relatedPersonSelect = {
  person_id: true,
  full_name: true,
  given_name: true,
  surname: true,
  maiden_name: true,
  birth_date: true,
  death_date: true,
  profile_photo_url: true,
};

const toIso = (value?: Date | null): string | undefined => {
  if (!value) {
    return undefined;
  }
  return value.toISOString();
};

function mapPartnershipPerson(record?: PartnershipPersonRecord | null) {
  if (!record) {
    return undefined;
  }

  return {
    id: record.person_id,
    fullName: record.full_name,
    givenName: record.given_name ?? undefined,
    surname: record.surname ?? undefined,
    maidenName: record.maiden_name ?? undefined,
    birthDate: toIso(record.birth_date),
    deathDate: toIso(record.death_date),
    profilePhotoUrl: record.profile_photo_url ?? undefined,
  };
}

function mapPartnership(record: PartnershipRecord) {
  return {
    id: record.partnership_id,
    branchId: record.branch_id,
    person1Id: record.person1_id,
    person2Id: record.person2_id,
    partnershipType: record.partnership_type,
    startDate: toIso(record.start_date),
    startPlace: record.start_place ?? undefined,
    endDate: toIso(record.end_date),
    endPlace: record.end_place ?? undefined,
    endReason: record.end_reason ?? undefined,
    status: record.status as 'active' | 'ended' | 'annulled',
    isCurrent: record.is_current,
    orderNumber: record.order_number,
    notes: record.notes ?? undefined,
    ceremonyType: record.ceremony_type ?? undefined,
    visibility: record.visibility as 'public' | 'family_only' | 'private',
    createdAt: toIso(record.created_at)!,
    updatedAt: toIso(record.updated_at)!,
    person1: mapPartnershipPerson(record.persons_partnerships_person1_idTopersons),
    person2: mapPartnershipPerson(record.persons_partnerships_person2_idTopersons),
    createdBy: record.users_partnerships_created_byTousers
      ? {
          id: record.users_partnerships_created_byTousers.user_id,
          fullName: record.users_partnerships_created_byTousers.full_name,
        }
      : undefined,
  };
}

/**
 * Create a new partnership
 */
export async function createPartnership(
  input: CreatePartnershipInput,
  userId: string
): Promise<unknown> {
  const { branchId, person1Id, person2Id, startDate, endDate, ...rest } = input;

  // Validate that both persons exist and get their full details including generation
  const [person1, person2] = await Promise.all([
    prisma.person.findUnique({
      where: { person_id: person1Id },
      select: {
        person_id: true,
        branch_id: true,
        generation_number: true,
        full_name: true,
      },
    }),
    prisma.person.findUnique({
      where: { person_id: person2Id },
      select: {
        person_id: true,
        branch_id: true,
        generation_number: true,
        full_name: true,
      },
    }),
  ]);

  if (!person1) {
    throw new Error('Person 1 not found');
  }

  if (!person2) {
    throw new Error('Person 2 not found');
  }

  // At least one person must be from the partnership branch
  const hasLocalPerson = person1.branch_id === branchId || person2.branch_id === branchId;
  if (!hasLocalPerson) {
    throw new Error('At least one person must be from the partnership branch');
  }

  // Detect cross-branch partnership
  const isCrossBranchPartnership = person1.branch_id !== person2.branch_id;
  let foreignPerson = null;
  let localPerson = null;

  if (isCrossBranchPartnership) {
    // Identify which person is from the partnership branch (local) and which is foreign
    if (person1.branch_id === branchId) {
      localPerson = person1;
      foreignPerson = person2;
    } else {
      localPerson = person2;
      foreignPerson = person1;
    }
  }

  // Ensure person1Id < person2Id for consistency
  const [partnerId1, partnerId2] = [person1.person_id, person2.person_id].sort();

  // Check for existing partnership
  const existing = await prisma.partnership.findFirst({
    where: {
      branch_id: branchId,
      OR: [
        { person1_id: partnerId1, person2_id: partnerId2 },
        { person1_id: partnerId2, person2_id: partnerId1 },
      ],
      order_number: rest.orderNumber ?? 1,
    },
  });

  if (existing) {
    throw new Error('Partnership already exists between these persons');
  }

  // Create partnership
  const partnership = await prisma.partnership.create({
    data: {
      partnership_id: randomUUID(),
      branch_id: branchId,
      person1_id: partnerId1,
      person2_id: partnerId2,
      partnership_type: rest.partnershipType ?? 'marriage',
      start_date: startDate ? new Date(startDate) : null,
      start_place: rest.startPlace ?? null,
      end_date: endDate ? new Date(endDate) : null,
      end_place: rest.endPlace ?? null,
      end_reason: rest.endReason ?? null,
      status: rest.status ?? 'active',
      is_current: true,
      order_number: rest.orderNumber ?? 1,
      notes: rest.notes ?? null,
      ceremony_type: rest.ceremonyType ?? null,
      visibility: rest.visibility ?? 'family_only',
      created_by: userId,
      updated_at: new Date(),
    },
    include: {
      persons_partnerships_person1_idTopersons: {
        select: relatedPersonSelect,
      },
      persons_partnerships_person2_idTopersons: {
        select: relatedPersonSelect,
      },
      users_partnerships_created_byTousers: {
        select: {
          user_id: true,
          full_name: true,
        },
      },
    },
  });

  // Auto-create bridge link for cross-branch partnerships
  if (isCrossBranchPartnership && foreignPerson && localPerson) {
    try {
      // Check if bridge link already exists
      const existingBridgeLink = await prisma.branchPersonLink.findFirst({
        where: {
          person_id: foreignPerson.person_id,
          branch_id: branchId,
          source_branch_id: foreignPerson.branch_id,
        },
      });

      if (!existingBridgeLink) {
        // Create new bridge link
        await prisma.branchPersonLink.create({
          data: {
            link_id: randomUUID(),
            person_id: foreignPerson.person_id,
            branch_id: branchId, // Target branch (marrying into)
            source_branch_id: foreignPerson.branch_id, // Source branch (birth branch)
            status: 'approved', // Auto-approve for marriages
            display_generation_override: localPerson.generation_number, // Adopt spouse's generation
            notes: `Auto-created bridge link through marriage to ${localPerson.full_name}`,
            requested_by: userId,
            source_approved_by: userId,
            source_approved_at: new Date(),
            target_approved_by: userId,
            target_approved_at: new Date(),
            is_primary_bridge: true, // Mark as primary bridge
            primary_set_by: userId,
            primary_set_at: new Date(),
            updated_at: new Date(),
          },
        });
      } else if (!existingBridgeLink.display_generation_override) {
        // Update existing bridge link with generation override if not set
        await prisma.branchPersonLink.update({
          where: { link_id: existingBridgeLink.link_id },
          data: {
            display_generation_override: localPerson.generation_number,
            updated_at: new Date(),
          },
        });
      }
    } catch (error) {
      // Log error but don't fail partnership creation
      console.error('Failed to create/update bridge link:', error);
    }
  }

  return mapPartnership(partnership as PartnershipRecord);
}

/**
 * Get partnerships for a branch
 */
export async function getBranchPartnerships(branchId: string) {
  const partnerships = await prisma.partnership.findMany({
    where: { branch_id: branchId },
    include: {
      persons_partnerships_person1_idTopersons: {
        select: relatedPersonSelect,
      },
      persons_partnerships_person2_idTopersons: {
        select: relatedPersonSelect,
      },
    },
    orderBy: [{ start_date: 'desc' }, { created_at: 'desc' }],
  });

  return (partnerships as PartnershipRecord[]).map(mapPartnership);
}

/**
 * Get partnerships for a specific person
 */
export async function getPersonPartnerships(personId: string) {
  const partnerships = await prisma.partnership.findMany({
    where: {
      OR: [{ person1_id: personId }, { person2_id: personId }],
    },
    include: {
      persons_partnerships_person1_idTopersons: {
        select: relatedPersonSelect,
      },
      persons_partnerships_person2_idTopersons: {
        select: relatedPersonSelect,
      },
    },
    orderBy: [{ order_number: 'asc' }, { start_date: 'desc' }],
  });

  return (partnerships as PartnershipRecord[]).map(mapPartnership);
}

/**
 * Get partnership by ID
 */
export async function getPartnershipById(id: string) {
  const partnership = await prisma.partnership.findUnique({
    where: { partnership_id: id },
    include: {
      persons_partnerships_person1_idTopersons: {
        select: relatedPersonSelect,
      },
      persons_partnerships_person2_idTopersons: {
        select: relatedPersonSelect,
      },
      users_partnerships_created_byTousers: {
        select: {
          user_id: true,
          full_name: true,
        },
      },
    },
  });

  if (!partnership) {
    throw new Error('Partnership not found');
  }

  return mapPartnership(partnership as PartnershipRecord);
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
    where: { partnership_id: id },
  });

  if (!existing) {
    throw new Error('Partnership not found');
  }

  const { startDate, endDate, ...rest } = input;

  const data: Record<string, unknown> = {};

  if (startDate !== undefined) {
    data.start_date = startDate ? new Date(startDate) : null;
  }

  if (endDate !== undefined) {
    data.end_date = endDate ? new Date(endDate) : null;
  }

  if (rest.partnershipType !== undefined) data.partnership_type = rest.partnershipType;
  if (rest.startPlace !== undefined) data.start_place = rest.startPlace ?? null;
  if (rest.endPlace !== undefined) data.end_place = rest.endPlace ?? null;
  if (rest.endReason !== undefined) data.end_reason = rest.endReason ?? null;
  if (rest.status !== undefined) data.status = rest.status;
  if (rest.isCurrent !== undefined) data.is_current = rest.isCurrent;
  if (rest.orderNumber !== undefined) data.order_number = rest.orderNumber;
  if (rest.notes !== undefined) data.notes = rest.notes ?? null;
  if (rest.ceremonyType !== undefined) data.ceremony_type = rest.ceremonyType ?? null;
  if (rest.visibility !== undefined) data.visibility = rest.visibility;

  data.updated_at = new Date();

  const partnership = await prisma.partnership.update({
    where: { partnership_id: id },
    data,
    include: {
      persons_partnerships_person1_idTopersons: {
        select: relatedPersonSelect,
      },
      persons_partnerships_person2_idTopersons: {
        select: relatedPersonSelect,
      },
      users_partnerships_created_byTousers: {
        select: {
          user_id: true,
          full_name: true,
        },
      },
    },
  });

  return mapPartnership(partnership as PartnershipRecord);
}

/**
 * Delete partnership
 */
export async function deletePartnership(id: string, _userId: string) {
  const existing = await prisma.partnership.findUnique({
    where: { partnership_id: id },
  });

  if (!existing) {
    throw new Error('Partnership not found');
  }

  await prisma.partnership.delete({
    where: { partnership_id: id },
  });

  return { message: 'Partnership deleted successfully' };
}

/**
 * Get spouse for a person (current active partnership)
 */
export async function getPersonSpouse(personId: string) {
  const partnership = await prisma.partnership.findFirst({
    where: {
      OR: [{ person1_id: personId }, { person2_id: personId }],
      status: 'active',
      is_current: true,
    },
    include: {
      persons_partnerships_person1_idTopersons: {
        select: relatedPersonSelect,
      },
      persons_partnerships_person2_idTopersons: {
        select: relatedPersonSelect,
      },
    },
  });

  if (!partnership) {
    return null;
  }

  // Return the other person (spouse)
  const mapped = mapPartnership(partnership as PartnershipRecord);
  return mapped.person1Id === personId ? mapped.person2 ?? null : mapped.person1 ?? null;
}
