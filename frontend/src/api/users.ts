import api from '../lib/axios';
import type {
  UserListResponse,
  UserFilters,
  UserPagination,
  UserListItem,
  UserDetail,
  BranchMembership,
  ActivityLogEntry,
  PlatformUserStats,
  UpdateUserRoleInput,
  DeactivateUserInput,
  SendNotificationInput,
} from '../types/user';

// ============================================================================
// User List & Search
// ============================================================================

export async function getAllUsers(
  filters: UserFilters,
  pagination: UserPagination
): Promise<UserListResponse> {
  const params: Record<string, any> = {
    page: pagination.page,
    limit: pagination.limit,
  };

  if (pagination.sortBy) params.sortBy = pagination.sortBy;
  if (pagination.sortOrder) params.sortOrder = pagination.sortOrder;
  if (filters.search) params.search = filters.search;
  if (filters.role) params.role = filters.role;
  if (filters.isActive !== undefined) params.isActive = filters.isActive;
  if (filters.emailVerified !== undefined) params.emailVerified = filters.emailVerified;

  const response = await api.get<UserListResponse>('/admin/users', { params });
  return response.data;
}

export async function searchUsers(query: string, limit: number = 20): Promise<UserListItem[]> {
  const response = await api.get<{ users: UserListItem[] }>('/admin/users/search', {
    params: { q: query, limit },
  });
  return response.data.users;
}

// ============================================================================
// User Statistics
// ============================================================================

export async function getPlatformUserStats(): Promise<PlatformUserStats> {
  const response = await api.get<{ stats: PlatformUserStats }>('/admin/users/stats');
  return response.data.stats;
}

// ============================================================================
// User Detail
// ============================================================================

export async function getUserById(userId: string): Promise<UserDetail> {
  const response = await api.get<{ user: UserDetail }>(`/admin/users/${userId}`);
  return response.data.user;
}

export async function getUserBranches(userId: string): Promise<BranchMembership[]> {
  const response = await api.get<{ branches: BranchMembership[] }>(`/admin/users/${userId}/branches`);
  return response.data.branches;
}

export async function getUserActivity(userId: string, limit: number = 50): Promise<ActivityLogEntry[]> {
  const response = await api.get<{ activity: ActivityLogEntry[] }>(`/admin/users/${userId}/activity`, {
    params: { limit },
  });
  return response.data.activity;
}

// ============================================================================
// User Actions
// ============================================================================

export async function updateUserRole(
  userId: string,
  input: UpdateUserRoleInput
): Promise<UserDetail> {
  const response = await api.patch<{ message: string; user: UserDetail }>(
    `/admin/users/${userId}/role`,
    input
  );
  return response.data.user;
}

export async function deactivateUser(
  userId: string,
  input: DeactivateUserInput
): Promise<UserDetail> {
  const response = await api.post<{ message: string; user: UserDetail }>(
    `/admin/users/${userId}/deactivate`,
    input
  );
  return response.data.user;
}

export async function reactivateUser(userId: string): Promise<UserDetail> {
  const response = await api.post<{ message: string; user: UserDetail }>(
    `/admin/users/${userId}/reactivate`
  );
  return response.data.user;
}

export async function sendUserNotification(
  userId: string,
  input: SendNotificationInput
): Promise<void> {
  await api.post(`/admin/users/${userId}/notify`, input);
}
