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

export interface BridgeIssueLink {
  id: string;
  status: 'pending' | 'approved';
  isPrimary: boolean;
  sourceBranchId: string;
  targetBranchId: string;
  displayName?: string | null;
  notes?: string | null;
  approvedAt?: string | null;
  primaryAssignedAt?: string | null;
  displayGenerationOverride?: number | null;
  person: {
    id: string;
    fullName: string;
    generation?: string | null;
    generationNumber?: number | null;
  };
}

export interface BridgeIssueSummary {
  pairId: string;
  branchA: {
    id: string;
    surname: string;
    cityName?: string | null;
    region?: string | null;
    country?: string | null;
  };
  branchB: {
    id: string;
    surname: string;
    cityName?: string | null;
    region?: string | null;
    country?: string | null;
  };
  totalLinks: number;
  hasPrimary: boolean;
  primaryLinkId: string | null;
  links: BridgeIssueLink[];
}

export interface BridgeIssuesResponse {
  issues: BridgeIssueSummary[];
}

export interface BridgeIssueMutationResponse {
  message: string;
  issues: BridgeIssueSummary[];
}
