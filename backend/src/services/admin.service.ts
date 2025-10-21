import prisma from '../utils/prisma';
import type { AssignGuruInput, CreateRegionInput, UpdateAssignmentInput } from '../schemas/admin.schema';

type RegionAssignmentRecord = {
  assignment_id: string;
  user_id: string;
  is_primary: boolean;
  created_at: Date;
  users_super_guru_assignments_user_idTousers: {
    user_id: string;
    full_name: string;
    email: string | null;
  } | null;
};

type RegionQueryResult = {
  region_id: string;
  name: string;
  code: string;
  description: string | null;
  country: string | null;
  super_guru_assignments: RegionAssignmentRecord[];
  _count: {
    family_branches: number;
  };
};

type RecentBranchRecord = {
  branch_id: string;
  surname: string;
  city_name: string;
  region: string | null;
  country: string | null;
  visibility: string;
  total_people: number;
  created_at: Date;
};

export interface RegionGuruSummary {
  assignmentId: string;
  id: string;
  fullName: string;
  email: string;
  isPrimary: boolean;
  isSelf: boolean;
}

export interface RegionBranchSummary {
  id: string;
  surname: string;
  cityName: string;
  region: string | null;
  country: string | null;
  visibility: string;
  totalPeople: number;
  createdAt: string;
}

export interface RegionOverview {
  id: string;
  name: string;
  code: string;
  description: string | null;
  country: string | null;
  totalBranches: number;
  activeMemberCount: number;
  gurus: RegionGuruSummary[];
  selfAssignment: {
    isPrimary: boolean;
    assignedAt: string;
  } | null;
  recentBranches: RegionBranchSummary[];
}

/**
 * Fetch regions assigned to a SuperGuru along with high-level stats.
 */
export async function getSuperGuruRegionsOverview(userId: string): Promise<RegionOverview[]> {
  const regions = await prisma.admin_regions.findMany({
    where: {
      super_guru_assignments: {
        some: { user_id: userId },
      },
    },
    include: {
      _count: {
        select: {
          family_branches: true,
        },
      },
      super_guru_assignments: {
        orderBy: {
          created_at: 'asc',
        },
        include: {
          users_super_guru_assignments_user_idTousers: {
            select: {
              user_id: true,
              full_name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  }) as RegionQueryResult[];

  const regionDetails = await Promise.all(
    regions.map(async (region: RegionQueryResult) => {
      const activeMembers = await prisma.branchMember.count({
        where: {
          status: 'active',
          family_branches: {
            admin_region_id: region.region_id,
          },
        },
      });
      const recentBranches = (await prisma.familyBranch.findMany({
        where: {
          admin_region_id: region.region_id,
        },
        orderBy: {
          created_at: 'desc',
        },
        take: 5,
        select: {
          branch_id: true,
          surname: true,
          city_name: true,
          region: true,
          country: true,
          visibility: true,
          total_people: true,
          created_at: true,
        },
      })) as RecentBranchRecord[];

      const gurus: RegionGuruSummary[] = region.super_guru_assignments.map((assignment: RegionAssignmentRecord) => {
        const user = assignment.users_super_guru_assignments_user_idTousers;
        return {
          assignmentId: assignment.assignment_id,
          id: user?.user_id ?? assignment.user_id,
          fullName: user?.full_name ?? 'Unknown Guru',
          email: user?.email ?? '',
          isPrimary: assignment.is_primary,
          isSelf: assignment.user_id === userId,
        };
      });

      const selfAssignment = region.super_guru_assignments.find(
        (assignment: RegionAssignmentRecord) => assignment.user_id === userId
      );

      const formattedRecentBranches: RegionBranchSummary[] = recentBranches.map((branch: RecentBranchRecord) => ({
        id: branch.branch_id,
        surname: branch.surname,
        cityName: branch.city_name,
        region: branch.region,
        country: branch.country,
        visibility: branch.visibility,
        totalPeople: branch.total_people,
        createdAt: branch.created_at.toISOString(),
      }));

      return {
        id: region.region_id,
        name: region.name,
        code: region.code,
        description: region.description,
        country: region.country,
        totalBranches: region._count.family_branches,
        activeMemberCount: activeMembers,
        gurus,
        selfAssignment: selfAssignment
          ? {
              isPrimary: selfAssignment.is_primary,
              assignedAt: selfAssignment.created_at.toISOString(),
            }
          : null,
        recentBranches: formattedRecentBranches,
      } satisfies RegionOverview;
    })
  );

  return regionDetails;
}

export async function createAdminRegion(data: CreateRegionInput): Promise<RegionOverview> {
  const { code, name, country, description } = data;

  const existing = await prisma.admin_regions.findUnique({ where: { code } });
  if (existing) {
    throw new Error('Region code already exists');
  }

  const region = await prisma.admin_regions.create({
    data: {
      code,
      name,
      country: country ?? null,
      description: description ?? null,
    },
  });

  return {
    id: region.region_id,
    name: region.name,
    code: region.code,
    description: region.description,
    country: region.country,
    totalBranches: 0,
    activeMemberCount: 0,
    gurus: [],
    selfAssignment: null,
    recentBranches: [],
  } satisfies RegionOverview;
}

export async function assignSuperGuruToRegion(params: {
  regionId: string;
  data: AssignGuruInput;
  requestedByUserId: string;
}): Promise<void> {
  const { regionId, data, requestedByUserId } = params;
  const { email, isPrimary } = data;

  const region = await prisma.admin_regions.findUnique({ where: { region_id: regionId } });
  if (!region) {
    throw new Error('Region not found');
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('User not found');
  }

  if (user.global_role === 'USER') {
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: { global_role: 'SUPER_GURU' },
    });
  }

  await prisma.super_guru_assignments.upsert({
    where: {
      user_id_region_id: {
        user_id: user.user_id,
        region_id: regionId,
      },
    },
    update: {
      is_primary: isPrimary,
    },
    create: {
      user_id: user.user_id,
      region_id: regionId,
      is_primary: isPrimary,
      created_by: requestedByUserId,
    },
  });

  if (isPrimary) {
    await prisma.super_guru_assignments.updateMany({
      where: {
        region_id: regionId,
        NOT: {
          user_id: user.user_id,
        },
      },
      data: {
        is_primary: false,
      },
    });
  }
}

export async function updateSuperGuruAssignment(params: {
  assignmentId: string;
  regionId: string;
  data: UpdateAssignmentInput;
}): Promise<void> {
  const { assignmentId, regionId, data } = params;
  const assignment = await prisma.super_guru_assignments.findUnique({
    where: { assignment_id: assignmentId },
  });
  if (!assignment || assignment.region_id !== regionId) {
    throw new Error('Assignment not found');
  }

  await prisma.super_guru_assignments.update({
    where: { assignment_id: assignmentId },
    data: {
      is_primary: data.isPrimary,
    },
  });

  if (data.isPrimary) {
    await prisma.super_guru_assignments.updateMany({
      where: {
        region_id: regionId,
        NOT: {
          assignment_id: assignmentId,
        },
      },
      data: {
        is_primary: false,
      },
    });
  }
}

export async function removeSuperGuruAssignment(params: {
  assignmentId: string;
  regionId: string;
}): Promise<void> {
  const { assignmentId, regionId } = params;

  const assignments = await prisma.super_guru_assignments.findMany({
    where: { region_id: regionId },
    select: { assignment_id: true, is_primary: true },
  }) as Array<{ assignment_id: string; is_primary: boolean }>;

  if (!assignments.some((assignment) => assignment.assignment_id === assignmentId)) {
    throw new Error('Assignment not found');
  }

  if (assignments.length <= 1) {
    throw new Error('Cannot remove the last SuperGuru assigned to region');
  }

  const removingPrimary = assignments.find((assignment) => assignment.assignment_id === assignmentId)?.is_primary;

  await prisma.super_guru_assignments.delete({ where: { assignment_id: assignmentId } });

  if (removingPrimary) {
    const remaining = await prisma.super_guru_assignments.findFirst({
      where: { region_id: regionId },
      orderBy: { created_at: 'asc' },
    });

    if (remaining) {
      await prisma.super_guru_assignments.update({
        where: { assignment_id: remaining.assignment_id },
        data: { is_primary: true },
      });
    }
  }
}
