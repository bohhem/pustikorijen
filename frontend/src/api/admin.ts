import api from '../lib/axios';
import type {
  AdminRegionsResponse,
  AdminRegionOverview,
  AssignSuperGuruPayload,
  AdminBranchListItem,
  AdminBranchListResponse,
  AdminBranchStatusFilter,
  BridgeIssueMutationResponse,
  BridgeIssuesResponse,
  BridgeIssueSummary,
  CreateAdminRegionPayload,
  UpdateAssignmentPayload,
  UpdateBranchRegionPayload,
  AdminRegionTreeNode,
  BackupSummary,
  BackupHistoryResponse,
  BackupSnapshot,
  CreateBackupPayload,
  BackupOptions,
  BackupImpactPreview,
  CreateRestorePayload,
  BackupRestoreSummary,
} from '../types/admin';

export async function getAdminRegionsOverview(): Promise<AdminRegionOverview[]> {
  const response = await api.get<AdminRegionsResponse>('/admin/regions');
  return response.data.regions;
}

export async function getAdminRegionTree(): Promise<AdminRegionTreeNode[]> {
  const response = await api.get<{ regions: AdminRegionTreeNode[] }>('/admin/regions/tree');
  return response.data.regions;
}

export async function createAdminRegion(payload: CreateAdminRegionPayload): Promise<AdminRegionOverview[]> {
  const response = await api.post<AdminRegionsResponse>('/admin/regions', payload);
  return response.data.regions;
}

export async function assignSuperGuru(regionId: string, payload: AssignSuperGuruPayload): Promise<AdminRegionOverview[]> {
  const response = await api.post<AdminRegionsResponse>(`/admin/regions/${regionId}/assignments`, payload);
  return response.data.regions;
}

export async function updateSuperGuruAssignment(
  regionId: string,
  assignmentId: string,
  payload: UpdateAssignmentPayload,
): Promise<AdminRegionOverview[]> {
  const response = await api.patch<AdminRegionsResponse>(
    `/admin/regions/${regionId}/assignments/${assignmentId}`,
    payload,
  );
  return response.data.regions;
}

export async function removeSuperGuruAssignment(regionId: string, assignmentId: string): Promise<AdminRegionOverview[]> {
  const response = await api.delete<AdminRegionsResponse>(
    `/admin/regions/${regionId}/assignments/${assignmentId}`,
  );
  return response.data.regions;
}

export async function getBridgeIssues(): Promise<BridgeIssueSummary[]> {
  const response = await api.get<BridgeIssuesResponse>('/admin/bridge-issues');
  return response.data.issues;
}

export async function setPrimaryBridge(linkId: string): Promise<BridgeIssueSummary[]> {
  const response = await api.post<BridgeIssueMutationResponse>(`/admin/bridge-issues/${linkId}/primary`);
  return response.data.issues;
}

export async function clearPrimaryBridge(linkId: string): Promise<BridgeIssueSummary[]> {
  const response = await api.delete<BridgeIssueMutationResponse>(`/admin/bridge-issues/${linkId}/primary`);
  return response.data.issues;
}

export async function rejectBridgeLink(linkId: string, reason?: string): Promise<BridgeIssueSummary[]> {
  const response = await api.post<BridgeIssueMutationResponse>(`/admin/bridge-issues/${linkId}/reject`, {
    reason: reason ?? null,
  });
  return response.data.issues;
}

export async function updateBridgeGeneration(linkId: string, generationNumber: number | null): Promise<BridgeIssueSummary[]> {
  const response = await api.post<BridgeIssueMutationResponse>(`/admin/bridge-issues/${linkId}/generation`, {
    generationNumber,
  });
  return response.data.issues;
}

export async function getAdminBranches(params: {
  page?: number;
  limit?: number;
  status?: AdminBranchStatusFilter;
  search?: string;
  regionId?: string;
}): Promise<AdminBranchListResponse> {
  const query: Record<string, string | number | undefined> = {};

  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;
  if (params.status) query.status = params.status;
  if (params.search) query.search = params.search;
  if (params.regionId) query.regionId = params.regionId;

  const response = await api.get<AdminBranchListResponse>('/admin/branches', {
    params: query,
  });

  return response.data;
}

export async function archiveAdminBranch(branchId: string, reason?: string | null): Promise<AdminBranchListItem> {
  const response = await api.post<{ message: string; branch: AdminBranchListItem }>(
    `/admin/branches/${branchId}/archive`,
    reason ? { reason } : {},
  );
  return response.data.branch;
}

export async function unarchiveAdminBranch(branchId: string): Promise<AdminBranchListItem> {
  const response = await api.post<{ message: string; branch: AdminBranchListItem }>(
    `/admin/branches/${branchId}/unarchive`,
  );
  return response.data.branch;
}

export async function hardDeleteAdminBranch(branchId: string): Promise<void> {
  await api.delete(`/admin/branches/${branchId}`);
}

export async function updateAdminBranchRegion(
  branchId: string,
  payload: UpdateBranchRegionPayload
): Promise<AdminBranchListItem> {
  const response = await api.post<{ message: string; branch: AdminBranchListItem }>(
    `/admin/branches/${branchId}/region`,
    payload
  );
  return response.data.branch;
}

export async function getBackupSummary(): Promise<BackupSummary> {
  const response = await api.get<{ summary: BackupSummary }>('/admin/backups/summary');
  return response.data.summary;
}

export async function getBackupHistory(): Promise<BackupSnapshot[]> {
  const response = await api.get<BackupHistoryResponse>('/admin/backups');
  return response.data.snapshots;
}

export async function getBackupOptions(): Promise<BackupOptions> {
  const response = await api.get<{ options: BackupOptions }>('/admin/backups/options');
  return response.data.options;
}

export async function createBackupSnapshot(payload: CreateBackupPayload): Promise<BackupSnapshot> {
  const response = await api.post<{ snapshot: BackupSnapshot }>('/admin/backups', payload);
  return response.data.snapshot;
}

export async function getBackupImpact(backupId: string, targetEnv: string): Promise<BackupImpactPreview> {
  const response = await api.get<{ impact: BackupImpactPreview }>(`/admin/backups/${backupId}/impact`, {
    params: { targetEnv },
  });
  return response.data.impact;
}

export async function requestBackupRestore(
  backupId: string,
  payload: CreateRestorePayload
): Promise<BackupRestoreSummary> {
  const response = await api.post<{ restore: BackupRestoreSummary }>(`/admin/backups/${backupId}/restore`, payload);
  return response.data.restore;
}

export async function downloadBackupManifest(backupId: string): Promise<Blob> {
  const response = await api.get(`/admin/backups/${backupId}/manifest`, {
    responseType: 'blob',
  });
  return response.data;
}
