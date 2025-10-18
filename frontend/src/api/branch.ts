import api from '../lib/axios';
import type { Branch, CreateBranchInput, BranchesResponse, BranchMember, JoinRequest } from '../types/branch';

/**
 * Create a new family branch
 */
export async function createBranch(data: CreateBranchInput): Promise<{ message: string; branch: Branch }> {
  const response = await api.post('/branches', data);
  return response.data;
}

/**
 * Get all branches with pagination and filters
 */
export async function getBranches(params?: {
  page?: number;
  limit?: number;
  surname?: string;
  cityCode?: string;
  search?: string;
}): Promise<BranchesResponse> {
  const response = await api.get('/branches', { params });
  return response.data;
}

/**
 * Get branch by ID
 */
export async function getBranchById(branchId: string): Promise<Branch> {
  const response = await api.get(`/branches/${branchId}`);
  return response.data.branch;
}

/**
 * Get branch members
 */
export async function getBranchMembers(branchId: string): Promise<BranchMember[]> {
  const response = await api.get(`/branches/${branchId}/members`);
  return response.data.members;
}

/**
 * Request to join a branch
 */
export async function requestJoinBranch(branchId: string, data?: JoinRequest): Promise<{ message: string; joinRequest: BranchMember }> {
  const response = await api.post(`/branches/${branchId}/join`, data || {});
  return response.data;
}

/**
 * Get pending join requests (Guru only)
 */
export async function getPendingJoinRequests(branchId: string): Promise<BranchMember[]> {
  const response = await api.get(`/branches/${branchId}/join-requests`);
  return response.data.requests;
}

/**
 * Approve join request (Guru only)
 */
export async function approveJoinRequest(branchId: string, userId: string): Promise<{ message: string; member: BranchMember }> {
  const response = await api.post(`/branches/${branchId}/join-requests/approve`, { userId });
  return response.data;
}

/**
 * Reject join request (Guru only)
 */
export async function rejectJoinRequest(branchId: string, userId: string): Promise<{ message: string }> {
  const response = await api.post(`/branches/${branchId}/join-requests/reject`, { userId });
  return response.data;
}
