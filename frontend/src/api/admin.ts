import api from '../lib/axios';
import type {
  AdminRegionsResponse,
  AdminRegionOverview,
  AssignSuperGuruPayload,
  BridgeIssueMutationResponse,
  BridgeIssuesResponse,
  BridgeIssueSummary,
  CreateAdminRegionPayload,
  UpdateAssignmentPayload,
} from '../types/admin';

export async function getAdminRegionsOverview(): Promise<AdminRegionOverview[]> {
  const response = await api.get<AdminRegionsResponse>('/admin/regions');
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
