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
  joinMessage?: string | null;
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

export interface PersonLinkCandidate {
  id: string;
  fullName: string;
  givenName?: string | null;
  surname?: string | null;
  maidenName?: string | null;
  birthDate?: string | null;
  deathDate?: string | null;
  homeBranch: {
    id: string;
    surname: string;
    cityName?: string | null;
  } | null;
}

export interface PersonLinkRecord {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  displayName?: string | null;
  notes?: string | null;
  sourceBranchId: string;
  targetBranchId: string;
  requestedBy?: {
    id: string;
    fullName: string | null;
    email: string | null;
  } | null;
  sourceApprovedBy?: string | null;
  sourceApprovedAt?: string | null;
  targetApprovedBy?: string | null;
  targetApprovedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  person: {
    id: string;
    fullName: string;
    givenName?: string | null;
    surname?: string | null;
    maidenName?: string | null;
    birthDate?: string | null;
    deathDate?: string | null;
    homeBranch?: {
      id: string;
      surname: string;
      cityName?: string | null;
    } | null;
  };
}
