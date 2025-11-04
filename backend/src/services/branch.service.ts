import { randomUUID } from 'crypto';
import type { JwtPayload } from '../utils/jwt';
import prisma from '../utils/prisma';
import { GEO_CITY_INCLUDE, mapGeoCity, type GeoCityRecord } from './geo.service';
type ActingUser = Pick<JwtPayload, 'userId' | 'globalRole'>;

type BranchRecord = {
  branch_id: string;
  surname: string;
  surname_normalized: string;
  city_code: string;
  city_name: string;
  region: string | null;
  country: string;
  geo_city_id: string | null;
  root_person_id: string | null;
  oldest_ancestor_year: number | null;
  total_people: number;
  total_generations: number;
  description: string | null;
  founded_by: string | null;
  visibility: 'public' | 'family_only' | 'private';
  is_verified: boolean;
  verification_date: Date | null;
  root_change_count: number;
  last_major_update: Date | null;
  created_at: Date;
  updated_at: Date;
  users?: {
    user_id: string;
    full_name: string;
    email?: string | null;
    last_login?: Date | null;
  } | null;
  geo_city?: GeoCityRecord | null;
  _count?: {
    branch_members?: number;
    persons?: number;
    stories?: number;
    documents?: number;
  } | null;
};

type BranchMemberRecord = {
  member_id: string;
  branch_id: string;
  user_id: string;
  role: string;
  person_id: string | null;
  can_edit_generations: string | null;
  auto_approve_photos: boolean;
  auto_approve_stories: boolean;
  status: 'pending' | 'active' | 'suspended' | 'removed';
  invited_by: string | null;
  approved_by: string | null;
  approved_at: Date | null;
  contribution_count: number;
  last_contribution: Date | null;
  joined_at: Date;
  updated_at: Date;
  join_message: string | null;
  users_branch_members_user_idTousers?: {
    user_id: string;
    full_name: string;
    email?: string | null;
    current_location?: string | null;
  } | null;
  persons?: {
    person_id: string;
    full_name: string;
  } | null;
};

function mapUser(user?: { user_id: string; full_name: string; email?: string | null; current_location?: string | null } | null) {
  if (!user) {
    return undefined;
  }

  return {
    id: user.user_id,
    fullName: user.full_name,
    email: user.email ?? undefined,
    currentLocation: user.current_location ?? null,
  };
}

function mapBranch(record: BranchRecord) {
  return {
    id: record.branch_id,
    surname: record.surname,
    surnameNormalized: record.surname_normalized,
    cityCode: record.city_code,
    cityName: record.city_name,
    region: record.region,
    country: record.country,
    geoCityId: record.geo_city_id ?? undefined,
    location: mapGeoCity(record.geo_city),
    rootPersonId: record.root_person_id,
    oldestAncestorYear: record.oldest_ancestor_year,
    totalPeople: record.total_people,
    totalGenerations: record.total_generations,
    description: record.description,
    foundedById: record.founded_by,
    visibility: record.visibility,
    isVerified: record.is_verified,
    verificationDate: record.verification_date,
    rootChangeCount: record.root_change_count,
    lastMajorUpdate: record.last_major_update,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    foundedBy: record.users
      ? {
          id: record.users.user_id,
          fullName: record.users.full_name,
          email: record.users.email ?? undefined,
          lastLogin: record.users.last_login ?? undefined,
        }
      : undefined,
    _count: record._count
      ? {
          members: record._count.branch_members ?? 0,
          persons: record._count.persons ?? 0,
          stories: record._count.stories ?? 0,
          documents: record._count.documents ?? 0,
        }
      : undefined,
  };
}

function mapBranchMember(record: BranchMemberRecord) {
  return {
    id: record.member_id,
    branchId: record.branch_id,
    userId: record.user_id,
    role: record.role as BranchMemberRecord['role'],
    personId: record.person_id,
    canEditGenerations: record.can_edit_generations,
    autoApprovePhotos: record.auto_approve_photos,
    autoApproveStories: record.auto_approve_stories,
    status: record.status,
    joinMessage: record.join_message,
    contributionCount: record.contribution_count,
    lastContribution: record.last_contribution,
    joinedAt: record.joined_at,
    updatedAt: record.updated_at,
    user: mapUser(record.users_branch_members_user_idTousers),
    person: record.persons
      ? {
          id: record.persons.person_id,
          fullName: record.persons.full_name,
        }
      : undefined,
  };
}

interface CreateBranchInput {
  surname: string;
  geoCityId: string;
  description?: string;
  visibility?: 'public' | 'family_only' | 'private';
  foundedById: string;
}

interface UpdateBranchInput {
  surname?: string;
  description?: string | null;
  visibility?: 'public' | 'family_only' | 'private';
  geoCityId?: string;
}

/**
 * Generate unique branch ID in format: FB-CITY-SURNAME-001
 */
async function generateBranchId(cityCode: string, surname: string): Promise<string> {
  // Normalize surname: uppercase, remove special characters
  const normalizedSurname = surname
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^A-Z]/g, ''); // Keep only letters

  // Normalize city code: uppercase
  const normalizedCityCode = cityCode.toUpperCase();

  // Find existing branches with same surname and city
  const existingBranches = await prisma.familyBranch.findMany({
    where: {
      city_code: normalizedCityCode,
      surname_normalized: normalizedSurname,
    },
    orderBy: {
      branch_id: 'desc',
    },
    take: 1,
  });

  // Extract sequence number from last branch
  let sequence = 1;
  if (existingBranches.length > 0) {
    const lastId = existingBranches[0].branch_id;
    const match = lastId.match(/-(\d+)$/);
    if (match) {
      sequence = parseInt(match[1]) + 1;
    }
  }

  // Format: FB-CITY-SURNAME-001
  const sequenceStr = sequence.toString().padStart(3, '0');
  return `FB-${normalizedCityCode}-${normalizedSurname}-${sequenceStr}`;
}

/**
 * Create a new family branch
 */
export async function createBranch(data: CreateBranchInput) {
  const { surname, geoCityId, description, visibility, foundedById } = data;

  const geoCity = await prisma.geoCity.findUnique({
    where: { city_id: geoCityId },
    include: GEO_CITY_INCLUDE,
  });

  if (!geoCity) {
    throw new Error('Invalid city selection');
  }

  const branchId = await generateBranchId(geoCity.city_code, surname);

  // Normalize surname for searching
  const surnameNormalized = surname
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const locationRegion = geoCity.region?.name ?? geoCity.entity_region?.name ?? null;
  const countryName = geoCity.state?.name ?? 'Bosnia and Herzegovina';

  // Create branch
  const branch = await prisma.familyBranch.create({
    data: {
      branch_id: branchId,
      surname,
      surname_normalized: surnameNormalized,
      city_code: geoCity.city_code.toUpperCase(),
      city_name: geoCity.name,
      region: locationRegion,
      country: countryName,
      geo_city_id: geoCity.city_id,
      description: description || null,
      visibility: visibility || 'public',
      founded_by: foundedById,
      updated_at: new Date(),
    },
    include: {
      users: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
          last_login: true,
        },
      },
      geo_city: {
        include: GEO_CITY_INCLUDE,
      },
    },
  });

  // Add founder as first Guru member
  await prisma.branchMember.create({
    data: {
      member_id: randomUUID(),
      branch_id: branch.branch_id,
      user_id: foundedById,
      role: 'guru',
      status: 'active',
      approved_by: foundedById,
      approved_at: new Date(),
      joined_at: new Date(),
      updated_at: new Date(),
    },
  });

  return mapBranch(branch as BranchRecord);
}

/**
 * Update branch details (Guru or elevated role)
 */
export async function updateBranch(branchId: string, input: UpdateBranchInput, actor: ActingUser) {
  const branch = await prisma.familyBranch.findUnique({
    where: { branch_id: branchId },
  });

  if (!branch) {
    throw new Error('Branch not found');
  }

  const isElevated = actor.globalRole === 'SUPER_GURU' || actor.globalRole === 'ADMIN';

  if (!isElevated) {
    const membership = await prisma.branchMember.findUnique({
      where: {
        branch_id_user_id: {
          branch_id: branchId,
          user_id: actor.userId,
        },
      },
    });

    if (!membership || membership.role !== 'guru' || membership.status !== 'active') {
      throw new Error('Only branch Gurus or platform admins can update branch details');
    }
  }

  const { surname, description, visibility, geoCityId } = input;

  if (
    surname === undefined &&
    description === undefined &&
    visibility === undefined &&
    geoCityId === undefined
  ) {
    throw new Error('No updates provided');
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date(),
  };

  if (surname !== undefined) {
    updateData.surname = surname;
    updateData.surname_normalized = surname.toUpperCase();
  }

  if (description !== undefined) {
    updateData.description = description ?? null;
  }

  if (visibility !== undefined) {
    updateData.visibility = visibility;
  }

  let geoCity: GeoCityRecord | null = null;
  if (geoCityId !== undefined) {
    geoCity = await prisma.geoCity.findUnique({
      where: { city_id: geoCityId },
      include: GEO_CITY_INCLUDE,
    });

    if (!geoCity) {
      throw new Error('Invalid city selection');
    }

    updateData.geo_city_id = geoCity.city_id;
    updateData.city_code = geoCity.city_code.toUpperCase();
    updateData.city_name = geoCity.name;
    updateData.region = geoCity.region?.name ?? geoCity.entity_region?.name ?? null;
    updateData.country = geoCity.state?.name ?? 'Bosnia and Herzegovina';
  }

  const updatedBranch = await prisma.familyBranch.update({
    where: { branch_id: branchId },
    data: updateData,
    include: {
      users: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
          last_login: true,
        },
      },
      geo_city: {
        include: GEO_CITY_INCLUDE,
      },
      _count: {
        select: {
          branch_members: true,
          persons: true,
          stories: true,
          documents: true,
        },
      },
    },
  });

  return mapBranch(updatedBranch as BranchRecord);
}

/**
 * Get all branches with pagination and filters
 */
export async function getBranches(params: {
  page?: number;
  limit?: number;
  surname?: string;
  cityCode?: string;
  search?: string;
}) {
  const { page = 1, limit = 20, surname, cityCode, search } = params;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Record<string, unknown> = {
    visibility: 'public', // Only show public branches for now
  };

  if (surname) {
    where.surname_normalized = {
      contains: surname.toUpperCase(),
    };
  }

  if (cityCode) {
    where.city_code = cityCode.toUpperCase();
  }

  if (search) {
    const searchUpper = search.toUpperCase();
    where.OR = [
      { surname_normalized: { contains: searchUpper } },
      { city_name: { contains: search, mode: 'insensitive' } },
      { region: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Get branches and total count
  const [branches, total] = await Promise.all([
    prisma.familyBranch.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        updated_at: 'desc',
      },
      include: {
        users: {
          select: {
            user_id: true,
            full_name: true,
            last_login: true,
          },
        },
        geo_city: {
          include: GEO_CITY_INCLUDE,
        },
        _count: {
          select: {
            branch_members: true,
            persons: true,
          },
        },
      },
    }),
    prisma.familyBranch.count({ where }),
  ]);

  const normalizedBranches = (branches as BranchRecord[]).map(mapBranch);

  return {
    branches: normalizedBranches,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get branch by ID
 */
export async function getBranchById(branchId: string) {
  const branch = await prisma.familyBranch.findUnique({
    where: { branch_id: branchId },
    include: {
      users: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
          last_login: true,
        },
      },
      geo_city: {
        include: GEO_CITY_INCLUDE,
      },
      _count: {
        select: {
          branch_members: true,
          persons: true,
          stories: true,
          documents: true,
        },
      },
    },
  });

  if (!branch) {
    throw new Error('Branch not found');
  }

  return mapBranch(branch as BranchRecord);
}

/**
 * Get branch members
 */
export async function getBranchMembers(branchId: string, _userId?: string) {
  // Check if branch exists
  const branch = await prisma.familyBranch.findUnique({
    where: { branch_id: branchId },
  });

  if (!branch) {
    throw new Error('Branch not found');
  }

  if (branch.founded_by) {
    const founderMembership = await prisma.branchMember.findUnique({
      where: {
        branch_id_user_id: {
          branch_id: branchId,
          user_id: branch.founded_by,
        },
      },
      select: {
        role: true,
        status: true,
      },
    });

    if (founderMembership) {
      const adjustments: Record<string, unknown> = {};

      if (founderMembership.role !== 'guru') {
        adjustments.role = 'guru';
      }

      if (founderMembership.status !== 'active') {
        adjustments.status = 'active';
      }

      if (Object.keys(adjustments).length > 0) {
        await prisma.branchMember.update({
          where: {
            branch_id_user_id: {
              branch_id: branchId,
              user_id: branch.founded_by,
            },
          },
          data: {
            ...adjustments,
            updated_at: new Date(),
          },
        });
      }
    } else {
      await prisma.branchMember.create({
        data: {
          member_id: randomUUID(),
          branch_id: branchId,
          user_id: branch.founded_by,
          role: 'guru',
          status: 'active',
          joined_at: new Date(),
          updated_at: new Date(),
          approved_by: branch.founded_by,
          approved_at: new Date(),
        },
      });
    }
  }

  // Get members
  const members = await prisma.branchMember.findMany({
    where: {
      branch_id: branchId,
      status: 'active',
    },
    include: {
      users_branch_members_user_idTousers: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
          current_location: true,
        },
      },
      persons: {
        select: {
          person_id: true,
          full_name: true,
        },
      },
    },
    orderBy: [
      { role: 'asc' }, // Gurus first
      { joined_at: 'asc' },
    ],
  });

  return (members as BranchMemberRecord[]).map(mapBranchMember);
}

/**
 * Request to join a branch
 */
export async function requestJoinBranch(branchId: string, userId: string, message?: string) {
  // Check if branch exists
  const branch = await prisma.familyBranch.findUnique({
    where: { branch_id: branchId },
  });

  if (!branch) {
    throw new Error('Branch not found');
  }

  // Check if already a member
  const existingMember = await prisma.branchMember.findUnique({
    where: {
      branch_id_user_id: {
        branch_id: branchId,
        user_id: userId,
      },
    },
  });

  if (existingMember) {
    if (existingMember.status === 'active') {
      throw new Error('Already a member of this branch');
    }
    if (existingMember.status === 'pending') {
      throw new Error('Join request already pending');
    }

    // Allow previously removed/suspended users to reapply by resetting their status
    const rejoinData = {
      status: 'pending',
      role: 'member',
      approved_by: null,
      approved_at: null,
      joined_at: new Date(),
      join_message: message ?? null,
      updated_at: new Date(),
    };

    const rejoinRequest = await prisma.branchMember.update({
      where: {
        branch_id_user_id: {
          branch_id: branchId,
          user_id: userId,
        },
      },
      data: rejoinData,
      include: {
        users_branch_members_user_idTousers: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    return mapBranchMember(rejoinRequest as BranchMemberRecord);
  }

  // Create join request
  const createData = {
    member_id: randomUUID(),
    branch_id: branchId,
    user_id: userId,
    role: 'member',
    status: 'pending',
    join_message: message ?? null,
    joined_at: new Date(),
    updated_at: new Date(),
  };

  const joinRequest = await prisma.branchMember.create({
    data: createData,
    include: {
      users_branch_members_user_idTousers: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
        },
      },
    },
  });

  // TODO: Notify Gurus about join request

  return mapBranchMember(joinRequest as BranchMemberRecord);
}

/**
 * Approve join request (Guru or elevated role)
 */
export async function approveJoinRequest(branchId: string, userId: string, actor: ActingUser) {
  const isElevated = actor.globalRole === 'SUPER_GURU' || actor.globalRole === 'ADMIN';

  if (!isElevated) {
    const approver = await prisma.branchMember.findUnique({
      where: {
        branch_id_user_id: {
          branch_id: branchId,
          user_id: actor.userId,
        },
      },
    });

    if (!approver || approver.role !== 'guru') {
      throw new Error('Only branch Gurus or platform admins can approve join requests');
    }
  }

  const member = await prisma.branchMember.update({
    where: {
      branch_id_user_id: {
        branch_id: branchId,
        user_id: userId,
      },
    },
    data: {
      status: 'active',
      approved_by: actor.userId,
      approved_at: new Date(),
      join_message: null,
    },
    include: {
      users_branch_members_user_idTousers: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
        },
      },
    },
  });

  return mapBranchMember(member as BranchMemberRecord);
}

/**
 * Reject join request (Guru or elevated role)
 */
export async function rejectJoinRequest(branchId: string, userId: string, actor: ActingUser) {
  const isElevated = actor.globalRole === 'SUPER_GURU' || actor.globalRole === 'ADMIN';

  if (!isElevated) {
    const rejector = await prisma.branchMember.findUnique({
      where: {
        branch_id_user_id: {
          branch_id: branchId,
          user_id: actor.userId,
        },
      },
    });

    if (!rejector || rejector.role !== 'guru') {
      throw new Error('Only branch Gurus or platform admins can reject join requests');
    }
  }

  const existingRequest = await prisma.branchMember.findUnique({
    where: {
      branch_id_user_id: {
        branch_id: branchId,
        user_id: userId,
      },
    },
    select: {
      status: true,
    },
  });

  if (!existingRequest) {
    throw new Error('Join request not found');
  }

  if (existingRequest.status !== 'pending') {
    throw new Error('Join request is not pending');
  }

  // Delete the pending request
  await prisma.branchMember.delete({
    where: {
      branch_id_user_id: {
        branch_id: branchId,
        user_id: userId,
      },
    },
  });

  // TODO: Notify user of rejection

  return { message: 'Join request rejected' };
}

/**
 * Get pending join requests for a branch (Guru or elevated role)
 */
export async function getPendingJoinRequests(branchId: string, actor: ActingUser) {
  const isElevated = actor.globalRole === 'SUPER_GURU' || actor.globalRole === 'ADMIN';

  if (!isElevated) {
    const guru = await prisma.branchMember.findUnique({
      where: {
        branch_id_user_id: {
          branch_id: branchId,
          user_id: actor.userId,
        },
      },
    });

    if (!guru || guru.role !== 'guru') {
      throw new Error('Only branch Gurus or platform admins can view join requests');
    }
  }

  // Get pending requests
  const requests = await prisma.branchMember.findMany({
    where: {
      branch_id: branchId,
      status: 'pending',
    },
    include: {
      users_branch_members_user_idTousers: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
          current_location: true,
          created_at: true,
        },
      },
    },
    orderBy: {
      joined_at: 'asc',
    },
  });

  return (requests as BranchMemberRecord[]).map(mapBranchMember);
}

/**
 * Update member role (Guru only)
 */
export async function updateMemberRole(
  branchId: string,
  memberUserId: string,
  newRole: string,
  actor: ActingUser
) {
  const isElevated = actor.globalRole === 'SUPER_GURU' || actor.globalRole === 'ADMIN';

  if (!isElevated) {
    const guru = await prisma.branchMember.findUnique({
      where: {
        branch_id_user_id: {
          branch_id: branchId,
          user_id: actor.userId,
        },
      },
    });

    if (!guru || guru.role !== 'guru') {
      throw new Error('Only branch Gurus or platform admins can update member roles');
    }
  }

  // Validate role
  if (!['member', 'guru'].includes(newRole)) {
    throw new Error('Invalid role. Must be "member" or "guru"');
  }

  // Find the member to update
  const member = await prisma.branchMember.findUnique({
    where: {
      branch_id_user_id: {
        branch_id: branchId,
        user_id: memberUserId,
      },
    },
    include: {
      users_branch_members_user_idTousers: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
        },
      },
    },
  });

  if (!member) {
    throw new Error('Member not found in this branch');
  }

  // Prevent demoting yourself if you're the only guru
  if (!isElevated && member.user_id === actor.userId && newRole === 'member') {
    const guruCount = await prisma.branchMember.count({
      where: {
        branch_id: branchId,
        role: 'guru',
        status: 'active',
      },
    });

    if (guruCount === 1) {
      throw new Error('Cannot demote yourself. You are the only Guru in this branch.');
    }
  }

  // Update role
  const updatedMember = await prisma.branchMember.update({
    where: {
      branch_id_user_id: {
        branch_id: branchId,
        user_id: memberUserId,
      },
    },
    data: {
      role: newRole,
      updated_at: new Date(),
    },
    include: {
      users_branch_members_user_idTousers: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
          current_location: true,
        },
      },
    },
  });

  return mapBranchMember(updatedMember as BranchMemberRecord);
}

interface ConnectedFamilyStats {
  approvedLinks: number;
  pendingLinks: number;
  firstLinkAt: Date | null;
  lastLinkAt: Date | null;
}

interface ConnectedFamilyBridge {
  id: string;
  status: string;
  role: 'source' | 'target';
  displayName?: string | null;
  notes?: string | null;
  approvedAt?: Date | null;
  createdAt: Date;
  isPrimary: boolean;
  primaryAssignedAt?: Date;
  displayGenerationOverride?: number | null;
  person: {
    id: string;
    fullName: string;
    givenName?: string | null;
    surname?: string | null;
    maidenName?: string | null;
    homeBranch?: {
      id: string;
      surname: string;
      cityName?: string | null;
    } | null;
  };
}

export interface ConnectedFamily {
  branch: {
    id: string;
    surname: string;
    cityName?: string | null;
    region?: string | null;
    country?: string | null;
    visibility: string;
    isVerified: boolean;
  };
  stats: ConnectedFamilyStats;
  bridges: ConnectedFamilyBridge[];
}

type BranchPersonLinkRecord = {
  link_id: string;
  branch_id: string;
  source_branch_id: string;
  status: string;
  display_name: string | null;
  notes: string | null;
  person_id: string;
  created_at: Date;
  updated_at: Date;
  source_approved_at: Date | null;
  target_approved_at: Date | null;
  is_primary_bridge: boolean;
  primary_set_at: Date | null;
  display_generation_override: number | null;
  persons: {
    person_id: string;
    full_name: string;
    given_name: string | null;
    surname: string | null;
    maiden_name: string | null;
    family_branches: {
      branch_id: string;
      surname: string;
      city_name: string | null;
    } | null;
  };
};

type BranchMetaRecord = {
  branch_id: string;
  surname: string;
  city_name: string | null;
  region: string | null;
  country: string | null;
  visibility: string;
  is_verified: boolean;
};

/**
 * Connected families (linked branches overview)
 */
export async function getConnectedFamilies(
  branchId: string,
  actor: ActingUser
): Promise<ConnectedFamily[]> {
  const branch = await prisma.familyBranch.findUnique({
    where: { branch_id: branchId },
    select: { branch_id: true },
  });

  if (!branch) {
    throw new Error('Branch not found');
  }

  const isElevated = actor.globalRole === 'SUPER_GURU' || actor.globalRole === 'ADMIN';
  if (!isElevated) {
    const membership = await prisma.branchMember.findUnique({
      where: {
        branch_id_user_id: {
          branch_id: branchId,
          user_id: actor.userId,
        },
      },
      select: { role: true, status: true },
    });

    if (!membership || membership.role !== 'guru' || membership.status !== 'active') {
      throw new Error('Only branch Gurus or platform admins can view connected families');
    }
  }

  const links = (await prisma.branchPersonLink.findMany({
    where: {
      status: {
        in: ['pending', 'approved'],
      },
      OR: [{ branch_id: branchId }, { source_branch_id: branchId }],
    },
    include: {
      persons: {
        select: {
          person_id: true,
          full_name: true,
          given_name: true,
          surname: true,
          maiden_name: true,
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
      updated_at: 'desc',
    },
  })) as BranchPersonLinkRecord[];

  if (links.length === 0) {
    return [];
  }

  const otherBranchIds = Array.from(
    new Set(
      links.map((link) => (link.branch_id === branchId ? link.source_branch_id : link.branch_id))
    )
  );

  const branchMetas = (await prisma.familyBranch.findMany({
    where: {
      branch_id: {
        in: otherBranchIds,
      },
    },
    select: {
      branch_id: true,
      surname: true,
      city_name: true,
      region: true,
      country: true,
      visibility: true,
      is_verified: true,
    },
  })) as BranchMetaRecord[];

  const branchMetaMap = new Map(branchMetas.map((meta) => [meta.branch_id, meta]));

  const grouped = new Map<
    string,
    {
      branch: ConnectedFamily['branch'];
      stats: ConnectedFamilyStats;
      bridgesMap: Map<string, ConnectedFamilyBridge>;
    }
  >();

  for (const link of links) {
    const isTarget = link.branch_id === branchId;
    const otherId = isTarget ? link.source_branch_id : link.branch_id;
    const meta = branchMetaMap.get(otherId);

    if (!meta) {
      continue;
    }

    if (!grouped.has(otherId)) {
      grouped.set(otherId, {
        branch: {
          id: meta.branch_id,
          surname: meta.surname,
          cityName: meta.city_name,
          region: meta.region,
          country: meta.country,
          visibility: meta.visibility,
          isVerified: meta.is_verified,
        },
        stats: {
          approvedLinks: 0,
          pendingLinks: 0,
          firstLinkAt: null,
          lastLinkAt: null,
        },
        bridgesMap: new Map(),
      });
    }

    const entry = grouped.get(otherId)!;

    if (link.status === 'approved') {
      entry.stats.approvedLinks += 1;
    } else {
      entry.stats.pendingLinks += 1;
    }

    const createdAt = link.created_at;
    const updatedAt = link.updated_at;
    if (!entry.stats.firstLinkAt || createdAt < entry.stats.firstLinkAt) {
      entry.stats.firstLinkAt = createdAt;
    }
    if (!entry.stats.lastLinkAt || updatedAt > entry.stats.lastLinkAt) {
      entry.stats.lastLinkAt = updatedAt;
    }

    // Add bridge, but avoid duplicates per person (prioritize approved over pending)
    const newBridge: ConnectedFamilyBridge = {
      id: link.link_id,
      status: link.status,
      role: (isTarget ? 'target' : 'source') as 'source' | 'target',
      displayName: link.display_name,
      notes: link.notes ?? undefined,
      approvedAt: isTarget ? link.target_approved_at : link.source_approved_at,
      createdAt,
      isPrimary: Boolean(link.is_primary_bridge),
      primaryAssignedAt: link.primary_set_at ?? undefined,
      displayGenerationOverride: link.display_generation_override,
      person: {
        id: link.person_id,
        fullName: link.persons.full_name,
        givenName: link.persons.given_name,
        surname: link.persons.surname,
        maidenName: link.persons.maiden_name,
        homeBranch: link.persons.family_branches
          ? {
              id: link.persons.family_branches.branch_id,
              surname: link.persons.family_branches.surname,
              cityName: link.persons.family_branches.city_name,
            }
          : null,
      },
    };

    const existing = entry.bridgesMap.get(link.person_id);
    if (!existing) {
      entry.bridgesMap.set(link.person_id, newBridge);
    } else {
      const existingIsApproved = existing.status === 'approved';
      const incomingIsApproved = link.status === 'approved';

      // Prefer approved link over pending, or keep the earliest approval for deterministic order
      if ((!existingIsApproved && incomingIsApproved) || (existingIsApproved === incomingIsApproved && existing.createdAt > createdAt)) {
        entry.bridgesMap.set(link.person_id, newBridge);
      } else if (incomingIsApproved && newBridge.isPrimary) {
        // Always keep primary flag in sync
        entry.bridgesMap.set(link.person_id, newBridge);
      }
    }
  }

  return Array.from(grouped.values()).map((item) => ({
    branch: item.branch,
    stats: item.stats,
    bridges: Array.from(item.bridgesMap.values()).sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      // Approved before pending
      if (a.status === 'approved' && b.status !== 'approved') return -1;
      if (a.status !== 'approved' && b.status === 'approved') return 1;
      return a.createdAt.getTime() - b.createdAt.getTime();
    }),
  }));
}

/**
 * Get multi-branch family tree data for visualization
 * Returns main branch tree + connected branches with bridge metadata
 */
export async function getMultiBranchTree(branchId: string) {
  // Import services to avoid circular dependency
  const personService = (await import('./person.service')).default;

  // Get main branch data
  const mainBranch = await getBranchById(branchId);
  const mainPersons = await personService.getFamilyTree(branchId);

  // Get partnerships for main branch
  const mainPartnerships = await prisma.partnership.findMany({
    where: { branch_id: branchId },
    select: {
      partnership_id: true,
      branch_id: true,
      person1_id: true,
      person2_id: true,
      partnership_type: true,
      start_date: true,
      end_date: true,
      status: true,
      is_current: true,
    },
  });

  // Recursively find all connected branches (transitive closure)
  const connectedBranchIds = new Set<string>();
  const allBridgeLinks: Array<{
    linkId: string;
    personId: string;
    sourceBranchId: string;
    targetBranchId: string;
    displayName: string | null;
    approvedAt: Date | null;
    isPrimary: boolean;
    primaryAssignedAt: Date | null;
    displayGenerationOverride: number | null;
  }> = [];

  const visitedBranches = new Set<string>();
  const toVisit = [branchId];

  while (toVisit.length > 0) {
    const currentBranchId = toVisit.pop()!;
    if (visitedBranches.has(currentBranchId)) continue;
    visitedBranches.add(currentBranchId);

    // Get all approved links for this branch
    const approvedLinks = await prisma.branchPersonLink.findMany({
      where: {
        OR: [
          { branch_id: currentBranchId, status: 'approved' },
          { source_branch_id: currentBranchId, status: 'approved' },
        ],
      },
      select: {
        link_id: true,
        person_id: true,
        branch_id: true,
        source_branch_id: true,
        status: true,
        display_name: true,
        target_approved_at: true,
        source_approved_at: true,
        is_primary_bridge: true,
        primary_set_at: true,
        display_generation_override: true,
      },
    });

    for (const link of approvedLinks) {
      const isTarget = link.branch_id === currentBranchId;
      const otherBranchId = isTarget ? link.source_branch_id : link.branch_id;

      // Add to connected branches (excluding the main branch)
      if (otherBranchId !== branchId) {
        connectedBranchIds.add(otherBranchId);
      }

      // Add to visit queue if not visited yet
      if (!visitedBranches.has(otherBranchId)) {
        toVisit.push(otherBranchId);
      }

      // Store bridge link (avoid duplicates)
      const linkExists = allBridgeLinks.some(bl => bl.linkId === link.link_id);
      if (!linkExists) {
        allBridgeLinks.push({
          linkId: link.link_id,
          personId: link.person_id,
          sourceBranchId: link.source_branch_id,
          targetBranchId: link.branch_id,
          displayName: link.display_name,
          approvedAt: isTarget ? link.target_approved_at : link.source_approved_at,
          isPrimary: link.is_primary_bridge,
          primaryAssignedAt: link.primary_set_at,
          displayGenerationOverride: link.display_generation_override,
        });
      }
    }
  }

  const bridgeLinks = allBridgeLinks;

  // Fetch data for each connected branch
  const connectedBranches = await Promise.all(
    Array.from(connectedBranchIds).map(async (connectedBranchId) => {
      const branch = await getBranchById(connectedBranchId);
      const persons = await personService.getFamilyTree(connectedBranchId);

      const partnerships = await prisma.partnership.findMany({
        where: { branch_id: connectedBranchId },
        select: {
          partnership_id: true,
          branch_id: true,
          person1_id: true,
          person2_id: true,
          partnership_type: true,
          start_date: true,
          end_date: true,
          status: true,
          is_current: true,
        },
      });

      // Find bridge links for this specific connection
      const bridgesForThisBranch = bridgeLinks.filter(
        (bl) =>
          (bl.sourceBranchId === branchId && bl.targetBranchId === connectedBranchId) ||
          (bl.sourceBranchId === connectedBranchId && bl.targetBranchId === branchId)
      );

      return {
        branch: {
          id: branch.id,
          surname: branch.surname,
          cityName: branch.cityName,
          region: branch.region,
          country: branch.country,
          totalPeople: branch.totalPeople,
          totalGenerations: branch.totalGenerations,
        },
        persons: persons.map((p) => {
          // Calculate generation for bridge persons based on parent's generation in this branch
          let calculatedGeneration = p.generationNumber;
          const bridgeInfo = bridgesForThisBranch.find(bl => bl.personId === p.id);

          if (bridgeInfo && !bridgeInfo.displayGenerationOverride) {
            // This is a bridge person - calculate generation from parent if possible
            if (p.fatherId) {
              const father = persons.find(person => person.id === p.fatherId);
              if (father) {
                calculatedGeneration = (father.generationNumber || 1) + 1;
              }
            } else if (p.motherId) {
              const mother = persons.find(person => person.id === p.motherId);
              if (mother) {
                calculatedGeneration = (mother.generationNumber || 1) + 1;
              }
            }
          } else if (bridgeInfo?.displayGenerationOverride) {
            // Use manual override if set
            calculatedGeneration = bridgeInfo.displayGenerationOverride;
          }

          return {
            id: p.id,
            fullName: p.fullName,
            givenName: p.givenName,
            surname: p.surname,
            maidenName: p.maidenName,
            generation: `G${calculatedGeneration}`,
            generationNumber: calculatedGeneration,
            fatherId: p.fatherId,
            motherId: p.motherId,
            birthDate: p.birthDate,
            deathDate: p.deathDate,
            profilePhotoUrl: p.profilePhotoUrl,
          };
        }),
        partnerships: partnerships.map((p: {
          partnership_id: string;
          branch_id: string;
          person1_id: string;
          person2_id: string;
          partnership_type: string;
          start_date: Date | null;
          end_date: Date | null;
          status: string;
          is_current: boolean;
        }) => ({
          id: p.partnership_id,
          branchId: p.branch_id,
          person1Id: p.person1_id,
          person2Id: p.person2_id,
          partnershipType: p.partnership_type,
          startDate: p.start_date?.toISOString(),
          endDate: p.end_date?.toISOString(),
          status: p.status,
          isCurrent: p.is_current,
        })),
        bridgeLinks: bridgesForThisBranch.map((bl) => ({
          linkId: bl.linkId,
          personId: bl.personId,
          direction: bl.sourceBranchId === branchId ? 'outgoing' : 'incoming',
          displayName: bl.displayName,
          approvedAt: bl.approvedAt?.toISOString(),
          isPrimary: bl.isPrimary,
          primaryAssignedAt: bl.primaryAssignedAt?.toISOString() ?? null,
          displayGenerationOverride: bl.displayGenerationOverride,
        })),
      };
    })
  );

  return {
    mainBranch: {
      branch: {
        id: mainBranch.id,
        surname: mainBranch.surname,
        cityName: mainBranch.cityName,
        region: mainBranch.region,
        country: mainBranch.country,
        totalPeople: mainBranch.totalPeople,
        totalGenerations: mainBranch.totalGenerations,
      },
      persons: mainPersons.map((p) => ({
        id: p.id,
        fullName: p.fullName,
        givenName: p.givenName,
        surname: p.surname,
        maidenName: p.maidenName,
        generation: p.generation,
        generationNumber: p.generationNumber,
        fatherId: p.fatherId,
        motherId: p.motherId,
        birthDate: p.birthDate,
        deathDate: p.deathDate,
        profilePhotoUrl: p.profilePhotoUrl,
      })),
      partnerships: mainPartnerships.map((p: {
        partnership_id: string;
        branch_id: string;
        person1_id: string;
        person2_id: string;
        partnership_type: string;
        start_date: Date | null;
        end_date: Date | null;
        status: string;
        is_current: boolean;
      }) => ({
        id: p.partnership_id,
        branchId: p.branch_id,
        person1Id: p.person1_id,
        person2Id: p.person2_id,
        partnershipType: p.partnership_type,
        startDate: p.start_date?.toISOString(),
        endDate: p.end_date?.toISOString(),
        status: p.status,
        isCurrent: p.is_current,
      })),
      bridgeLinks: bridgeLinks.map((bl) => ({
        linkId: bl.linkId,
        personId: bl.personId,
        toBranchId: bl.sourceBranchId === branchId ? bl.targetBranchId : bl.sourceBranchId,
        displayName: bl.displayName,
        approvedAt: bl.approvedAt?.toISOString(),
        isPrimary: bl.isPrimary,
        primaryAssignedAt: bl.primaryAssignedAt?.toISOString() ?? null,
        displayGenerationOverride: bl.displayGenerationOverride,
      })),
    },
    connectedBranches,
  };
}
