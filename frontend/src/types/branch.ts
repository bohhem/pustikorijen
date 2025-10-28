import type { GeoCity } from './geo';

export interface Branch {
  id: string;
  surname: string;
  surnameNormalized: string;
  cityCode: string;
  cityName: string;
  region: string | null;
  country: string;
  geoCityId?: string | null;
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
    lastLogin?: string;
  };
  location?: GeoCity;
  _count?: {
    members: number;
    persons: number;
    stories?: number;
    documents?: number;
  };
}

export interface CreateBranchInput {
  surname: string;
  geoCityId: string;
  description?: string;
  visibility?: 'public' | 'family_only' | 'private';
}

export interface UpdateBranchInput {
  description?: string | null;
  visibility?: 'public' | 'family_only' | 'private';
  geoCityId?: string;
}

export interface BranchPlaceholder {
  id: string;
  displayName: string;
  relationHint?: string | null;
  approxBirthYear?: number | null;
  notes?: string | null;
  status: string;
  isPublic: boolean;
  cityName?: string;
  createdAt: string;
  createdBy?: {
    id: string;
    name: string;
  };
  claimCount: number;
}

export interface CreatePlaceholderPayload {
  displayName: string;
  relationHint?: string | null;
  approxBirthYear?: number | null;
  notes?: string | null;
  isPublic?: boolean;
}

export interface ClaimPlaceholderPayload {
  message?: string | null;
}

export interface MovePersonPayload {
  targetBranchId: string;
  notes?: string | null;
}

export interface BranchPlaceholderClaim {
  id: string;
  placeholderId: string;
  placeholderName: string;
  relationHint?: string;
  user?: {
    id: string;
    name: string;
    email?: string;
  };
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
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

export interface ConnectedFamilyBridge {
  id: string;
  status: 'pending' | 'approved';
  role: 'source' | 'target';
  displayName?: string | null;
  notes?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  person: {
    id: string;
    fullName: string;
    givenName?: string | null;
    surname?: string | null;
    maidenName?: string | null;
    homeBranch?: {
      id: string;
      surname: string;
      cityName?: string | null;
    } | null;
  };
}

export interface ConnectedFamilyStats {
  approvedLinks: number;
  pendingLinks: number;
  firstLinkAt?: string | null;
  lastLinkAt?: string | null;
}

export interface ConnectedFamily {
  branch: {
    id: string;
    surname: string;
    cityName?: string | null;
    region?: string | null;
    country?: string | null;
    visibility: string;
    isVerified: boolean;
  };
  stats: ConnectedFamilyStats;
  bridges: ConnectedFamilyBridge[];
}

export interface ConnectedFamiliesResponse {
  branchId: string;
  connectedFamilies: ConnectedFamily[];
}

export interface PersonClaim {
  id: string;
  personId: string;
  branchId: string;
  user: {
    id: string;
    fullName: string;
    email?: string | null;
  };
  message?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  notes?: string | null;
  personName: string;
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

// Multi-branch tree types
export interface MultiBranchTreePerson {
  id: string;
  fullName: string;
  givenName?: string;
  surname?: string;
  maidenName?: string;
  generation?: string;
  generationNumber?: number;
  fatherId?: string;
  motherId?: string;
  birthDate?: string;
  deathDate?: string;
  profilePhotoUrl?: string;
}

export interface MultiBranchTreePartnership {
  id: string;
  branchId: string;
  person1Id: string;
  person2Id: string;
  partnershipType: string;
  startDate?: string;
  endDate?: string;
  status: string;
  isCurrent: boolean;
}

export interface MultiBranchTreeBridgeLink {
  linkId: string;
  personId: string;
  toBranchId?: string; // For main branch
  direction?: 'outgoing' | 'incoming'; // For connected branches
  displayName?: string | null;
  approvedAt?: string;
}

export interface MultiBranchTreeBranchInfo {
  id: string;
  surname: string;
  cityName: string;
  region?: string | null;
  country: string;
  totalPeople: number;
  totalGenerations: number;
}

export interface MultiBranchTreeBranch {
  branch: MultiBranchTreeBranchInfo;
  persons: MultiBranchTreePerson[];
  partnerships: MultiBranchTreePartnership[];
  bridgeLinks: MultiBranchTreeBridgeLink[];
}

export interface MultiBranchTreeResponse {
  mainBranch: MultiBranchTreeBranch;
  connectedBranches: MultiBranchTreeBranch[];
}
