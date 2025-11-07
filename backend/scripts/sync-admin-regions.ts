import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LEVEL_BY_TYPE: Record<string, number> = {
  state: 1,
  entity: 2,
  district: 2,
  canton: 3,
  municipality: 4,
  province: 2,
  prefectorate: 2,
  nuts2: 2,
  nuts3: 3,
};

function resolveLevel(type?: string | null) {
  if (!type) {
    return 2;
  }
  return LEVEL_BY_TYPE[type.toLowerCase()] ?? 2;
}

async function syncStates(now: Date) {
  const states = await prisma.geoState.findMany({
    select: {
      state_id: true,
      name: true,
      iso2: true,
    },
    orderBy: { name: 'asc' },
  });

  for (const state of states) {
    await prisma.admin_regions.upsert({
      where: { region_id: state.state_id },
      update: {
        name: state.name,
        code: state.iso2 ?? state.state_id.toUpperCase(),
        country: state.name,
        level: 1,
        kind: 'state',
        parent_region_id: null,
        geo_state_id: state.state_id,
        geo_region_id: null,
        updated_at: now,
      },
      create: {
        region_id: state.state_id,
        name: state.name,
        code: state.iso2 ?? state.state_id.toUpperCase(),
        country: state.name,
        level: 1,
        kind: 'state',
        parent_region_id: null,
        geo_state_id: state.state_id,
        geo_region_id: null,
        updated_at: now,
      },
    });
  }

  return new Map(states.map((state) => [state.state_id, state.name]));
}

async function syncRegions(stateNameMap: Map<string, string>, now: Date) {
  const regions = await prisma.geoRegion.findMany({
    select: {
      region_id: true,
      state_id: true,
      parent_region_id: true,
      name: true,
      code: true,
      type: true,
    },
    orderBy: [{ state_id: 'asc' }, { name: 'asc' }],
  });

  const pending = new Map(regions.map((region) => [region.region_id, region]));
  const inserted = new Set<string>(stateNameMap.keys());

  while (pending.size > 0) {
    let progress = false;

    for (const [regionId, region] of pending) {
      const parentId = region.parent_region_id ?? region.state_id;
      if (parentId && !inserted.has(parentId)) {
        continue;
      }

      const stateName = stateNameMap.get(region.state_id) ?? null;
      await prisma.admin_regions.upsert({
        where: { region_id: region.region_id },
        update: {
          name: region.name,
          code: region.code ?? region.region_id.toUpperCase(),
          country: stateName,
          level: resolveLevel(region.type),
          kind: region.type ?? 'region',
          parent_region_id: parentId,
          geo_state_id: region.state_id,
          geo_region_id: region.region_id,
          updated_at: now,
        },
        create: {
          region_id: region.region_id,
          name: region.name,
          code: region.code ?? region.region_id.toUpperCase(),
          country: stateName,
          level: resolveLevel(region.type),
          kind: region.type ?? 'region',
          parent_region_id: parentId,
          geo_state_id: region.state_id,
          geo_region_id: region.region_id,
          updated_at: now,
        },
      });

      inserted.add(region.region_id);
      pending.delete(regionId);
      progress = true;
    }

    if (!progress) {
      console.warn(
        '⚠️ Unable to resolve parent relationships for',
        pending.size,
        'regions. They will be skipped this run.'
      );
      break;
    }
  }

  return inserted.size - stateNameMap.size;
}

async function main() {
  const now = new Date();
  const stateNameMap = await syncStates(now);
  const syncedRegions = await syncRegions(stateNameMap, now);

  console.log(`✅ Synced ${stateNameMap.size} states and ${syncedRegions} sub-regions into admin_regions`);
}

main()
  .catch((error) => {
    console.error('Failed to sync admin regions:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
