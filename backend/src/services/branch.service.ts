import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      cityCode: normalizedCityCode,
      surnameNormalized: normalizedSurname,
    },
    orderBy: {
      id: 'desc',
    },
    take: 1,
  });

  // Extract sequence number from last branch
  let sequence = 1;
  if (existingBranches.length > 0) {
    const lastId = existingBranches[0].id;
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
      id: branchId,
      surname,
      surnameNormalized,
      cityCode: cityCode.toUpperCase(),
      cityName,
      region: region || null,
      country: country || 'Bosnia and Herzegovina',
      description: description || null,
      visibility: visibility || 'public',
      foundedById,
    },
    include: {
      foundedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  // Add founder as first Guru member
  await prisma.branchMember.create({
    data: {
      branchId: branch.id,
      userId: foundedById,
      role: 'guru',
      status: 'active',
      approvedById: foundedById,
      approvedAt: new Date(),
    },
  });

  return branch;
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
  const where: any = {
    visibility: 'public', // Only show public branches for now
  };

  if (surname) {
    where.surnameNormalized = {
      contains: surname.toUpperCase(),
    };
  }

  if (cityCode) {
    where.cityCode = cityCode.toUpperCase();
  }

  if (search) {
    const searchUpper = search.toUpperCase();
    where.OR = [
      { surnameNormalized: { contains: searchUpper } },
      { cityName: { contains: search, mode: 'insensitive' } },
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
        createdAt: 'desc',
      },
      include: {
        foundedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
        _count: {
          select: {
            members: true,
            persons: true,
          },
        },
      },
    }),
    prisma.familyBranch.count({ where }),
  ]);

  return {
    branches,
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
    where: { id: branchId },
    include: {
      foundedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      _count: {
        select: {
          members: true,
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

  return branch;
}

/**
 * Get branch members
 */
export async function getBranchMembers(branchId: string, _userId?: string) {
  // Check if branch exists
  const branch = await prisma.familyBranch.findUnique({
    where: { id: branchId },
  });

  if (!branch) {
    throw new Error('Branch not found');
  }

  // Get members
  const members = await prisma.branchMember.findMany({
    where: {
      branchId,
      status: 'active',
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          currentLocation: true,
        },
      },
      person: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: [
      { role: 'asc' }, // Gurus first
      { joinedAt: 'asc' },
    ],
  });

  return members;
}

/**
 * Request to join a branch
 */
export async function requestJoinBranch(branchId: string, userId: string, _message?: string) {
  // Check if branch exists
  const branch = await prisma.familyBranch.findUnique({
    where: { id: branchId },
  });

  if (!branch) {
    throw new Error('Branch not found');
  }

  // Check if already a member
  const existingMember = await prisma.branchMember.findUnique({
    where: {
      branchId_userId: {
        branchId,
        userId,
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
  }

  // Create join request
  const joinRequest = await prisma.branchMember.create({
    data: {
      branchId,
      userId,
      role: 'member',
      status: 'pending',
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  // TODO: Notify Gurus about join request

  return joinRequest;
}

/**
 * Approve join request (Guru only)
 */
export async function approveJoinRequest(branchId: string, userId: string, approvedById: string) {
  // Verify approver is a Guru
  const approver = await prisma.branchMember.findUnique({
    where: {
      branchId_userId: {
        branchId,
        userId: approvedById,
      },
    },
  });

  if (!approver || approver.role !== 'guru') {
    throw new Error('Only Gurus can approve join requests');
  }

  // Update member status
  const member = await prisma.branchMember.update({
    where: {
      branchId_userId: {
        branchId,
        userId,
      },
    },
    data: {
      status: 'active',
      approvedById,
      approvedAt: new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  // TODO: Notify user of approval

  return member;
}

/**
 * Reject join request (Guru only)
 */
export async function rejectJoinRequest(branchId: string, userId: string, rejectedById: string) {
  // Verify rejector is a Guru
  const rejector = await prisma.branchMember.findUnique({
    where: {
      branchId_userId: {
        branchId,
        userId: rejectedById,
      },
    },
  });

  if (!rejector || rejector.role !== 'guru') {
    throw new Error('Only Gurus can reject join requests');
  }

  // Delete the pending request
  await prisma.branchMember.delete({
    where: {
      branchId_userId: {
        branchId,
        userId,
      },
    },
  });

  // TODO: Notify user of rejection

  return { message: 'Join request rejected' };
}

/**
 * Get pending join requests for a branch (Guru only)
 */
export async function getPendingJoinRequests(branchId: string, guruUserId: string) {
  // Verify user is a Guru
  const guru = await prisma.branchMember.findUnique({
    where: {
      branchId_userId: {
        branchId,
        userId: guruUserId,
      },
    },
  });

  if (!guru || guru.role !== 'guru') {
    throw new Error('Only Gurus can view join requests');
  }

  // Get pending requests
  const requests = await prisma.branchMember.findMany({
    where: {
      branchId,
      status: 'pending',
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          currentLocation: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      joinedAt: 'asc',
    },
  });

  return requests;
}

/**
 * Update member role (Guru only)
 */
export async function updateMemberRole(
  branchId: string,
  memberUserId: string,
  newRole: string,
  guruUserId: string
) {
  // Verify requester is a Guru
  const guru = await prisma.branchMember.findUnique({
    where: {
      branchId_userId: {
        branchId,
        userId: guruUserId,
      },
    },
  });

  if (!guru || guru.role !== 'guru') {
    throw new Error('Only Gurus can update member roles');
  }

  // Validate role
  if (!['member', 'guru'].includes(newRole)) {
    throw new Error('Invalid role. Must be "member" or "guru"');
  }

  // Find the member to update
  const member = await prisma.branchMember.findUnique({
    where: {
      branchId_userId: {
        branchId,
        userId: memberUserId,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  if (!member) {
    throw new Error('Member not found in this branch');
  }

  // Prevent demoting yourself if you're the only guru
  if (member.userId === guruUserId && newRole === 'member') {
    const guruCount = await prisma.branchMember.count({
      where: {
        branchId,
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
      branchId_userId: {
        branchId,
        userId: memberUserId,
      },
    },
    data: {
      role: newRole,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          currentLocation: true,
        },
      },
    },
  });

  return updatedMember;
}
