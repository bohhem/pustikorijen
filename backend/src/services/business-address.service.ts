import { randomUUID } from 'crypto';
import type { JwtPayload } from '../utils/jwt';
import prisma from '../utils/prisma';
import { GEO_CITY_INCLUDE, getGeoCityOrThrow, mapGeoCity, type GeoCityRecord } from './geo.service';
import type {
  UpsertGuruBusinessAddressInput,
  CreatePersonBusinessAddressInput,
  UpdatePersonBusinessAddressInput,
} from '../validators/business-address.validator';

type GuruBusinessAddressRecord = {
  address_id: string;
  user_id: string;
  geo_city: GeoCityRecord;
  geo_city_id: string;
  label: string | null;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  google_maps_place_id: string | null;
  google_maps_url: string | null;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
};

type PersonBusinessAddressRecord = {
  address_id: string;
  person_id: string;
  geo_city: GeoCityRecord;
  geo_city_id: string;
  label: string | null;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  google_maps_place_id: string | null;
  google_maps_url: string | null;
  is_primary: boolean;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

const ADDRESS_INCLUDE = {
  geo_city: {
    include: GEO_CITY_INCLUDE,
  },
} as const;

function mapGuruAddress(record: GuruBusinessAddressRecord) {
  return {
    id: record.address_id,
    label: record.label ?? undefined,
    addressLine1: record.address_line1 ?? undefined,
    addressLine2: record.address_line2 ?? undefined,
    postalCode: record.postal_code ?? undefined,
    latitude: record.latitude ?? undefined,
    longitude: record.longitude ?? undefined,
    googleMapsPlaceId: record.google_maps_place_id ?? undefined,
    googleMapsUrl: record.google_maps_url ?? undefined,
    isPublic: record.is_public,
    geoCity: mapGeoCity(record.geo_city),
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function mapPersonAddress(record: PersonBusinessAddressRecord) {
  return {
    id: record.address_id,
    personId: record.person_id,
    label: record.label ?? undefined,
    addressLine1: record.address_line1 ?? undefined,
    addressLine2: record.address_line2 ?? undefined,
    postalCode: record.postal_code ?? undefined,
    latitude: record.latitude ?? undefined,
    longitude: record.longitude ?? undefined,
    googleMapsPlaceId: record.google_maps_place_id ?? undefined,
    googleMapsUrl: record.google_maps_url ?? undefined,
    isPrimary: record.is_primary,
    notes: record.notes ?? undefined,
    geoCity: mapGeoCity(record.geo_city),
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

async function ensureAnyGuru(user: JwtPayload) {
  if (user.globalRole === 'SUPER_GURU' || user.globalRole === 'ADMIN') {
    return;
  }

  const membership = await prisma.branchMember.findFirst({
    where: {
      user_id: user.userId,
      role: 'guru',
      status: 'active',
    },
  });

  if (!membership) {
    throw new Error('Guru permissions required');
  }
}

async function ensureBranchGuru(branchId: string, user: JwtPayload) {
  if (user.globalRole === 'SUPER_GURU' || user.globalRole === 'ADMIN') {
    return;
  }

  const membership = await prisma.branchMember.findUnique({
    where: {
      branch_id_user_id: {
        branch_id: branchId,
        user_id: user.userId,
      },
    },
  });

  if (!membership || membership.role !== 'guru' || membership.status !== 'active') {
    throw new Error('You must be a Guru of this branch to manage addresses');
  }
}

export async function getGuruBusinessAddress(userId: string) {
  const address = await prisma.guruBusinessAddress.findUnique({
    where: { user_id: userId },
    include: ADDRESS_INCLUDE,
  });

  if (!address) {
    return null;
  }

  return mapGuruAddress(address as GuruBusinessAddressRecord);
}

export async function upsertGuruBusinessAddress(
  user: JwtPayload,
  input: UpsertGuruBusinessAddressInput
) {
  await ensureAnyGuru(user);
  await getGeoCityOrThrow(input.geoCityId);

  const payload = {
    label: input.label ?? null,
    address_line1: input.addressLine1,
    address_line2: input.addressLine2 ?? null,
    postal_code: input.postalCode ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    google_maps_place_id: input.googleMapsPlaceId ?? null,
    google_maps_url: input.googleMapsUrl ?? null,
    is_public: input.isPublic ?? true,
    geo_city_id: input.geoCityId,
    updated_at: new Date(),
  };

  const address = await prisma.guruBusinessAddress.upsert({
    where: { user_id: user.userId },
    update: payload,
    create: {
      address_id: randomUUID(),
      user_id: user.userId,
      ...payload,
    },
    include: ADDRESS_INCLUDE,
  });

  return mapGuruAddress(address as GuruBusinessAddressRecord);
}

async function getPersonWithBranch(branchId: string, personId: string) {
  const person = await prisma.person.findUnique({
    where: { person_id: personId },
    select: {
      person_id: true,
      branch_id: true,
    },
  });

  if (!person || person.branch_id !== branchId) {
    throw new Error('Person not found in this branch');
  }

  return person;
}

export async function listPersonBusinessAddresses(
  branchId: string,
  personId: string,
  actor: JwtPayload
) {
  const person = await getPersonWithBranch(branchId, personId);
  await ensureBranchGuru(person.branch_id, actor);

  const addresses = await prisma.personBusinessAddress.findMany({
    where: { person_id: person.person_id },
    orderBy: [{ is_primary: 'desc' }, { created_at: 'desc' }],
    include: ADDRESS_INCLUDE,
  });

  return addresses.map((record: any) => mapPersonAddress(record as PersonBusinessAddressRecord));
}

export async function createPersonBusinessAddress(
  branchId: string,
  personId: string,
  actor: JwtPayload,
  input: CreatePersonBusinessAddressInput
) {
  const person = await getPersonWithBranch(branchId, personId);
  await ensureBranchGuru(person.branch_id, actor);
  await getGeoCityOrThrow(input.geoCityId);

  const address = await prisma.personBusinessAddress.create({
    data: {
      address_id: randomUUID(),
      person_id: person.person_id,
      geo_city_id: input.geoCityId,
      label: input.label ?? null,
      address_line1: input.addressLine1,
      address_line2: input.addressLine2 ?? null,
      postal_code: input.postalCode ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      google_maps_place_id: input.googleMapsPlaceId ?? null,
      google_maps_url: input.googleMapsUrl ?? null,
      is_primary: input.isPrimary ?? false,
      notes: input.notes ?? null,
    },
    include: ADDRESS_INCLUDE,
  });

  if (input.isPrimary) {
    await prisma.personBusinessAddress.updateMany({
      where: {
        person_id: person.person_id,
        address_id: { not: address.address_id },
      },
      data: { is_primary: false },
    });
  }

  return mapPersonAddress(address as PersonBusinessAddressRecord);
}

export async function updatePersonBusinessAddress(
  branchId: string,
  personId: string,
  addressId: string,
  actor: JwtPayload,
  input: UpdatePersonBusinessAddressInput
) {
  const person = await getPersonWithBranch(branchId, personId);
  await ensureBranchGuru(person.branch_id, actor);

  const existing = await prisma.personBusinessAddress.findUnique({
    where: { address_id: addressId },
  });

  if (!existing || existing.person_id !== person.person_id) {
    throw new Error('Address not found');
  }

  if (input.geoCityId) {
    await getGeoCityOrThrow(input.geoCityId);
  }

  const updated = await prisma.personBusinessAddress.update({
    where: { address_id: addressId },
    data: {
      geo_city_id: input.geoCityId ?? undefined,
      label: input.label ?? undefined,
      address_line1: input.addressLine1 ?? undefined,
      address_line2: input.addressLine2 ?? undefined,
      postal_code: input.postalCode ?? undefined,
      latitude: input.latitude ?? undefined,
      longitude: input.longitude ?? undefined,
      google_maps_place_id: input.googleMapsPlaceId ?? undefined,
      google_maps_url: input.googleMapsUrl ?? undefined,
      is_primary: input.isPrimary ?? undefined,
      notes: input.notes ?? undefined,
    },
    include: ADDRESS_INCLUDE,
  });

  if (input.isPrimary) {
    await prisma.personBusinessAddress.updateMany({
      where: {
        person_id: person.person_id,
        address_id: { not: addressId },
      },
      data: { is_primary: false },
    });
  }

  return mapPersonAddress(updated as PersonBusinessAddressRecord);
}

export async function deletePersonBusinessAddress(
  branchId: string,
  personId: string,
  addressId: string,
  actor: JwtPayload
) {
  const person = await getPersonWithBranch(branchId, personId);
  await ensureBranchGuru(person.branch_id, actor);

  const existing = await prisma.personBusinessAddress.findUnique({
    where: { address_id: addressId },
  });

  if (!existing || existing.person_id !== person.person_id) {
    throw new Error('Address not found');
  }

  await prisma.personBusinessAddress.delete({
    where: { address_id: addressId },
  });
}
