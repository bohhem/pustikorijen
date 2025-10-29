import api from '../lib/axios';
import type {
  Branch,
  CreateBranchInput,
  UpdateBranchInput,
  BranchesResponse,
  BranchMember,
  JoinRequest,
  PersonLinkCandidate,
  PersonLinkRecord,
  BranchPlaceholder,
  CreatePlaceholderPayload,
  ClaimPlaceholderPayload,
  BranchPlaceholderClaim,
  ConnectedFamiliesResponse,
  MultiBranchTreeResponse,
  PersonClaim,
} from '../types/branch';

/**
 * Create a new family branch
 */
export async function createBranch(data: CreateBranchInput): Promise<{ message: string; branch: Branch }> {
  const response = await api.post('/branches', data);
  return response.data;
}

export async function updateBranch(branchId: string, data: UpdateBranchInput): Promise<{ message: string; branch: Branch }> {
  const response = await api.patch(`/branches/${branchId}`, data);
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

export async function rejectBridgeLink(branchId: string, linkId: string): Promise<{ message: string }> {
  const response = await api.post(`/branches/${branchId}/person-links/${linkId}/reject`);
  return response.data;
}

/**
 * Update member role (Guru only)
 */
export async function updateMemberRole(branchId: string, userId: string, role: 'member' | 'guru'): Promise<{ message: string; member: BranchMember }> {
  const response = await api.patch(`/branches/${branchId}/members/${userId}/role`, { role });
  return response.data;
}

export async function searchPersonLinkCandidates(branchId: string, query?: string, limit?: number): Promise<PersonLinkCandidate[]> {
  const response = await api.get(`/branches/${branchId}/person-links/candidates`, {
    params: {
      q: query,
      limit,
    },
  });
  return response.data.results ?? [];
}

export async function requestPersonLink(branchId: string, data: { personId: string; displayName?: string | null; notes?: string | null }): Promise<{ message: string; link: PersonLinkRecord }> {
  const response = await api.post(`/branches/${branchId}/person-links`, data);
  return response.data;
}

export async function getPersonLinks(branchId: string, status?: 'pending' | 'approved' | 'rejected'): Promise<PersonLinkRecord[]> {
  const response = await api.get(`/branches/${branchId}/person-links`, {
    params: status ? { status } : undefined,
  });
  return response.data.links ?? [];
}

export async function approvePersonLinkRequest(branchId: string, linkId: string): Promise<{ message: string; link: PersonLinkRecord }> {
  const response = await api.post(`/branches/${branchId}/person-links/${linkId}/approve`);
  return response.data;
}

export async function rejectPersonLinkRequest(branchId: string, linkId: string, notes?: string): Promise<{ message: string; link: PersonLinkRecord }> {
  const response = await api.post(`/branches/${branchId}/person-links/${linkId}/reject`, notes ? { notes } : {});
  return response.data;
}

export async function getBranchPlaceholders(branchId: string): Promise<BranchPlaceholder[]> {
  const response = await api.get(`/branches/${branchId}/placeholders`);
  return response.data.placeholders ?? [];
}

export async function createBranchPlaceholder(branchId: string, data: CreatePlaceholderPayload): Promise<{ message: string; placeholderId: string }> {
  const response = await api.post(`/branches/${branchId}/placeholders`, data);
  return response.data;
}

export async function claimBranchPlaceholder(
  branchId: string,
  placeholderId: string,
  data?: ClaimPlaceholderPayload
): Promise<{ message: string }> {
  const response = await api.post(`/branches/${branchId}/placeholders/${placeholderId}/claim`, data ?? {});
  return response.data;
}

export async function getBranchPlaceholderClaims(branchId: string): Promise<BranchPlaceholderClaim[]> {
  const response = await api.get(`/branches/${branchId}/placeholders/claims`);
  return response.data.claims ?? [];
}

export async function resolveBranchPlaceholderClaim(
  branchId: string,
  claimId: string,
  status: 'approved' | 'rejected',
  message?: string
): Promise<{ message: string }> {
  const response = await api.post(`/branches/${branchId}/placeholders/${claimId}/resolve`, {
    status,
    message,
  });
  return response.data;
}

export async function getConnectedFamilies(branchId: string): Promise<ConnectedFamiliesResponse> {
  const response = await api.get(`/branches/${branchId}/connected-families`);
  return response.data;
}

export async function getPersonClaims(branchId: string): Promise<PersonClaim[]> {
  const response = await api.get(`/branches/${branchId}/person-claims`);
  return response.data.claims ?? [];
}

export async function resolvePersonClaim(
  branchId: string,
  claimId: string,
  status: 'approved' | 'rejected',
  notes?: string
): Promise<PersonClaim> {
  const response = await api.post(`/branches/${branchId}/person-claims/${claimId}/resolve`, {
    status,
    notes,
  });
  return response.data.claim;
}

/**
 * Get multi-branch tree data
 */
export async function getMultiBranchTree(branchId: string): Promise<MultiBranchTreeResponse> {
  const response = await api.get(`/branches/${branchId}/tree/connected`);
  return response.data;
}
