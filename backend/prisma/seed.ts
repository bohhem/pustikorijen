import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@pustikorijen.ba' },
    update: {},
    create: {
      email: 'test@pustikorijen.ba',
      passwordHash: '$2a$10$YourHashedPasswordHere', // Replace with actual hashed password
      fullName: 'Test User',
      emailVerified: true,
      preferredLanguage: 'bs',
    },
  });

  console.log('✅ Created test user:', testUser.email);

  // Create sample family branch
  const sampleBranch = await prisma.familyBranch.upsert({
    where: { id: 'FB-SA-HODZIC-001' },
    update: {},
    create: {
      id: 'FB-SA-HODZIC-001',
      surname: 'Hodžić',
      surnameNormalized: 'HODZIC',
      cityCode: 'SA',
      cityName: 'Sarajevo',
      region: 'Sarajevski kanton',
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
