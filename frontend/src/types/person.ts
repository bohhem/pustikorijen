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
  fatherId?: string;
  motherId?: string;
  profilePhotoUrl?: string;
  isAlive?: boolean;
  privacyLevel?: string;
  createdAt?: string;
  updatedAt?: string;
  createdById?: string;
  father?: Person;
  mother?: Person;
  children?: Person[];

  // Computed properties for backward compatibility
  firstName?: string;
  lastName?: string;
}

export interface CreatePersonInput {
  firstName: string;
  lastName: string;
  maidenName?: string;
  gender: 'male' | 'female' | 'other';
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  biography?: string;
  fatherId?: string;
  motherId?: string;
  isAlive: boolean;
  privacyLevel?: 'public' | 'family_only' | 'private';
}

export interface UpdatePersonInput extends Partial<CreatePersonInput> {}
