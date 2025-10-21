import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create baseline users
  const testUser = await prisma.user.upsert({
    where: { email: 'test@pustikorijen.ba' },
    update: {
      passwordHash: '$2a$10$HQl5tXaiy98MAZtHwOISsOt64uXdtGNW8Hhk.CC4HxFIlNofZ15mK',
    },
    create: {
      email: 'test@pustikorijen.ba',
      passwordHash: '$2a$10$HQl5tXaiy98MAZtHwOISsOt64uXdtGNW8Hhk.CC4HxFIlNofZ15mK',
      fullName: 'Test User',
      emailVerified: true,
      preferredLanguage: 'bs',
    },
  });

  const superGuruUser = await prisma.user.upsert({
    where: { email: 'superguru@pustikorijen.ba' },
    update: {
      passwordHash: '$2a$10$HQl5tXaiy98MAZtHwOISsOt64uXdtGNW8Hhk.CC4HxFIlNofZ15mK',
      globalRole: 'SUPER_GURU',
      emailVerified: true,
    },
    create: {
      email: 'superguru@pustikorijen.ba',
      passwordHash: '$2a$10$HQl5tXaiy98MAZtHwOISsOt64uXdtGNW8Hhk.CC4HxFIlNofZ15mK',
      fullName: 'Super Guru',
      emailVerified: true,
      preferredLanguage: 'en',
      globalRole: 'SUPER_GURU',
    },
  });

  console.log('✅ Users ready:', testUser.email, superGuruUser.email);

  // Create administrative region
  const sarajevoRegion = await prisma.adminRegion.upsert({
    where: { code: 'BA-SAR' },
    update: {},
    create: {
      name: 'Sarajevo Canton',
      code: 'BA-SAR',
      country: 'Bosnia and Herzegovina',
      description: 'Administrative region covering Sarajevo and surrounding municipalities.',
    },
  });

  console.log('✅ Admin region ready:', sarajevoRegion.name);

  // Assign SuperGuru to region
  await prisma.superGuruAssignment.upsert({
    where: {
      userId_regionId: {
        userId: superGuruUser.id,
        regionId: sarajevoRegion.id,
      },
    },
    update: {
      isPrimary: true,
    },
    create: {
      userId: superGuruUser.id,
      regionId: sarajevoRegion.id,
      isPrimary: true,
      createdById: superGuruUser.id,
    },
  });

  // Create sample family branch linked to admin region
  const sampleBranch = await prisma.familyBranch.upsert({
    where: { id: 'FB-SA-HODZIC-001' },
    update: {
      adminRegionId: sarajevoRegion.id,
    },
    create: {
      id: 'FB-SA-HODZIC-001',
      surname: 'Hodžić',
      surnameNormalized: 'HODZIC',
      cityCode: 'SA',
      cityName: 'Sarajevo',
      region: 'Sarajevski kanton',
      adminRegionId: sarajevoRegion.id,
      country: 'Bosnia and Herzegovina',
      description: 'Hodžić family from Sarajevo',
      foundedById: testUser.id,
      visibility: 'public',
    },
  });

  console.log('✅ Created sample family branch:', sampleBranch.id);

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
