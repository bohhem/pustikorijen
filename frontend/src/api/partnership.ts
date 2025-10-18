import api from '../lib/axios';
import type { Partnership, CreatePartnershipInput, UpdatePartnershipInput } from '../types/partnership';

/**
 * Get all partnerships in a branch
 */
export async function getBranchPartnerships(branchId: string): Promise<Partnership[]> {
  const response = await api.get(`/branches/${branchId}/partnerships`);
  return response.data.partnerships;
}

/**
 * Get partnerships for a specific person
 */
export async function getPersonPartnerships(branchId: string, personId: string): Promise<Partnership[]> {
  const response = await api.get(`/branches/${branchId}/persons/${personId}/partnerships`);
  return response.data.partnerships;
}

/**
 * Get partnership by ID
 */
export async function getPartnershipById(branchId: string, partnershipId: string): Promise<Partnership> {
  const response = await api.get(`/branches/${branchId}/partnerships/${partnershipId}`);
  return response.data.partnership;
}

/**
 * Create a new partnership
 */
export async function createPartnership(branchId: string, data: CreatePartnershipInput): Promise<Partnership> {
  const response = await api.post(`/branches/${branchId}/partnerships`, data);
  return response.data.partnership;
}

/**
 * Update partnership
 */
export async function updatePartnership(
  branchId: string,
  partnershipId: string,
  data: UpdatePartnershipInput
): Promise<Partnership> {
  const response = await api.patch(`/branches/${branchId}/partnerships/${partnershipId}`, data);
  return response.data.partnership;
}

/**
 * Delete partnership
 */
export async function deletePartnership(branchId: string, partnershipId: string): Promise<void> {
  await api.delete(`/branches/${branchId}/partnerships/${partnershipId}`);
}
