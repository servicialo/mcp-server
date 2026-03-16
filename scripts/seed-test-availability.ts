import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findUnique({
    where: { slug: 'coordinalo' },
    include: { providers: true },
  });

  if (!org) {
    console.log('No coordinalo org found');
    return;
  }

  console.log('Providers:', org.providers.map(p => ({ id: p.id, name: p.name })));

  const provider = org.providers[0];
  if (!provider) {
    console.log('No providers');
    return;
  }

  // Seed Mon-Fri 17:00-19:00
  for (let dow = 1; dow <= 5; dow++) {
    await prisma.providerAvailability.upsert({
      where: {
        providerId_dayOfWeek_startTime: {
          providerId: provider.id,
          dayOfWeek: dow,
          startTime: '17:00',
        },
      },
      create: {
        providerId: provider.id,
        dayOfWeek: dow,
        startTime: '17:00',
        endTime: '19:00',
        timezone: 'America/Santiago',
      },
      update: {},
    });
  }

  console.log(`Seeded availability for ${provider.name}: 17:00-19:00 Mon-Fri`);
  await prisma.$disconnect();
}

main();
