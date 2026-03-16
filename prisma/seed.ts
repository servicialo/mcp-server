import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Upsert org
  const org = await prisma.organization.upsert({
    where: { slug: 'coordinalo' },
    update: {
      name: 'Coordinalo',
      description: 'Implementación de referencia del protocolo Servicialo.',
      vertical: 'tecnología',
      location: 'Santiago',
      country: 'cl',
      contactEmail: 'hola@coordinalo.com',
      discoverable: true,
      claimedAt: new Date(),
      verifiedAt: new Date(),
    },
    create: {
      slug: 'coordinalo',
      name: 'Coordinalo',
      description: 'Implementación de referencia del protocolo Servicialo.',
      vertical: 'tecnología',
      location: 'Santiago',
      country: 'cl',
      contactEmail: 'hola@coordinalo.com',
      discoverable: true,
      claimedAt: new Date(),
      verifiedAt: new Date(),
    },
  });

  // Upsert providers
  const franco = await prisma.provider.upsert({
    where: { id: 'prov_franco' },
    update: {},
    create: {
      id: 'prov_franco',
      name: 'Franco',
      email: 'franco@coordinalo.com',
      organizationId: org.id,
    },
  });

  const ana = await prisma.provider.upsert({
    where: { id: 'prov_ana' },
    update: {},
    create: {
      id: 'prov_ana',
      name: 'Ana',
      email: 'ana@coordinalo.com',
      organizationId: org.id,
    },
  });

  // Upsert services
  const onboarding = await prisma.service.upsert({
    where: { id: 'svc_onboarding' },
    update: {},
    create: {
      id: 'svc_onboarding',
      name: 'Onboarding de organización',
      description: 'Sesión de configuración inicial para organizaciones que adoptan el protocolo Servicialo.',
      durationMinutes: 60,
      organizationId: org.id,
    },
  });

  const integracion = await prisma.service.upsert({
    where: { id: 'svc_integracion' },
    update: {},
    create: {
      id: 'svc_integracion',
      name: 'Integración técnica',
      description: 'Acompañamiento técnico para integrar Servicialo en sistemas existentes (ERP, CRM, agendamiento).',
      durationMinutes: 90,
      priceAmount: 50000,
      priceCurrency: 'CLP',
      organizationId: org.id,
    },
  });

  // Service-Provider assignments
  for (const [serviceId, providerId] of [
    [onboarding.id, franco.id],
    [onboarding.id, ana.id],
    [integracion.id, franco.id],
  ]) {
    await prisma.serviceProvider.upsert({
      where: { serviceId_providerId: { serviceId, providerId } },
      update: {},
      create: { serviceId, providerId },
    });
  }

  console.log('Seed complete: org=%s, providers=%d, services=%d', org.slug, 2, 2);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
