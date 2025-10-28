import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';

type LedgerPersonRow = {
  person_id: string;
  full_name: string;
  surname: string | null;
  birth_year: number | null;
  birth_date: Date | null;
  estimated_birth_year: number | null;
  family_branches: {
    branch_id: string;
    surname: string;
    geo_city_id: string | null;
    geo_city: {
      city_id: string;
      name: string;
      region: { name: string | null } | null;
      entity_region: { name: string | null } | null;
    } | null;
  } | null;
};

export interface LedgerEntry {
  personId: string;
  fullName: string;
  surname?: string | null;
  approxAge?: number | null;
  branchId: string;
  branchName: string;
  geoCityId?: string | null;
  cityName?: string | null;
  regionName?: string | null;
}

function calculateApproxAge(params: {
  birthDate?: Date | null;
  birthYear?: number | null;
  estimatedYear?: number | null;
}): number | null {
  const nowYear = new Date().getFullYear();
  if (params.birthDate) {
    return nowYear - params.birthDate.getFullYear();
  }
  if (params.birthYear) {
    return nowYear - params.birthYear;
  }
  if (params.estimatedYear) {
    return nowYear - params.estimatedYear;
  }
  return null;
}

export async function getPeopleLedgerByRegion(regionId: string, search?: string, limit = 250): Promise<LedgerEntry[]> {
  const sanitizedSearch = search?.trim();
  const where: Prisma.personsWhereInput = {
    share_in_ledger: true,
    family_branches: {
      geo_city: {
        OR: [{ region_id: regionId }, { entity_region_id: regionId }],
      },
    },
  };

  if (sanitizedSearch) {
    where.OR = [
      { full_name: { contains: sanitizedSearch, mode: 'insensitive' } },
      { surname: { contains: sanitizedSearch, mode: 'insensitive' } },
    ];
  }

  const persons = (await prisma.person.findMany({
    where,
    take: limit,
    select: {
      person_id: true,
      full_name: true,
      surname: true,
      birth_year: true,
      birth_date: true,
      estimated_birth_year: true,
      family_branches: {
        select: {
          branch_id: true,
          surname: true,
          geo_city_id: true,
          geo_city: {
            select: {
              city_id: true,
              name: true,
              region: { select: { name: true } },
              entity_region: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: [{ surname: 'asc' }, { full_name: 'asc' }],
  })) as LedgerPersonRow[];

  return persons
    .filter((person) => person.family_branches?.geo_city)
    .map((person) => {
      const branch = person.family_branches!;
      const city = branch.geo_city!;
      return {
        personId: person.person_id,
        fullName: person.full_name,
        surname: person.surname ?? undefined,
        approxAge: calculateApproxAge({
          birthDate: person.birth_date,
          birthYear: person.birth_year,
          estimatedYear: person.estimated_birth_year ?? person.birth_year ?? undefined,
        }),
        branchId: branch.branch_id,
        branchName: branch.surname,
        geoCityId: branch.geo_city_id ?? undefined,
        cityName: city.name ?? undefined,
        regionName: city.region?.name ?? city.entity_region?.name ?? undefined,
      } as LedgerEntry;
    });
}
