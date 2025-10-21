export interface AdminRegionGuru {
  assignmentId: string;
  id: string;
  fullName: string;
  email: string;
  isPrimary: boolean;
  isSelf: boolean;
}

export interface AdminRegionBranch {
  id: string;
  surname: string;
  cityName: string;
  region: string | null;
  country: string | null;
  visibility: string;
  totalPeople: number;
  createdAt: string;
}

export interface AdminRegionOverview {
  id: string;
  name: string;
  code: string;
  description: string | null;
  country: string | null;
  totalBranches: number;
  activeMemberCount: number;
  gurus: AdminRegionGuru[];
  selfAssignment: {
    isPrimary: boolean;
    assignedAt: string;
  } | null;
  recentBranches: AdminRegionBranch[];
}

export interface AdminRegionsResponse {
  regions: AdminRegionOverview[];
}

export interface CreateAdminRegionPayload {
  name: string;
  code: string;
  country?: string | null;
  description?: string | null;
}

export interface AssignSuperGuruPayload {
  email: string;
  isPrimary?: boolean;
}

export interface UpdateAssignmentPayload {
  isPrimary: boolean;
}
