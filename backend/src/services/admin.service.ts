import { randomUUID } from 'crypto';
import type { Prisma, backup_snapshots } from '@prisma/client';
import prisma from '../utils/prisma';
import type { JwtPayload } from '../utils/jwt';
import type {
  AssignGuruInput,
  CreateBackupInput,
  CreateRegionInput,
  UpdateAssignmentInput,
} from '../schemas/admin.schema';

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
  parent?: AdminRegionRecord | null;
  _count: {
    family_branches: number;
  };
};

type AdminRegionRecord = {
  region_id: string;
  name: string;
  code: string;
  level: number;
  kind: string | null;
  parent_region_id: string | null;
  parent?: AdminRegionRecord | null;
};

type AdminRegionFlatRecord = {
  region_id: string;
  name: string;
  code: string;
  level: number;
  kind: string | null;
  country: string | null;
  parent_region_id: string | null;
};

type RecentBranchRecord = {
  branch_id: string;
  surname: string;
  city_name: string;
  country: string | null;
  visibility: string;
  total_people: number;
  created_at: Date;
  admin_regions: AdminRegionRecord | null;
};

const DEFAULT_BACKUP_HISTORY_LIMIT = 20;
const parsedRetention = Number(process.env.BACKUP_DEFAULT_RETENTION_DAYS ?? '30');
const DEFAULT_BACKUP_RETENTION_DAYS =
  Number.isFinite(parsedRetention) && parsedRetention > 0 ? Math.floor(parsedRetention) : 30;
const BACKUP_SOURCE_ENV = process.env.BACKUP_SOURCE_ENV ?? process.env.NODE_ENV ?? 'development';

const ADMIN_REGION_SELECT = {
  region_id: true,
  name: true,
  code: true,
  level: true,
  kind: true,
  parent_region_id: true,
  parent: {
    select: {
      region_id: true,
      name: true,
      code: true,
      level: true,
      kind: true,
      parent_region_id: true,
      parent: {
        select: {
          region_id: true,
          name: true,
          code: true,
          level: true,
          kind: true,
          parent_region_id: true,
        },
      },
    },
  },
} as const;

function buildRegionPath(region?: AdminRegionRecord | null) {
  if (!region) {
    return [];
  }
  const path: Array<{ id: string; name: string; code: string; level: number }> = [];
  let current: AdminRegionRecord | null | undefined = region;
  while (current) {
    path.unshift({
      id: current.region_id,
      name: current.name,
      code: current.code,
      level: current.level,
    });
    current = current.parent ?? null;
  }
  return path;
}

function ensureBranchScope(actor: JwtPayload, branchRegionId: string | null) {
  if (actor.globalRole === 'REGIONAL_GURU') {
    if (!branchRegionId || !actor.regionIds.includes(branchRegionId)) {
      throw new Error('Branch access denied');
    }
  }
}

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
  adminRegion?: {
    id: string;
    name: string;
    code: string;
    level?: number;
    kind?: string;
  } | null;
  adminRegionPath?: Array<{
    id: string;
    name: string;
    code: string;
    level: number;
  }>;
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
  hierarchyPath: Array<{
    id: string;
    name: string;
    code: string;
    level: number;
  }>;
}

export interface AdminRegionTreeNode {
  id: string;
  name: string;
  code: string;
  level: number;
  kind?: string | null;
  country?: string | null;
  children: AdminRegionTreeNode[];
}

export interface AdminBranchListOptions {
  page?: number;
  limit?: number;
  status?: 'active' | 'archived' | 'all';
  search?: string;
  regionId?: string | null;
}

export interface AdminBranchListItem {
  id: string;
  surname: string;
  surnameNormalized: string;
  cityCode: string;
  cityName: string;
  country: string;
  visibility: string;
  totalPeople: number;
  totalGenerations: number;
  memberCount: number;
  personCount: number;
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;
  archivedAt: string | null;
  archivedReason: string | null;
  archivedBy?: {
    id: string;
    fullName?: string | null;
  } | null;
  adminRegion?: {
    id: string;
    name: string;
    code: string;
    level?: number;
    kind?: string;
  } | null;
  adminRegionPath?: Array<{
    id: string;
    name: string;
    code: string;
    level: number;
  }>;
  founder?: {
    id: string;
    fullName: string;
  } | null;
}

export interface AdminBranchListResponse {
  branches: AdminBranchListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  totals: {
    active: number;
    archived: number;
  };
}

export interface BackupSummaryStats {
  lastSuccessfulAt: string | null;
  nextScheduledAt: string | null;
  totalSnapshots: number;
  outstandingRestores: number;
  storageUsageBytes: number;
}

export interface BackupSnapshotSummary {
  id: string;
  label: string;
  scope: 'FULL' | 'REGION';
  regionId?: string | null;
  regionName?: string | null;
  includeMedia: boolean;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  initiatedBy: {
    id: string;
    fullName: string;
    email?: string | null;
  };
  startedAt: string;
  completedAt?: string | null;
  sizeBytes?: number | null;
  storagePath?: string | null;
  downloadUrl?: string | null;
  manifestUrl?: string | null;
  notes?: string | null;
}

export async function getAdminRegionHierarchy(): Promise<AdminRegionTreeNode[]> {
  const regions = (await prisma.admin_regions.findMany({
    orderBy: [
      { level: 'asc' },
      { name: 'asc' },
    ],
    select: {
      region_id: true,
      name: true,
      code: true,
      level: true,
      kind: true,
      country: true,
      parent_region_id: true,
    },
  })) as AdminRegionFlatRecord[];

  type NodeWithParent = AdminRegionTreeNode & { parentId: string | null };

  const nodes = new Map<string, NodeWithParent>();
  regions.forEach((region) => {
    nodes.set(region.region_id, {
      id: region.region_id,
      name: region.name,
      code: region.code,
      level: region.level,
      kind: region.kind,
      country: region.country,
      parentId: region.parent_region_id ?? null,
      children: [],
    });
  });

  const roots: AdminRegionTreeNode[] = [];

  nodes.forEach((node) => {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortRecursive = (children: AdminRegionTreeNode[]) => {
    children.sort((a, b) => a.name.localeCompare(b.name));
    children.forEach((child) => sortRecursive(child.children));
  };

  sortRecursive(roots);
  // strip helper property
  nodes.forEach((node) => {
    (node as NodeWithParent).parentId = null;
  });

  return roots;
}

export async function updateBranchRegionAssignment(params: {
  branchId: string;
  regionId: string | null | undefined;
  actor: JwtPayload;
}): Promise<AdminBranchListItem> {
  const { branchId, regionId, actor } = params;

  const branch = await prisma.familyBranch.findUnique({
    where: { branch_id: branchId },
    select: {
      branch_id: true,
      admin_region_id: true,
      archived_at: true,
    },
  });

  if (!branch || branch.archived_at) {
    throw new Error('Branch not found');
  }

  // Regional gurus can only touch branches already in their scope
  if (actor.globalRole === 'REGIONAL_GURU') {
    if (!branch.admin_region_id || !actor.regionIds.includes(branch.admin_region_id)) {
      throw new Error('Branch access denied');
    }
  }

  const targetRegionId: string | null = regionId ?? null;

  if (targetRegionId) {
    const region = await prisma.admin_regions.findUnique({
      where: { region_id: targetRegionId },
      select: { region_id: true },
    });
    if (!region) {
      throw new Error('Region not found');
    }
  }

  if (actor.globalRole === 'REGIONAL_GURU') {
    if (!targetRegionId || !actor.regionIds.includes(targetRegionId)) {
      throw new Error('Region access denied');
    }
  }

  await prisma.familyBranch.update({
    where: { branch_id: branchId },
    data: {
      admin_region_id: targetRegionId ?? null,
      updated_at: new Date(),
    },
  });

  const refreshed = await fetchAdminBranch(branchId);
  return mapAdminBranch(refreshed);
}

/**
 * Fetch regions assigned to a SuperGuru along with high-level stats.
 */
export async function getSuperGuruRegionsOverview(params: {
  userId: string;
  scope: 'ALL' | 'ASSIGNED';
  regionIds?: string[];
}): Promise<RegionOverview[]> {
  const { userId, scope, regionIds: assignedRegionIds } = params;

  if (scope === 'ASSIGNED' && (!assignedRegionIds || assignedRegionIds.length === 0)) {
    return [];
  }

  const regions = await prisma.admin_regions.findMany({
    where:
      scope === 'ASSIGNED'
        ? {
            region_id: {
              in: assignedRegionIds!,
            },
          }
        : undefined,
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
    parent: {
      select: ADMIN_REGION_SELECT,
    },
  },
  orderBy: {
    name: 'asc',
  },
}) as RegionQueryResult[];

  const queriedRegionIds = regions.map((region) => region.region_id);

  const branchCountResults = queriedRegionIds.length
    ? await prisma.familyBranch.groupBy({
        by: ['admin_region_id'],
        where: {
          archived_at: null,
          admin_region_id: { in: queriedRegionIds },
        },
        _count: {
          branch_id: true,
        },
      })
    : [];

  const branchCountMap = new Map<string, number>();
  (branchCountResults as Array<{ admin_region_id: string | null; _count: { branch_id: number } }>).forEach((row) => {
    if (row.admin_region_id) {
      branchCountMap.set(row.admin_region_id, row._count.branch_id);
    }
  });

  const regionDetails = await Promise.all(
    regions.map(async (region: RegionQueryResult) => {
      const activeMembers = await prisma.branchMember.count({
        where: {
          status: 'active',
          family_branches: {
            admin_region_id: region.region_id,
            archived_at: null,
          },
        },
      });
      const recentBranches = (await prisma.familyBranch.findMany({
        where: {
          admin_region_id: region.region_id,
          archived_at: null,
        },
        orderBy: {
          created_at: 'desc',
        },
        take: 5,
        select: {
          branch_id: true,
          surname: true,
          city_name: true,
          country: true,
          visibility: true,
          total_people: true,
          created_at: true,
          admin_regions: {
            select: ADMIN_REGION_SELECT,
          },
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
        adminRegion: branch.admin_regions
          ? {
              id: branch.admin_regions.region_id,
              name: branch.admin_regions.name,
              code: branch.admin_regions.code,
              level: branch.admin_regions.level,
              kind: branch.admin_regions.kind ?? undefined,
            }
          : null,
        adminRegionPath: buildRegionPath(branch.admin_regions),
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
        totalBranches: branchCountMap.get(region.region_id) ?? 0,
        activeMemberCount: activeMembers,
        gurus,
        selfAssignment: selfAssignment
          ? {
              isPrimary: selfAssignment.is_primary,
              assignedAt: selfAssignment.created_at.toISOString(),
            }
          : null,
        recentBranches: formattedRecentBranches,
        hierarchyPath: buildRegionPath(region as unknown as AdminRegionRecord),
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

  const hydrated = await prisma.admin_regions.findUnique({
    where: { region_id: region.region_id },
    include: {
      parent: {
        select: ADMIN_REGION_SELECT,
      },
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
    hierarchyPath: buildRegionPath(hydrated as unknown as AdminRegionRecord),
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
      data: { global_role: 'REGIONAL_GURU' },
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
      assignment_id: randomUUID(),
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

  const assignment = await prisma.super_guru_assignments.findUnique({
    where: { assignment_id: assignmentId },
    select: { assignment_id: true, is_primary: true, region_id: true, user_id: true },
  });

  if (!assignment || assignment.region_id !== regionId) {
    throw new Error('Assignment not found');
  }

  const regionAssignmentCount = await prisma.super_guru_assignments.count({
    where: { region_id: regionId },
  });

  if (regionAssignmentCount <= 1) {
    throw new Error('Cannot remove the last SuperGuru assigned to region');
  }

  await prisma.super_guru_assignments.delete({ where: { assignment_id: assignmentId } });

  if (assignment.is_primary) {
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

  const remainingForUser = await prisma.super_guru_assignments.count({
    where: { user_id: assignment.user_id },
  });

  if (remainingForUser === 0) {
    const user = await prisma.user.findUnique({
      where: { user_id: assignment.user_id },
      select: { global_role: true },
    });

    if (user?.global_role === 'REGIONAL_GURU') {
      await prisma.user.update({
        where: { user_id: assignment.user_id },
        data: { global_role: 'USER' },
      });
    }
  }
}

type AdminBranchRecord = {
  branch_id: string;
  surname: string;
  surname_normalized: string;
  city_code: string;
  city_name: string;
  country: string;
  visibility: string;
  total_people: number;
  total_generations: number;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
  archived_at: Date | null;
  archived_by: string | null;
  archived_reason: string | null;
  admin_regions: AdminRegionRecord | null;
  archived_by_user: {
    user_id: string;
    full_name: string | null;
  } | null;
  users: {
    user_id: string;
    full_name: string;
  } | null;
  _count: {
    branch_members: number;
    persons: number;
  };
};

const ADMIN_BRANCH_INCLUDE = {
  admin_regions: {
    select: ADMIN_REGION_SELECT,
  },
  archived_by_user: {
    select: {
      user_id: true,
      full_name: true,
    },
  },
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
} satisfies Prisma.family_branchesInclude;

function mapAdminBranch(record: AdminBranchRecord): AdminBranchListItem {
  return {
    id: record.branch_id,
    surname: record.surname,
    surnameNormalized: record.surname_normalized,
    cityCode: record.city_code,
    cityName: record.city_name,
    country: record.country,
    visibility: record.visibility,
    totalPeople: record.total_people,
    totalGenerations: record.total_generations,
    memberCount: record._count?.branch_members ?? 0,
    personCount: record._count?.persons ?? 0,
    createdAt: record.created_at.toISOString(),
    updatedAt: record.updated_at.toISOString(),
    isVerified: record.is_verified,
    archivedAt: record.archived_at ? record.archived_at.toISOString() : null,
    archivedReason: record.archived_reason,
    archivedBy: record.archived_by
      ? {
          id: record.archived_by,
          fullName: record.archived_by_user?.full_name ?? null,
        }
      : null,
    adminRegion: record.admin_regions
      ? {
          id: record.admin_regions.region_id,
          name: record.admin_regions.name,
          code: record.admin_regions.code,
          level: record.admin_regions.level,
          kind: record.admin_regions.kind ?? undefined,
        }
      : null,
    adminRegionPath: buildRegionPath(record.admin_regions),
    founder: record.users
      ? {
          id: record.users.user_id,
          fullName: record.users.full_name,
        }
      : null,
  };
}

async function fetchAdminBranch(branchId: string): Promise<AdminBranchRecord> {
  const branch = await prisma.familyBranch.findUnique({
    where: { branch_id: branchId },
    include: ADMIN_BRANCH_INCLUDE,
  });

  if (!branch) {
    throw new Error('Branch not found');
  }

  return branch as AdminBranchRecord;
}

export async function listBranchesForAdmin(
  options: AdminBranchListOptions,
  actor: JwtPayload
): Promise<AdminBranchListResponse> {
  const page = Math.max(options.page ?? 1, 1);
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const status = options.status ?? 'active';

  const baseWhere: Prisma.family_branchesWhereInput = {};
  const isRegionalGuru = actor.globalRole === 'REGIONAL_GURU';
  const actorRegionIds = isRegionalGuru ? actor.regionIds : null;

  if (isRegionalGuru && (!actorRegionIds || actorRegionIds.length === 0)) {
    throw new Error('Region access denied');
  }

  if (options.regionId !== undefined) {
    const regionFilter = options.regionId;
    if (!regionFilter || regionFilter === 'all') {
      // no-op
    } else if (regionFilter === 'unassigned') {
      if (isRegionalGuru) {
        throw new Error('Region access denied');
      }
      baseWhere.admin_region_id = null;
    } else {
      if (isRegionalGuru && actorRegionIds && !actorRegionIds.includes(regionFilter)) {
        throw new Error('Region access denied');
      }
      baseWhere.admin_region_id = regionFilter ?? undefined;
    }
  }

  if (isRegionalGuru && baseWhere.admin_region_id === undefined) {
    baseWhere.admin_region_id = {
      in: actorRegionIds!,
    };
  }

  if (options.search) {
    const search = options.search.trim();
    if (search.length > 0) {
      const searchUpper = search.toUpperCase();
      baseWhere.OR = [
        { surname_normalized: { contains: searchUpper } },
        { city_name: { contains: search, mode: 'insensitive' } },
        { branch_id: { contains: search, mode: 'insensitive' } },
      ];
    }
  }

  let queryWhere: Prisma.family_branchesWhereInput = { ...baseWhere };

  if (status === 'active') {
    queryWhere = {
      ...baseWhere,
      archived_at: null,
    };
  } else if (status === 'archived') {
    queryWhere = {
      ...baseWhere,
      archived_at: {
        not: null,
      },
    };
  }

  const skip = (page - 1) * limit;

  const orderBy: Prisma.family_branchesOrderByWithRelationInput =
    status === 'archived'
      ? { archived_at: 'desc' }
      : { updated_at: 'desc' };

  const [branches, total, activeCount, archivedCount] = await Promise.all([
    prisma.familyBranch.findMany({
      where: queryWhere,
      skip,
      take: limit,
      orderBy: [
        orderBy,
        { surname_normalized: 'asc' },
      ],
      include: ADMIN_BRANCH_INCLUDE,
    }),
    prisma.familyBranch.count({ where: queryWhere }),
    prisma.familyBranch.count({
      where: {
        ...baseWhere,
        archived_at: null,
      },
    }),
    prisma.familyBranch.count({
      where: {
        ...baseWhere,
        archived_at: {
          not: null,
        },
      },
    }),
  ]);

  return {
    branches: (branches as AdminBranchRecord[]).map(mapAdminBranch),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    totals: {
      active: activeCount,
      archived: archivedCount,
    },
  };
}

export async function archiveBranchForAdmin(
  branchId: string,
  params: { reason?: string | null; actor: JwtPayload }
): Promise<AdminBranchListItem> {
  const { reason, actor } = params;

  const branch = await prisma.familyBranch.findUnique({
    where: { branch_id: branchId },
    select: {
      branch_id: true,
      archived_at: true,
      admin_region_id: true,
    },
  });

  if (!branch) {
    throw new Error('Branch not found');
  }

  if (branch.archived_at) {
    throw new Error('Branch already archived');
  }

  ensureBranchScope(actor, branch.admin_region_id);

  await prisma.familyBranch.update({
    where: { branch_id: branchId },
    data: {
      archived_at: new Date(),
      archived_by: actor.userId,
      archived_reason: reason ?? null,
      updated_at: new Date(),
    },
  });

  const refreshed = await fetchAdminBranch(branchId);
  return mapAdminBranch(refreshed);
}

export async function unarchiveBranchForAdmin(branchId: string, actor: JwtPayload): Promise<AdminBranchListItem> {
  const branch = await prisma.familyBranch.findUnique({
    where: { branch_id: branchId },
    select: {
      branch_id: true,
      archived_at: true,
      admin_region_id: true,
    },
  });

  if (!branch) {
    throw new Error('Branch not found');
  }

  if (!branch.archived_at) {
    throw new Error('Branch is not archived');
  }

  ensureBranchScope(actor, branch.admin_region_id);

  await prisma.familyBranch.update({
    where: { branch_id: branchId },
    data: {
      archived_at: null,
      archived_by: null,
      archived_reason: null,
      updated_at: new Date(),
    },
  });

  const refreshed = await fetchAdminBranch(branchId);
  return mapAdminBranch(refreshed);
}

type BackupSnapshotWithRelations = backup_snapshots & {
  region: {
    region_id: string;
    name: string;
  } | null;
  initiated_by_user: {
    user_id: string;
    full_name: string;
    email: string | null;
  };
};

const BACKUP_SNAPSHOT_INCLUDE = {
  region: {
    select: {
      region_id: true,
      name: true,
    },
  },
  initiated_by_user: {
    select: {
      user_id: true,
      full_name: true,
      email: true,
    },
  },
} as const;

function mapBackupSnapshot(record: BackupSnapshotWithRelations): BackupSnapshotSummary {
  const canDownload = record.status === 'COMPLETED';
  const manifestPath = `/api/v1/admin/backups/${record.backup_id}/manifest`;

  return {
    id: record.backup_id,
    label: record.label,
    scope: record.scope,
    regionId: record.region_id ?? null,
    regionName: record.region?.name ?? null,
    includeMedia: record.include_media,
    status: record.status,
    initiatedBy: {
      id: record.initiated_by_user.user_id,
      fullName: record.initiated_by_user.full_name,
      email: record.initiated_by_user.email,
    },
    startedAt: record.started_at.toISOString(),
    completedAt: record.completed_at ? record.completed_at.toISOString() : null,
    sizeBytes: record.size_bytes != null ? Number(record.size_bytes) : null,
    storagePath: record.storage_path ?? null,
    downloadUrl: canDownload ? manifestPath : null,
    manifestUrl: canDownload ? manifestPath : null,
    notes: record.notes ?? null,
  };
}

function buildBackupManifest(record: BackupSnapshotWithRelations): Record<string, unknown> {
  const metadata = (record.metadata as Record<string, unknown> | null) ?? null;
  const manifestCandidate = metadata?.manifest;
  if (manifestCandidate && typeof manifestCandidate === 'object') {
    return manifestCandidate as Record<string, unknown>;
  }

  return {
    version: '1.0',
    backupId: record.backup_id,
    label: record.label,
    scope: record.scope,
    includeMedia: record.include_media,
    startedAt: record.started_at.toISOString(),
    completedAt: record.completed_at ? record.completed_at.toISOString() : null,
    region: record.region
      ? {
          id: record.region.region_id,
          name: record.region.name,
        }
      : null,
    sizeBytes: record.size_bytes != null ? Number(record.size_bytes) : null,
    notes: record.notes ?? null,
  };
}

export async function getBackupSummaryStats(): Promise<BackupSummaryStats> {
  const [lastSuccess, totalSnapshots, storageSum] = await prisma.$transaction([
    prisma.backup_snapshots.findFirst({
      where: { status: 'COMPLETED' },
      orderBy: { completed_at: 'desc' },
    }),
    prisma.backup_snapshots.count(),
    prisma.backup_snapshots.aggregate({
      _sum: { size_bytes: true },
      where: { status: 'COMPLETED' },
    }),
  ]);

  const sizeSum = storageSum._sum.size_bytes ?? BigInt(0);

  return {
    lastSuccessfulAt: lastSuccess?.completed_at ? lastSuccess.completed_at.toISOString() : null,
    nextScheduledAt: null,
    totalSnapshots,
    outstandingRestores: 0,
    storageUsageBytes: Number(sizeSum),
  };
}

export async function listBackupSnapshots(limit = DEFAULT_BACKUP_HISTORY_LIMIT): Promise<BackupSnapshotSummary[]> {
  const snapshots = await prisma.backup_snapshots.findMany({
    take: limit,
    orderBy: { started_at: 'desc' },
    include: BACKUP_SNAPSHOT_INCLUDE,
  });

  return snapshots.map((snapshot) => mapBackupSnapshot(snapshot as BackupSnapshotWithRelations));
}

export async function createBackupSnapshotRequest(params: {
  input: CreateBackupInput;
  actor: JwtPayload;
}): Promise<BackupSnapshotSummary> {
  const {
    input: { label, scope, regionId, includeMedia, retentionDays, notifyEmails, notes },
    actor,
  } = params;

  if (scope === 'REGION') {
    const targetRegionId = regionId ?? null;
    if (!targetRegionId) {
      throw new Error('Region is required for region-scoped backups');
    }

    const regionExists = await prisma.admin_regions.findUnique({
      where: { region_id: targetRegionId },
      select: { region_id: true },
    });

    if (!regionExists) {
      throw new Error('Region not found');
    }
  }

  const snapshot = await prisma.backup_snapshots.create({
    data: {
      backup_id: `bkp_${randomUUID()}`,
      label,
      scope,
      region_id: scope === 'REGION' ? regionId ?? null : null,
      include_media: includeMedia ?? true,
      retention_days: retentionDays ?? DEFAULT_BACKUP_RETENTION_DAYS,
      notify_emails: notifyEmails ?? [],
      notes: notes ?? null,
      initiated_by: actor.userId,
      source_env: BACKUP_SOURCE_ENV,
      metadata: {
        requestedBy: actor.userId,
        notifyCount: notifyEmails?.length ?? 0,
      },
    },
    include: BACKUP_SNAPSHOT_INCLUDE,
  });

  return mapBackupSnapshot(snapshot as BackupSnapshotWithRelations);
}

export async function getBackupManifestPayload(backupId: string): Promise<{
  snapshot: BackupSnapshotSummary;
  manifest: Record<string, unknown>;
}> {
  const record = await prisma.backup_snapshots.findUnique({
    where: { backup_id: backupId },
    include: BACKUP_SNAPSHOT_INCLUDE,
  });

  if (!record) {
    throw new Error('Backup not found');
  }

  const mapped = mapBackupSnapshot(record as BackupSnapshotWithRelations);
  const manifest = buildBackupManifest(record as BackupSnapshotWithRelations);
  return { snapshot: mapped, manifest };
}

export async function hardDeleteBranch(branchId: string, actor: JwtPayload): Promise<void> {
  const branch = await prisma.familyBranch.findUnique({
    where: { branch_id: branchId },
    select: {
      branch_id: true,
      archived_at: true,
      admin_region_id: true,
    },
  });

  if (!branch) {
    throw new Error('Branch not found');
  }

  if (!branch.archived_at) {
    throw new Error('Branch must be archived before hard deletion');
  }

  ensureBranchScope(actor, branch.admin_region_id);

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await cascadeDeleteBranch(tx, branchId);
  });
}

async function cascadeDeleteBranch(tx: Prisma.TransactionClient, branchId: string): Promise<void> {
  await tx.branch_placeholder_claims.deleteMany({ where: { branch_id: branchId } });
  await tx.branch_placeholders.deleteMany({ where: { branch_id: branchId } });
  await tx.person_claims.deleteMany({ where: { branch_id: branchId } });
  await tx.branch_members.deleteMany({ where: { branch_id: branchId } });
  await tx.root_change_proposals.deleteMany({ where: { branch_id: branchId } });
  await tx.documents.deleteMany({ where: { branch_id: branchId } });
  await tx.stories.deleteMany({ where: { branch_id: branchId } });
  await tx.audit_log.updateMany({
    where: { branch_id: branchId },
    data: { branch_id: null },
  });
  await tx.disputes.updateMany({
    where: { affected_branch: branchId },
    data: { affected_branch: null },
  });

  const personRecords = await tx.persons.findMany({
    where: { branch_id: branchId },
    select: { person_id: true },
  });
  const personIds = personRecords.map((person) => person.person_id);

  if (personIds.length > 0) {
    await tx.person_business_addresses.deleteMany({
      where: { person_id: { in: personIds } },
    });
    await tx.relationships.deleteMany({
      where: {
        OR: [
          { person1_id: { in: personIds } },
          { person2_id: { in: personIds } },
        ],
      },
    });
  }

  const linkOr: Prisma.branch_person_linksWhereInput[] = [
    { branch_id: branchId },
    { source_branch_id: branchId },
  ];
  if (personIds.length > 0) {
    linkOr.push({ person_id: { in: personIds } });
  }

  await tx.branch_person_links.deleteMany({
    where: { OR: linkOr },
  });

  const partnershipOr: Prisma.partnershipsWhereInput[] = [{ branch_id: branchId }];
  if (personIds.length > 0) {
    partnershipOr.push({ person1_id: { in: personIds } }, { person2_id: { in: personIds } });
  }

  await tx.partnerships.deleteMany({
    where: { OR: partnershipOr },
  });

  await tx.persons.deleteMany({ where: { branch_id: branchId } });
  await tx.family_branches.delete({ where: { branch_id: branchId } });
}
