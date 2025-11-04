import { randomUUID } from 'crypto';
import prisma from '../utils/prisma';
import type { UserGlobalRole } from '@prisma/client';

// ============================================================================
// Type Definitions
// ============================================================================

export interface UserFilters {
  search?: string;
  role?: UserGlobalRole;
  isActive?: boolean;
  emailVerified?: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: 'name' | 'email' | 'role' | 'lastLogin' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface UserListItem {
  id: string;
  email: string;
  fullName: string;
  globalRole: UserGlobalRole;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
  superGuruRegions: Array<{
    id: string;
    name: string;
    code: string;
  }>;
}

export interface BranchMembership {
  branchId: string;
  branchName: string;
  role: string;
  status: string;
  joinedAt: string;
  canEditGenerations: boolean;
}

export interface ActivityLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  actionType: string;
  fieldChanged: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  performedBy: {
    id: string;
    fullName: string;
  } | null;
}

export interface UserStats {
  totalBranches: number;
  totalContributions: number;
  storiesCount: number;
  photosCount: number;
  personsCreated: number;
}

export interface UserDetail {
  id: string;
  email: string;
  fullName: string;
  birthYear: number | null;
  currentLocation: string | null;
  preferredLanguage: string;
  globalRole: UserGlobalRole;
  isActive: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  superGuruRegions: Array<{
    id: string;
    name: string;
    code: string;
    description: string | null;
    isPrimary: boolean;
  }>;
  branches: BranchMembership[];
  stats: UserStats;
}

export interface PlatformUserStats {
  totalUsers: number;
  activeUsers: number;
  superGuruCount: number;
  guruCount: number;
  newUsersLast30Days: number;
  usersByRole: {
    USER: number;
    SUPER_GURU: number;
  };
  userGrowthTrend: Array<{
    date: string;
    count: number;
  }>;
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapUserListItem(user: any): UserListItem {
  return {
    id: user.user_id,
    email: user.email,
    fullName: user.full_name,
    globalRole: user.global_role,
    isActive: user.is_active,
    emailVerified: user.email_verified,
    lastLogin: user.last_login ? user.last_login.toISOString() : null,
    createdAt: user.created_at.toISOString(),
    superGuruRegions: user.super_guru_assignments_super_guru_assignments_user_idTousers?.map((assignment: any) => ({
      id: assignment.admin_regions.region_id,
      name: assignment.admin_regions.name,
      code: assignment.admin_regions.code,
    })) || [],
  };
}

function mapBranchMembership(member: any): BranchMembership {
  return {
    branchId: member.family_branches.branch_id,
    branchName: member.family_branches.surname,
    role: member.role,
    status: member.status,
    joinedAt: member.joined_at.toISOString(),
    canEditGenerations: member.can_edit_generations,
  };
}

function mapActivityLog(log: any): ActivityLogEntry {
  return {
    id: log.log_id,
    entityType: log.entity_type,
    entityId: log.entity_id,
    actionType: log.action_type,
    fieldChanged: log.field_changed,
    oldValue: log.old_value,
    newValue: log.new_value,
    createdAt: log.created_at.toISOString(),
    performedBy: log.audit_log_user_idTousers ? {
      id: log.audit_log_user_idTousers.user_id,
      fullName: log.audit_log_user_idTousers.full_name,
    } : null,
  };
}

// ============================================================================
// User List & Search
// ============================================================================

/**
 * Get all users with filtering, search, and pagination
 */
export async function getAllUsers(
  filters: UserFilters,
  pagination: PaginationParams
): Promise<{ users: UserListItem[]; total: number; page: number; totalPages: number }> {
  const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
  const { search, role, isActive, emailVerified } = filters;

  // Build where clause
  const where: any = {};

  if (search) {
    where.OR = [
      { full_name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role) {
    where.global_role = role;
  }

  if (isActive !== undefined) {
    where.is_active = isActive;
  }

  if (emailVerified !== undefined) {
    where.email_verified = emailVerified;
  }

  // Build orderBy clause
  let orderBy: any;
  switch (sortBy) {
    case 'name':
      orderBy = { full_name: sortOrder };
      break;
    case 'email':
      orderBy = { email: sortOrder };
      break;
    case 'role':
      orderBy = { global_role: sortOrder };
      break;
    case 'lastLogin':
      orderBy = { last_login: sortOrder };
      break;
    case 'createdAt':
    default:
      orderBy = { created_at: sortOrder };
  }

  // Execute queries in parallel
  const [users, total] = await Promise.all([
    prisma.users.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        super_guru_assignments_super_guru_assignments_user_idTousers: {
          include: {
            admin_regions: {
              select: {
                region_id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    }),
    prisma.users.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    users: users.map(mapUserListItem),
    total,
    page,
    totalPages,
  };
}

/**
 * Search users by name or email (simplified for autocomplete)
 */
export async function searchUsers(query: string, limit: number = 20): Promise<UserListItem[]> {
  const users = await prisma.users.findMany({
    where: {
      OR: [
        { full_name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { full_name: 'asc' },
    take: limit,
    include: {
      super_guru_assignments_super_guru_assignments_user_idTousers: {
        include: {
          admin_regions: {
            select: {
              region_id: true,
              name: true,
              code: true,
            },
          },
        },
      },
    },
  });

  return users.map(mapUserListItem);
}

// ============================================================================
// User Detail
// ============================================================================

/**
 * Get detailed user information by ID
 */
export async function getUserById(userId: string): Promise<UserDetail> {
  const user = await prisma.users.findUnique({
    where: { user_id: userId },
    include: {
      super_guru_assignments_super_guru_assignments_user_idTousers: {
        include: {
          admin_regions: {
            select: {
              region_id: true,
              name: true,
              code: true,
              description: true,
            },
          },
        },
      },
      branch_members_branch_members_user_idTousers: {
        where: {
          status: {
            in: ['active', 'pending'],
          },
        },
        include: {
          family_branches: {
            select: {
              branch_id: true,
              surname: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get user statistics
  const [
    branchCount,
    storyCount,
    photoCount,
    personCount,
  ] = await Promise.all([
    prisma.branch_members.count({
      where: {
        user_id: userId,
        status: 'active',
      },
    }),
    prisma.stories.count({
      where: { author_id: userId },
    }),
    prisma.documents.count({
      where: {
        uploaded_by: userId,
        doc_type: 'photo',
      },
    }),
    prisma.persons.count({
      where: { created_by: userId },
    }),
  ]);

  const stats: UserStats = {
    totalBranches: branchCount,
    totalContributions: storyCount + photoCount + personCount,
    storiesCount: storyCount,
    photosCount: photoCount,
    personsCreated: personCount,
  };

  return {
    id: user.user_id,
    email: user.email,
    fullName: user.full_name,
    birthYear: user.birth_year,
    currentLocation: user.current_location,
    preferredLanguage: user.preferred_language,
    globalRole: user.global_role,
    isActive: user.is_active,
    emailVerified: user.email_verified,
    twoFactorEnabled: user.two_factor_enabled,
    lastLogin: user.last_login ? user.last_login.toISOString() : null,
    createdAt: user.created_at.toISOString(),
    updatedAt: user.updated_at.toISOString(),
    superGuruRegions: user.super_guru_assignments_super_guru_assignments_user_idTousers.map(
      (assignment: any) => ({
        id: assignment.admin_regions.region_id,
        name: assignment.admin_regions.name,
        code: assignment.admin_regions.code,
        description: assignment.admin_regions.description,
        isPrimary: assignment.is_primary,
      })
    ),
    branches: user.branch_members_branch_members_user_idTousers.map(mapBranchMembership),
    stats,
  };
}

/**
 * Get user's branch memberships
 */
export async function getUserBranches(userId: string): Promise<BranchMembership[]> {
  const memberships = await prisma.branch_members.findMany({
    where: {
      user_id: userId,
      status: {
        in: ['active', 'pending'],
      },
    },
    include: {
      family_branches: {
        select: {
          branch_id: true,
          surname: true,
        },
      },
    },
    orderBy: {
      joined_at: 'desc',
    },
  });

  return memberships.map(mapBranchMembership);
}

/**
 * Get user's recent activity
 */
export async function getUserActivity(userId: string, limit: number = 50): Promise<ActivityLogEntry[]> {
  const logs = await prisma.audit_log.findMany({
    where: {
      OR: [
        { user_id: userId }, // Actions performed by the user
        {
          entity_type: 'user',
          entity_id: userId, // Actions performed on the user
        },
      ],
    },
    orderBy: {
      created_at: 'desc',
    },
    take: limit,
    include: {
      audit_log_user_idTousers: {
        select: {
          user_id: true,
          full_name: true,
        },
      },
    },
  });

  return logs.map(mapActivityLog);
}

// ============================================================================
// User Role Management
// ============================================================================

/**
 * Update user's global role
 */
export async function updateUserRole(
  userId: string,
  newRole: UserGlobalRole,
  actingUserId: string,
  reason?: string
): Promise<void> {
  // Validation checks
  const user = await prisma.users.findUnique({
    where: { user_id: userId },
    select: {
      user_id: true,
      global_role: true,
      full_name: true,
      email: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Prevent users from changing their own role
  if (userId === actingUserId) {
    throw new Error('You cannot change your own role');
  }

  // SUPER_GURU is the highest role - no promotions beyond it
  if (newRole === 'ADMIN') {
    throw new Error('ADMIN role is not available in this system');
  }

  // Don't update if role is the same
  if (user.global_role === newRole) {
    return;
  }

  const oldRole = user.global_role;

  // Update the role
  await prisma.users.update({
    where: { user_id: userId },
    data: {
      global_role: newRole,
      updated_at: new Date(),
    },
  });

  // Create audit log entry
  await prisma.audit_log.create({
    data: {
      log_id: randomUUID(),
      entity_type: 'user',
      entity_id: userId,
      action_type: 'role_changed',
      field_changed: 'global_role',
      old_value: oldRole,
      new_value: newRole,
      user_id: actingUserId,
      notes: reason || `Role changed from ${oldRole} to ${newRole}`,
      created_at: new Date(),
    },
  });

  // If demoting from SUPER_GURU, remove all region assignments
  if (oldRole === 'SUPER_GURU' && newRole !== 'SUPER_GURU') {
    await prisma.super_guru_assignments.deleteMany({
      where: { user_id: userId },
    });
  }
}

// ============================================================================
// User Activation/Deactivation
// ============================================================================

/**
 * Deactivate user account
 */
export async function deactivateUser(
  userId: string,
  reason: string,
  actingUserId: string
): Promise<void> {
  // Validation
  const user = await prisma.users.findUnique({
    where: { user_id: userId },
    select: {
      user_id: true,
      is_active: true,
      global_role: true,
      full_name: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Prevent users from deactivating themselves
  if (userId === actingUserId) {
    throw new Error('You cannot deactivate your own account');
  }

  // Prevent deactivating last SUPER_GURU
  if (user.global_role === 'SUPER_GURU') {
    const superGuruCount = await prisma.users.count({
      where: {
        global_role: 'SUPER_GURU',
        is_active: true,
      },
    });

    if (superGuruCount <= 1) {
      throw new Error('Cannot deactivate the last active SuperGuru');
    }
  }

  // Already inactive
  if (!user.is_active) {
    return;
  }

  // Deactivate the user
  await prisma.users.update({
    where: { user_id: userId },
    data: {
      is_active: false,
      updated_at: new Date(),
    },
  });

  // Create audit log entry
  await prisma.audit_log.create({
    data: {
      log_id: randomUUID(),
      entity_type: 'user',
      entity_id: userId,
      action_type: 'deactivated',
      field_changed: 'is_active',
      old_value: 'true',
      new_value: 'false',
      user_id: actingUserId,
      notes: reason,
      created_at: new Date(),
    },
  });

  // Send notification to the user
  await prisma.notifications.create({
    data: {
      notification_id: randomUUID(),
      user_id: userId,
      type: 'account_deactivated',
      title: 'Account Deactivated',
      message: `Your account has been deactivated. Reason: ${reason}`,
      priority: 'high',
      created_at: new Date(),
    },
  });
}

/**
 * Reactivate user account
 */
export async function reactivateUser(userId: string, actingUserId: string): Promise<void> {
  const user = await prisma.users.findUnique({
    where: { user_id: userId },
    select: {
      user_id: true,
      is_active: true,
      full_name: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Already active
  if (user.is_active) {
    return;
  }

  // Reactivate the user
  await prisma.users.update({
    where: { user_id: userId },
    data: {
      is_active: true,
      updated_at: new Date(),
    },
  });

  // Create audit log entry
  await prisma.audit_log.create({
    data: {
      log_id: randomUUID(),
      entity_type: 'user',
      entity_id: userId,
      action_type: 'reactivated',
      field_changed: 'is_active',
      old_value: 'false',
      new_value: 'true',
      user_id: actingUserId,
      notes: 'Account reactivated by administrator',
      created_at: new Date(),
    },
  });

  // Send notification to the user
  await prisma.notifications.create({
    data: {
      notification_id: randomUUID(),
      user_id: userId,
      type: 'account_reactivated',
      title: 'Account Reactivated',
      message: 'Your account has been reactivated. You can now log in and access the platform.',
      priority: 'normal',
      created_at: new Date(),
    },
  });
}

// ============================================================================
// Notifications
// ============================================================================

/**
 * Send notification to a user
 */
export async function sendUserNotification(
  userId: string,
  subject: string,
  message: string,
  priority: 'low' | 'normal' | 'high' | 'urgent',
  actionUrl: string | undefined,
  actingUserId: string
): Promise<void> {
  // Verify user exists
  const user = await prisma.users.findUnique({
    where: { user_id: userId },
    select: { user_id: true, full_name: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Create notification
  await prisma.notifications.create({
    data: {
      notification_id: randomUUID(),
      user_id: userId,
      type: 'admin_message',
      title: subject,
      message: message,
      priority: priority,
      action_url: actionUrl || null,
      created_at: new Date(),
    },
  });

  // Log the action
  await prisma.audit_log.create({
    data: {
      log_id: randomUUID(),
      entity_type: 'notification',
      entity_id: userId,
      action_type: 'sent',
      field_changed: 'admin_message',
      new_value: subject,
      user_id: actingUserId,
      notes: `Sent notification to ${user.full_name}: ${subject}`,
      created_at: new Date(),
    },
  });
}

// ============================================================================
// Platform Statistics
// ============================================================================

/**
 * Get platform-wide user statistics
 */
export async function getPlatformUserStats(): Promise<PlatformUserStats> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  // Get counts in parallel
  const [
    totalUsers,
    activeUsers,
    superGuruCount,
    guruCount,
    newUsersLast30Days,
    usersByRole,
    recentUsers,
  ] = await Promise.all([
    prisma.users.count(),
    prisma.users.count({
      where: {
        is_active: true,
      },
    }),
    prisma.users.count({
      where: {
        global_role: 'SUPER_GURU',
      },
    }),
    prisma.users.count({
      where: {
        global_role: 'USER',
      },
    }),
    prisma.users.count({
      where: {
        created_at: {
          gte: thirtyDaysAgo,
        },
      },
    }),
    prisma.users.groupBy({
      by: ['global_role'],
      _count: {
        global_role: true,
      },
    }),
    prisma.users.findMany({
      where: {
        created_at: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        created_at: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    }),
  ]);

  // Build usersByRole map
  const roleMap: Record<string, number> = {
    USER: 0,
    SUPER_GURU: 0,
  };

  usersByRole.forEach((item) => {
    if (item.global_role === 'USER' || item.global_role === 'SUPER_GURU') {
      roleMap[item.global_role] = item._count.global_role;
    }
  });

  // Build growth trend (group by day for last 180 days)
  const growthMap = new Map<string, number>();

  recentUsers.forEach((user) => {
    const dateStr = user.created_at.toISOString().split('T')[0];
    growthMap.set(dateStr, (growthMap.get(dateStr) || 0) + 1);
  });

  // Fill in missing days and create cumulative count
  const userGrowthTrend: Array<{ date: string; count: number }> = [];
  let cumulativeCount = totalUsers - recentUsers.length;

  for (let i = 0; i < 180; i++) {
    const date = new Date(sixMonthsAgo);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const newUsers = growthMap.get(dateStr) || 0;
    cumulativeCount += newUsers;

    // Sample every 7 days to reduce data points
    if (i % 7 === 0) {
      userGrowthTrend.push({
        date: dateStr,
        count: cumulativeCount,
      });
    }
  }

  return {
    totalUsers,
    activeUsers,
    superGuruCount,
    guruCount,
    newUsersLast30Days,
    usersByRole: {
      USER: roleMap.USER,
      SUPER_GURU: roleMap.SUPER_GURU,
    },
    userGrowthTrend,
  };
}
