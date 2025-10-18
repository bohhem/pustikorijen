export interface Partnership {
  id: string;
  branchId: string;
  person1Id: string;
  person2Id: string;
  partnershipType: 'marriage' | 'domestic_partnership' | 'common_law' | 'other';
  startDate?: string;
  startPlace?: string;
  endDate?: string;
  endPlace?: string;
  endReason?: 'divorce' | 'death' | 'separation' | 'annulment';
  status: 'active' | 'ended' | 'annulled';
  isCurrent: boolean;
  orderNumber: number;
  notes?: string;
  ceremonyType?: string;
  visibility: 'public' | 'family_only' | 'private';
  createdAt: string;
  updatedAt: string;

  // Relations
  person1?: PartnershipPerson;
  person2?: PartnershipPerson;
  createdBy?: {
    id: string;
    fullName: string;
  };
}

export interface PartnershipPerson {
  id: string;
  fullName: string;
  givenName?: string;
  surname?: string;
  maidenName?: string;
  birthDate?: string;
  deathDate?: string;
  profilePhotoUrl?: string;
}

export interface CreatePartnershipInput {
  person1Id: string;
  person2Id: string;
  partnershipType?: 'marriage' | 'domestic_partnership' | 'common_law' | 'other';
  startDate?: string;
  startPlace?: string;
  endDate?: string;
  endPlace?: string;
  endReason?: 'divorce' | 'death' | 'separation' | 'annulment';
  status?: 'active' | 'ended' | 'annulled';
  orderNumber?: number;
  notes?: string;
  ceremonyType?: string;
  visibility?: 'public' | 'family_only' | 'private';
}

export interface UpdatePartnershipInput {
  partnershipType?: 'marriage' | 'domestic_partnership' | 'common_law' | 'other';
  startDate?: string;
  startPlace?: string;
  endDate?: string;
  endPlace?: string;
  endReason?: 'divorce' | 'death' | 'separation' | 'annulment';
  status?: 'active' | 'ended' | 'annulled';
  isCurrent?: boolean;
  orderNumber?: number;
  notes?: string;
  ceremonyType?: string;
  visibility?: 'public' | 'family_only' | 'private';
}
