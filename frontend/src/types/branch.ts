export interface Branch {
  id: string;
  surname: string;
  surnameNormalized: string;
  cityCode: string;
  cityName: string;
  region: string | null;
  country: string;
  rootPersonId: string | null;
  oldestAncestorYear: number | null;
  totalPeople: number;
  totalGenerations: number;
  description: string | null;
  foundedById: string | null;
  visibility: 'public' | 'family_only' | 'private';
  isVerified: boolean;
  verificationDate: string | null;
  rootChangeCount: number;
  lastMajorUpdate: string | null;
  createdAt: string;
  updatedAt: string;
  foundedBy?: {
    id: string;
    fullName: string;
    email?: string;
  };
  _count?: {
    members: number;
    persons: number;
    stories?: number;
    documents?: number;
  };
}

export interface CreateBranchInput {
  surname: string;
  cityCode: string;
  cityName: string;
  region?: string;
  country?: string;
  description?: string;
  visibility?: 'public' | 'family_only' | 'private';
}

export interface BranchMember {
  id: string;
  branchId: string;
  userId: string;
  role: 'guest' | 'member' | 'editor' | 'guru';
  personId: string | null;
  canEditGenerations: string | null;
  autoApprovePhotos: boolean;
  autoApproveStories: boolean;
  status: 'pending' | 'active' | 'suspended' | 'removed';
  contributionCount: number;
  lastContribution: string | null;
  joinedAt: string;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string;
    email?: string;
    currentLocation: string | null;
  };
  person?: {
    id: string;
    fullName: string;
  };
}

export interface JoinRequest {
  message?: string;
}

export interface BranchesResponse {
  branches: Branch[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
