import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

type GeoSeedRegion = {
  region_id: string;
  state_id: string;
  parent_region_id?: string | null;
  name: string;
  code?: string | null;
  type: string;
  seat?: string | null;
  wikidata_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type GeoSeedCity = {
  city_id: string;
  code: string;
  name: string;
  slug: string;
  wikidata_id?: string | null;
  is_official_city: boolean;
  coordinates?: { latitude?: number | null; longitude?: number | null } | null;
  metrics: {
    num_settlements?: number | null;
    population_2013?: number | null;
    density_per_km2?: number | null;
    area_km2?: number | null;
  };
  municipality: { wikidata_id: string; name: string };
  region?: { region_id: string; name: string; code?: string | null; type: string } | null;
  entity?: { region_id: string; name: string; code?: string | null; type: string } | null;
  state_id?: string;
};

type GeoSeedPayload = {
  state: {
    state_id: string;
    name: string;
    iso2?: string | null;
    iso3?: string | null;
    wikidata_id?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  regions: GeoSeedRegion[];
  cities: GeoSeedCity[];
};

function loadGeoData(): GeoSeedPayload {
  const dataPath = path.resolve(__dirname, '../../data/geo/bih_locations.json');
  const file = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(file) as GeoSeedPayload;
}

async function seedGeoLov(data: GeoSeedPayload) {
  console.log('➡️  Seeding geography tables...');

  await prisma.geo_states.upsert({
    where: { state_id: data.state.state_id },
    update: {
      name: data.state.name,
      iso2: data.state.iso2 ?? null,
      iso3: data.state.iso3 ?? null,
      wikidata_id: data.state.wikidata_id ?? null,
      latitude: data.state.latitude ?? null,
      longitude: data.state.longitude ?? null,
    },
    create: {
      state_id: data.state.state_id,
      name: data.state.name,
      iso2: data.state.iso2 ?? null,
      iso3: data.state.iso3 ?? null,
      wikidata_id: data.state.wikidata_id ?? null,
      latitude: data.state.latitude ?? null,
      longitude: data.state.longitude ?? null,
    },
  });

  for (const region of data.regions) {
    await prisma.geo_regions.upsert({
      where: { region_id: region.region_id },
      update: {
        state_id: region.state_id,
        parent_region_id: region.parent_region_id ?? null,
        name: region.name,
        code: region.code ?? null,
        type: region.type,
        seat: region.seat ?? null,
        wikidata_id: region.wikidata_id ?? null,
        latitude: region.latitude ?? null,
        longitude: region.longitude ?? null,
      },
      create: {
        region_id: region.region_id,
        state_id: region.state_id,
        parent_region_id: region.parent_region_id ?? null,
        name: region.name,
        code: region.code ?? null,
        type: region.type,
        seat: region.seat ?? null,
        wikidata_id: region.wikidata_id ?? null,
        latitude: region.latitude ?? null,
        longitude: region.longitude ?? null,
      },
    });
  }

  for (const city of data.cities) {
    await prisma.geo_cities.upsert({
      where: { city_id: city.city_id },
      update: {
        state_id: city.state_id ?? data.state.state_id,
        region_id: city.region?.region_id ?? null,
        entity_region_id: city.entity?.region_id ?? null,
        name: city.name,
        slug: city.slug,
        city_code: city.code,
        wikidata_id: city.wikidata_id ?? null,
        is_official_city: city.is_official_city,
        latitude: city.coordinates?.latitude ?? null,
        longitude: city.coordinates?.longitude ?? null,
        population_2013: city.metrics.population_2013 ?? null,
        num_settlements: city.metrics.num_settlements ?? null,
        density_per_km2: city.metrics.density_per_km2 ?? null,
        area_km2: city.metrics.area_km2 ?? null,
      },
      create: {
        city_id: city.city_id,
        state_id: city.state_id ?? data.state.state_id,
        region_id: city.region?.region_id ?? null,
        entity_region_id: city.entity?.region_id ?? null,
        name: city.name,
        slug: city.slug,
        city_code: city.code,
        wikidata_id: city.wikidata_id ?? null,
        is_official_city: city.is_official_city,
        latitude: city.coordinates?.latitude ?? null,
        longitude: city.coordinates?.longitude ?? null,
        population_2013: city.metrics.population_2013 ?? null,
        num_settlements: city.metrics.num_settlements ?? null,
        density_per_km2: city.metrics.density_per_km2 ?? null,
        area_km2: city.metrics.area_km2 ?? null,
      },
    });
  }

  console.log(`✅ Seeded ${data.regions.length} regions and ${data.cities.length} cities`);
}

async function main() {
  console.log('🌱 Starting database seed...');

  const geoData = loadGeoData();
  await seedGeoLov(geoData);

  // Create baseline users
  const testUser = await prisma.users.upsert({
    where: { email: 'test@pustikorijen.ba' },
    update: {
      password_hash: '$2a$10$HQl5tXaiy98MAZtHwOISsOt64uXdtGNW8Hhk.CC4HxFIlNofZ15mK',
      updated_at: new Date(),
    },
    create: {
      user_id: randomUUID(),
      email: 'test@pustikorijen.ba',
      password_hash: '$2a$10$HQl5tXaiy98MAZtHwOISsOt64uXdtGNW8Hhk.CC4HxFIlNofZ15mK',
      full_name: 'Test User',
      email_verified: true,
      preferred_language: 'bs',
      updated_at: new Date(),
    },
  });

  const superGuruUser = await prisma.users.upsert({
    where: { email: 'superguru@pustikorijen.ba' },
    update: {
      password_hash: '$2a$10$HQl5tXaiy98MAZtHwOISsOt64uXdtGNW8Hhk.CC4HxFIlNofZ15mK',
      global_role: 'SUPER_GURU',
      email_verified: true,
      updated_at: new Date(),
    },
    create: {
      user_id: randomUUID(),
      email: 'superguru@pustikorijen.ba',
      password_hash: '$2a$10$HQl5tXaiy98MAZtHwOISsOt64uXdtGNW8Hhk.CC4HxFIlNofZ15mK',
      full_name: 'Super Guru',
      email_verified: true,
      preferred_language: 'en',
      global_role: 'SUPER_GURU',
      updated_at: new Date(),
    },
  });

  console.log('✅ Users ready:', testUser.email, superGuruUser.email);

  const sarajevoRegion = await prisma.admin_regions.upsert({
    where: { code: 'BA-SAR' },
    update: {
      updated_at: new Date(),
    },
    create: {
      region_id: 'BA-SAR',
      name: 'Sarajevo Canton',
      code: 'BA-SAR',
      country: 'Bosnia and Herzegovina',
      description: 'Administrative region covering Sarajevo and surrounding municipalities.',
      updated_at: new Date(),
    },
  });

  console.log('✅ Admin region ready:', sarajevoRegion.name);

  await prisma.super_guru_assignments.upsert({
    where: {
      user_id_region_id: {
        user_id: superGuruUser.user_id,
        region_id: sarajevoRegion.region_id,
      },
    },
    update: {
      is_primary: true,
    },
    create: {
      assignment_id: randomUUID(),
      user_id: superGuruUser.user_id,
      region_id: sarajevoRegion.region_id,
      is_primary: true,
      created_by: superGuruUser.user_id,
    },
  });

  const sarajevoCity = geoData.cities.find((city) => city.name === 'Sarajevo');
  if (!sarajevoCity) {
    throw new Error('Sarajevo city not found in geo dataset');
  }

const sampleBranch = await prisma.family_branches.upsert({
  where: { branch_id: 'FB-SA-HODZIC-001' },
  update: {
    admin_region_id: sarajevoRegion.region_id,
    geo_city_id: sarajevoCity.city_id,
    updated_at: new Date(),
  },
  create: {
    branch_id: 'FB-SA-HODZIC-001',
    surname: 'Hodžić',
    surname_normalized: 'HODZIC',
      city_code: sarajevoCity.code,
      city_name: sarajevoCity.name,
      region: sarajevoCity.region?.name ?? sarajevoCity.entity?.name ?? null,
      admin_region_id: sarajevoRegion.region_id,
      country: 'Bosnia and Herzegovina',
      description: 'Hodžić family from Sarajevo',
    founded_by: testUser.user_id,
    visibility: 'public',
    geo_city_id: sarajevoCity.city_id,
    updated_at: new Date(),
  },
});

  console.log('✅ Created sample family branch:', sampleBranch.branch_id);

  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
