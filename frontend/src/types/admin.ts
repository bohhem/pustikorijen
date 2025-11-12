export interface RegionBreadcrumb {
  id: string;
  name: string;
  code: string;
  level: number;
}

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
  adminRegion?: {
    id: string;
    name: string;
    code: string;
    level?: number;
    kind?: string;
  } | null;
  adminRegionPath?: RegionBreadcrumb[];
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
  hierarchyPath: RegionBreadcrumb[];
}

export interface AdminRegionsResponse {
  regions: AdminRegionOverview[];
}

export interface AdminRegionTreeNode {
  id: string;
  name: string;
  code: string;
  level: number;
  kind?: string | null;
  country?: string | null;
  children: AdminRegionTreeNode[];
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
    adminRegion?: {
      id: string;
      name: string;
      code: string;
    } | null;
    country?: string | null;
  };
  branchB: {
    id: string;
    surname: string;
    cityName?: string | null;
    adminRegion?: {
      id: string;
      name: string;
      code: string;
    } | null;
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

export type AdminBranchStatusFilter = 'active' | 'archived' | 'all';

export interface AdminBranchListItem {
  id: string;
  surname: string;
  surnameNormalized: string;
  cityCode: string;
  cityName: string;
  country: string;
  visibility: string;
  totalPeople: number;
  totalGenerations: number;
  memberCount: number;
  personCount: number;
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;
  archivedAt: string | null;
  archivedReason: string | null;
  archivedBy?: {
    id: string;
    fullName?: string | null;
  } | null;
  adminRegion?: {
    id: string;
    name: string;
    code: string;
    level?: number;
    kind?: string;
  } | null;
  adminRegionPath?: Array<{
    id: string;
    name: string;
    code: string;
    level: number;
  }>;
  founder?: {
    id: string;
    fullName: string;
  } | null;
}

export interface AdminBranchListResponse {
  branches: AdminBranchListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  totals: {
    active: number;
    archived: number;
  };
}

export interface UpdateBranchRegionPayload {
  regionId?: string | null;
}

export type BackupScope = 'FULL' | 'REGION';

export type BackupStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export type RestoreStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface BackupRestoreSummary {
  id: string;
  targetEnv: string;
  status: RestoreStatus;
  dryRun: boolean;
  startedAt: string;
  completedAt: string | null;
  failureMessage?: string | null;
}

export interface BackupImpactPreview {
  backupId: string;
  targetEnv: string;
  sizeBytes: number | null;
  includeMedia: boolean;
  checksum?: string | null;
  estimatedDowntimeMinutes: number;
  recommendedSteps: string[];
}

export interface BackupOptions {
  restoreTargets: string[];
  confirmTemplate: string;
}

export interface BackupSummary {
  lastSuccessfulAt: string | null;
  nextScheduledAt: string | null;
  totalSnapshots: number;
  outstandingRestores: number;
  storageUsageBytes: number;
}

export interface BackupSnapshot {
  id: string;
  label: string;
  scope: BackupScope;
  regionId?: string | null;
  regionName?: string | null;
  includeMedia: boolean;
  status: BackupStatus;
  initiatedBy: {
    id: string;
    fullName: string;
    email?: string | null;
  };
  startedAt: string;
  completedAt?: string | null;
  sizeBytes?: number | null;
  storagePath?: string | null;
  downloadUrl?: string | null;
  manifestUrl?: string | null;
  notes?: string | null;
  latestRestore?: BackupRestoreSummary | null;
}

export interface BackupHistoryResponse {
  snapshots: BackupSnapshot[];
}

export interface CreateBackupPayload {
  label: string;
  scope: BackupScope;
  regionId?: string;
  includeMedia?: boolean;
  retentionDays?: number;
  notifyEmails?: string[];
}

export interface CreateRestorePayload {
  targetEnv: string;
  dryRun?: boolean;
  confirmPhrase: string;
  otpCode?: string;
}
