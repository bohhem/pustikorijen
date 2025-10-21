import api from '../lib/axios';
import type {
  AdminRegionsResponse,
  AdminRegionOverview,
  AssignSuperGuruPayload,
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
