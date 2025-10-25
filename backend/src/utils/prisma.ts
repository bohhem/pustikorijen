import { PrismaClient } from '@prisma/client';

const basePrisma = new PrismaClient();

type Delegate<T extends keyof PrismaClient> = PrismaClient[T];

interface PrismaAliasClient extends PrismaClient {
  user: Delegate<'users'>;
  familyBranch: Delegate<'family_branches'>;
  branchMember: Delegate<'branch_members'>;
  person: Delegate<'persons'>;
  partnership: Delegate<'partnerships'>;
  superGuruAssignment: Delegate<'super_guru_assignments'>;
  branchPersonLink: any;
  geoState: Delegate<'geo_states'>;
  geoRegion: Delegate<'geo_regions'>;
  geoCity: Delegate<'geo_cities'>;
  guruBusinessAddress: Delegate<'guru_business_addresses'>;
  personBusinessAddress: Delegate<'person_business_addresses'>;
}

const prisma = basePrisma as PrismaAliasClient;

Object.defineProperties(basePrisma, {
  user: {
    get() {
      return basePrisma.users;
    },
  },
  familyBranch: {
    get() {
      return basePrisma.family_branches;
    },
  },
  branchMember: {
    get() {
      return basePrisma.branch_members;
    },
  },
  person: {
    get() {
      return basePrisma.persons;
    },
  },
  partnership: {
    get() {
      return basePrisma.partnerships;
    },
  },
  superGuruAssignment: {
    get() {
      return basePrisma.super_guru_assignments;
    },
  },
  branchPersonLink: {
    get() {
      return (basePrisma as any).branch_person_links;
    },
  },
  geoState: {
    get() {
      return (basePrisma as any).geo_states;
    },
  },
  geoRegion: {
    get() {
      return (basePrisma as any).geo_regions;
    },
  },
  geoCity: {
    get() {
      return (basePrisma as any).geo_cities;
    },
  },
  guruBusinessAddress: {
    get() {
      return (basePrisma as any).guru_business_addresses;
    },
  },
  personBusinessAddress: {
    get() {
      return (basePrisma as any).person_business_addresses;
    },
  },
});

export default prisma as unknown as any;
