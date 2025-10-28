export interface Person {
  id: string;
  branchId: string;
  fullName: string;
  givenName?: string;
  surname?: string;
  maidenName?: string;
  nickname?: string;
  gender?: string;
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  currentLocation?: string;
  currentCountry?: string;
  occupation?: string;
  education?: string;
  biography?: string;
  generation?: string;  // G1, G2, etc
  generationNumber?: number;
  fatherId?: string | null;
  motherId?: string | null;
  profilePhotoUrl?: string;
  isAlive?: boolean;
  shareInLedger?: boolean;
  estimatedBirthYear?: number | null;
  privacyLevel?: string;
  createdAt?: string;
  updatedAt?: string;
  createdById?: string;
  father?: Person;
  mother?: Person;
  children?: Person[];

  // Cross-branch linking metadata
  isLinked?: boolean;
  linkId?: string;
  linkStatus?: string;
  linkDisplayName?: string | null;
  linkedFromBranch?: {
    id: string;
    surname: string;
    cityName?: string | null;
  } | null;
  homeBranch?: {
    id: string;
    surname: string;
    cityName?: string | null;
  } | null;

  canBeClaimed?: boolean;
  claimStatus?: 'pending' | 'approved' | 'rejected';

  // Computed properties for backward compatibility
  firstName?: string;
  lastName?: string;
}

export interface CreatePersonInput {
  firstName: string;
  lastName: string;
  maidenName?: string | null;
  gender: 'male' | 'female' | 'other';
  birthDate?: string | null;
  birthPlace?: string | null;
  deathDate?: string | null;
  deathPlace?: string | null;
  biography?: string | null;
  fatherId?: string;
  motherId?: string;
  isAlive: boolean;
  privacyLevel?: 'public' | 'family_only' | 'private';
  shareInLedger?: boolean;
  estimatedBirthYear?: number | null;
}

export interface UpdatePersonInput {
  firstName?: string;
  lastName?: string;
  maidenName?: string | null;
  gender?: 'male' | 'female' | 'other';
  birthDate?: string | null;
  birthPlace?: string | null;
  deathDate?: string | null;
  deathPlace?: string | null;
  biography?: string | null;
  fatherId?: string | null;
  motherId?: string | null;
  isAlive?: boolean;
  privacyLevel?: 'public' | 'family_only' | 'private';
  shareInLedger?: boolean;
  estimatedBirthYear?: number | null;
}
