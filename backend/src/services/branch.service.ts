import { randomUUID } from 'crypto';
import type { JwtPayload } from '../utils/jwt';
import prisma from '../utils/prisma';
type ActingUser = Pick<JwtPayload, 'userId' | 'globalRole'>;

type BranchRecord = {
  branch_id: string;
  surname: string;
  surname_normalized: string;
  city_code: string;
  city_name: string;
  region: string | null;
  country: string;
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
  } | null;
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
  cityCode: string;
  cityName: string;
  region?: string;
  country?: string;
  description?: string;
  visibility?: 'public' | 'family_only' | 'private';
  foundedById: string;
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
  const { surname, cityCode, cityName, region, country, description, visibility, foundedById } = data;

  // Generate unique branch ID
  const branchId = await generateBranchId(cityCode, surname);

  // Normalize surname for searching
  const surnameNormalized = surname
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Create branch
  const branch = await prisma.familyBranch.create({
    data: {
      branch_id: branchId,
      surname,
      surname_normalized: surnameNormalized,
      city_code: cityCode.toUpperCase(),
      city_name: cityName,
      region: region || null,
      country: country || 'Bosnia and Herzegovina',
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
        },
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
        created_at: 'desc',
      },
      include: {
        users: {
          select: {
            user_id: true,
            full_name: true,
          },
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
        },
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
