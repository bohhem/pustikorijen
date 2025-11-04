// ============================================================================
// User List & Search Types
// ============================================================================

export interface UserListItem {
  id: string;
  email: string;
  fullName: string;
  globalRole: 'USER' | 'SUPER_GURU';
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

export interface UserFilters {
  search?: string;
  role?: 'USER' | 'SUPER_GURU';
  isActive?: boolean;
  emailVerified?: boolean;
}

export interface UserPagination {
  page: number;
  limit: number;
  sortBy?: 'name' | 'email' | 'role' | 'lastLogin' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface UserListResponse {
  users: UserListItem[];
  total: number;
  page: number;
  totalPages: number;
}

// ============================================================================
// User Detail Types
// ============================================================================

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
  globalRole: 'USER' | 'SUPER_GURU';
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

// ============================================================================
// Platform Statistics Types
// ============================================================================

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
// Action Input Types
// ============================================================================

export interface UpdateUserRoleInput {
  globalRole: 'USER' | 'SUPER_GURU';
  reason?: string;
}

export interface DeactivateUserInput {
  reason: string;
}

export interface SendNotificationInput {
  subject: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl?: string;
}
