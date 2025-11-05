import prisma from '../utils/prisma';

export type GeoRegionRecord = {
  region_id: string;
  name: string;
  code: string | null;
  type: string;
  parent_region_id?: string | null;
};

export type GeoCityRecord = {
  city_id: string;
  city_code: string;
  name: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  population_2013: number | null;
  num_settlements: number | null;
  density_per_km2: number | null;
  area_km2: number | null;
  region?: GeoRegionRecord | null;
  entity_region?: GeoRegionRecord | null;
  state: {
    state_id: string;
    name: string;
    iso2?: string | null;
    iso3?: string | null;
  };
};

const GEO_CITY_INCLUDE_BASE = {
  state: {
    select: {
      state_id: true,
      name: true,
      iso2: true,
      iso3: true,
    },
  },
  region: {
    select: {
      region_id: true,
      name: true,
      code: true,
      type: true,
      parent_region_id: true,
    },
  },
  entity_region: {
    select: {
      region_id: true,
      name: true,
      code: true,
      type: true,
      parent_region_id: true,
    },
  },
} as const;

export const GEO_CITY_INCLUDE = GEO_CITY_INCLUDE_BASE;

function mapState(record: { state_id: string; name: string; iso2?: string | null; iso3?: string | null }) {
  return {
    id: record.state_id,
    name: record.name,
    iso2: record.iso2 ?? undefined,
    iso3: record.iso3 ?? undefined,
  };
}

export function mapGeoRegion(record?: GeoRegionRecord | null) {
  if (!record) {
    return undefined;
  }

  return {
    id: record.region_id,
    name: record.name,
    code: record.code ?? undefined,
    type: record.type,
    parentRegionId: record.parent_region_id ?? undefined,
  };
}

export function mapGeoCity(record?: GeoCityRecord | null) {
  if (!record) {
    return undefined;
  }

  return {
    id: record.city_id,
    code: record.city_code,
    name: record.name,
    slug: record.slug,
    coordinates:
      record.latitude !== null && record.longitude !== null
        ? { latitude: record.latitude, longitude: record.longitude }
        : undefined,
    metrics: {
      population2013: record.population_2013 ?? undefined,
      settlements: record.num_settlements ?? undefined,
      densityPerKm2: record.density_per_km2 ?? undefined,
      areaKm2: record.area_km2 ?? undefined,
    },
    region: mapGeoRegion(record.region),
    entity: mapGeoRegion(record.entity_region),
    state: record.state ? mapState(record.state) : undefined,
  };
}

export async function listStates() {
  const states = await prisma.geoState.findMany({
    orderBy: { name: 'asc' },
  });

  return states.map(mapState);
}

export async function listRegionsByState(stateId: string) {
  const regions = await prisma.geoRegion.findMany({
    where: { state_id: stateId },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  });

  return regions.map((region: any) => ({
    id: region.region_id,
    name: region.name,
    code: region.code ?? undefined,
    type: region.type,
    parentRegionId: region.parent_region_id ?? undefined,
  }));
}

export async function listCitiesByRegion(regionId: string) {
  const cities = await prisma.geoCity.findMany({
    where: {
      OR: [
        { region_id: regionId },
        { entity_region_id: regionId },
      ],
    },
    orderBy: { name: 'asc' },
    include: GEO_CITY_INCLUDE,
  });

  return cities.map((city: any) => mapGeoCity(city as GeoCityRecord));
}

export async function listCitiesByState(stateId: string) {
  const cities = await prisma.geoCity.findMany({
    where: { state_id: stateId },
    orderBy: { name: 'asc' },
    include: GEO_CITY_INCLUDE,
  });

  return cities.map((city: any) => mapGeoCity(city as GeoCityRecord));
}

export async function getGeoCityById(cityId: string) {
  return prisma.geoCity.findUnique({
    where: { city_id: cityId },
    include: GEO_CITY_INCLUDE,
  });
}

export async function getGeoCityOrThrow(cityId: string) {
  const city = await getGeoCityById(cityId);
  if (!city) {
    throw new Error('City not found');
  }
  return city as GeoCityRecord;
}

export async function getCityDetail(cityId: string) {
  const city = await prisma.geoCity.findUnique({
    where: { city_id: cityId },
    include: GEO_CITY_INCLUDE,
  });

  if (!city) {
    throw new Error('City not found');
  }

  return mapGeoCity(city as GeoCityRecord);
}
