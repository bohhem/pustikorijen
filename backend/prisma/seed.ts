import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

type GeoSeedState = {
  state_id: string;
  name: string;
  iso2: string;
  iso3?: string | null;
  nuts_id?: string | null;
  capital?: string | null;
};

type GeoSeedRegion = {
  region_id: string;
  state_id: string;
  name: string;
  nuts_id: string;
  nuts_level: number;
  code: string;
  type: string;
  parent_region_id?: string | null;
};

type GeoSeedCity = {
  city_id: string;
  name: string;
  slug: string;
  city_code: string;
  state_id: string;
  region_id?: string | null;
  country_code: string;
  is_official_city: boolean;
  latitude?: number | null;
  longitude?: number | null;
  area_km2?: number | null;
  nuts3_id?: string | null;
  nuts2_id?: string | null;
  functional_area_code?: string | null;
};

type GeoSeedDataset = {
  metadata: Record<string, unknown>;
  states: GeoSeedState[];
  regions: GeoSeedRegion[];
  cities: GeoSeedCity[];
};

function loadGeoData(): GeoSeedDataset {
  const dataPath = path.resolve(__dirname, '../../data/geo/eu_locations.json');
  const file = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(file) as GeoSeedDataset;
}

async function seedGeoLov(data: GeoSeedDataset) {
  console.log('➡️  Resetting geography tables...');

  await prisma.geo_cities.deleteMany({});
  await prisma.geo_regions.deleteMany({});
  await prisma.geo_states.deleteMany({});

  console.log('➡️  Seeding geo_states...');
  if (data.states.length) {
    await prisma.geo_states.createMany({
      data: data.states.map((state) => ({
        state_id: state.state_id,
        name: state.name,
        iso2: state.iso2 ?? null,
        iso3: state.iso3 ?? null,
        wikidata_id: null,
        latitude: null,
        longitude: null,
      })),
    });
  }

  console.log('➡️  Seeding geo_regions...');
  if (data.regions.length) {
    const chunkSize = 500;
    for (let i = 0; i < data.regions.length; i += chunkSize) {
      const chunk = data.regions.slice(i, i + chunkSize);
      await prisma.geo_regions.createMany({
        data: chunk.map((region) => ({
          region_id: region.region_id,
          state_id: region.state_id,
          parent_region_id: region.parent_region_id ?? null,
          name: region.name,
          name_native: null,
          code: region.code ?? null,
          type: region.type,
          seat: null,
          wikidata_id: null,
          latitude: null,
          longitude: null,
        })),
      });
    }
  }

  console.log('➡️  Seeding geo_cities...');
  if (data.cities.length) {
    const chunkSize = 500;
    for (let i = 0; i < data.cities.length; i += chunkSize) {
      const chunk = data.cities.slice(i, i + chunkSize);
      await prisma.geo_cities.createMany({
        data: chunk.map((city) => ({
          city_id: city.city_id,
          state_id: city.state_id,
          region_id: city.region_id ?? null,
          entity_region_id: null,
          name: city.name,
          slug: city.slug,
          city_code: city.city_code,
          wikidata_id: null,
          is_official_city: city.is_official_city,
          latitude: city.latitude ?? null,
          longitude: city.longitude ?? null,
          population_2013: null,
          num_settlements: null,
          density_per_km2: null,
          area_km2: city.area_km2 ?? null,
        })),
      });
    }
  }

  console.log(
    `✅ Seeded ${data.states.length} states, ${data.regions.length} regions and ${data.cities.length} cities`,
  );
}

async function syncAdminRegionsFromStates() {
  console.log('➡️  Syncing admin regions from geo_states...');
  const states = await prisma.geo_states.findMany({
    select: {
      state_id: true,
      name: true,
      iso2: true,
    },
  });

  const now = new Date();
  for (const state of states) {
    await prisma.admin_regions.upsert({
      where: { region_id: state.state_id },
      update: {
        name: state.name,
        code: state.iso2 ?? state.state_id.toUpperCase(),
        country: state.name,
        updated_at: now,
      },
      create: {
        region_id: state.state_id,
        name: state.name,
        code: state.iso2 ?? state.state_id.toUpperCase(),
        country: state.name,
        updated_at: now,
      },
    });
  }

  console.log(`✅ Synced ${states.length} admin regions from geo_states`);
}

async function ensureBaselineUsers() {
  console.log('➡️  Ensuring baseline users...');

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
  return { testUser, superGuruUser };
}

async function ensureAdminRegion(superGuruUserId: string) {
  const region = await prisma.admin_regions.upsert({
    where: { code: 'DE-BER' },
    update: {
      name: 'Berlin Region',
      country: 'Germany',
      updated_at: new Date(),
    },
    create: {
      region_id: 'DE-BER',
      name: 'Berlin Region',
      code: 'DE-BER',
      country: 'Germany',
      description: 'Administrative region covering Berlin and surrounding metropolitan area.',
      updated_at: new Date(),
    },
  });

  await prisma.super_guru_assignments.upsert({
    where: {
      user_id_region_id: {
        user_id: superGuruUserId,
        region_id: region.region_id,
      },
    },
    update: {
      is_primary: true,
    },
    create: {
      assignment_id: randomUUID(),
      user_id: superGuruUserId,
      region_id: region.region_id,
      is_primary: true,
      created_by: superGuruUserId,
    },
  });

  console.log('✅ Admin region ready:', region.name);
  return region;
}

async function ensureSampleBranch(
  dataset: GeoSeedDataset,
  adminRegionId: string,
  testUserId: string,
) {
  const berlinCity = dataset.cities.find((city) => city.name === 'Berlin');
  if (!berlinCity) {
    throw new Error('Berlin city not found in geo dataset');
  }

  const berlinRegion = berlinCity.region_id
    ? dataset.regions.find((region) => region.region_id === berlinCity.region_id)
    : undefined;

  const branch = await prisma.family_branches.upsert({
    where: { branch_id: 'FB-DE-BERLIN-001' },
    update: {
      surname: 'Müller',
      surname_normalized: 'MULLER',
      admin_region_id: adminRegionId,
      geo_city_id: berlinCity.city_id,
      city_code: berlinCity.city_code,
      city_name: berlinCity.name,
      country: 'Germany',
      description: 'Müller family rooted in Berlin',
      founded_by: testUserId,
      visibility: 'public',
      updated_at: new Date(),
    },
    create: {
      branch_id: 'FB-DE-BERLIN-001',
      surname: 'Müller',
      surname_normalized: 'MULLER',
      city_code: berlinCity.city_code,
      city_name: berlinCity.name,
      country: 'Germany',
      description: 'Müller family rooted in Berlin',
      founded_by: testUserId,
      visibility: 'public',
      admin_region_id: adminRegionId,
      geo_city_id: berlinCity.city_id,
      updated_at: new Date(),
    },
  });

  console.log('✅ Sample family branch ready:', branch.branch_id);
}

async function main() {
  console.log('🌱 Starting database seed...');

  const geoData = loadGeoData();
  await seedGeoLov(geoData);
  await syncAdminRegionsFromStates();

  const { testUser, superGuruUser } = await ensureBaselineUsers();
  const adminRegion = await ensureAdminRegion(superGuruUser.user_id);
  await ensureSampleBranch(geoData, adminRegion.region_id, testUser.user_id);

  console.log('🎉 Database seed completed!');
}

main()
  .catch((error) => {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
