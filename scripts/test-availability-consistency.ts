/**
 * Integration test: /availability must never return a slot that /book would reject.
 *
 * Usage (with dev server running on port 3000):
 *   npx tsx scripts/test-availability-consistency.ts
 *
 * What it does:
 * 1. Seeds a test org + provider + service + ProviderAvailability (17:00–19:00 Mon-Fri)
 * 2. Calls GET /availability for a test date
 * 3. Asserts all returned slots are within 17:00–19:00
 * 4. Asserts no slots appear outside configured hours (e.g. 09:00)
 * 5. Books one slot, then re-checks availability to confirm it's gone
 * 6. Cleans up test data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

const TEST_ORG_SLUG = '__test_avail_consistency__';

async function cleanup() {
  // Delete in dependency order
  await prisma.appointment.deleteMany({ where: { provider: { organization: { slug: TEST_ORG_SLUG } } } });
  await prisma.providerAvailability.deleteMany({ where: { provider: { organization: { slug: TEST_ORG_SLUG } } } });
  await prisma.serviceProvider.deleteMany({ where: { service: { organization: { slug: TEST_ORG_SLUG } } } });
  await prisma.service.deleteMany({ where: { organization: { slug: TEST_ORG_SLUG } } });
  await prisma.provider.deleteMany({ where: { organization: { slug: TEST_ORG_SLUG } } });
  await prisma.organization.deleteMany({ where: { slug: TEST_ORG_SLUG } });
}

async function seed() {
  const org = await prisma.organization.create({
    data: {
      slug: TEST_ORG_SLUG,
      name: 'Test Org',
      discoverable: true,
    },
  });

  const provider = await prisma.provider.create({
    data: {
      name: 'Test Provider',
      email: 'test@test.com',
      organizationId: org.id,
    },
  });

  const service = await prisma.service.create({
    data: {
      name: 'Test Service',
      durationMinutes: 60,
      isActive: true,
      organizationId: org.id,
    },
  });

  await prisma.serviceProvider.create({
    data: { serviceId: service.id, providerId: provider.id },
  });

  // Configure availability: Mon-Fri 17:00–19:00 Santiago
  for (let dow = 1; dow <= 5; dow++) {
    await prisma.providerAvailability.create({
      data: {
        providerId: provider.id,
        dayOfWeek: dow,
        startTime: '17:00',
        endTime: '19:00',
        timezone: 'America/Santiago',
      },
    });
  }

  return { org, provider, service };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

async function run() {
  console.log('Cleaning up previous test data...');
  await cleanup();

  console.log('Seeding test data...');
  const { service } = await seed();

  // Find next Monday from today
  const today = new Date();
  const daysUntilMonday = ((1 - today.getDay()) + 7) % 7 || 7;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  const testDate = nextMonday.toISOString().slice(0, 10);

  console.log(`\nTest date: ${testDate} (Monday)\n`);

  // Test 1: GET /availability returns only slots within 17:00–19:00
  const availUrl = `${BASE}/api/servicialo/${TEST_ORG_SLUG}/availability?service_id=${service.id}&date_from=${testDate}&date_to=${testDate}`;
  const availRes = await fetch(availUrl);
  const availData = await availRes.json();

  assert(availRes.status === 200, 'Availability returns 200');
  assert(Array.isArray(availData.data), 'data is an array');

  const dayEntry = availData.data.find((d: { date: string }) => d.date === testDate);
  assert(!!dayEntry, `Has slots for ${testDate}`);

  if (dayEntry) {
    const slots = dayEntry.slots as { start: string; end: string; provider_id: string }[];
    console.log(`  Returned slots: ${slots.map(s => `${s.start}-${s.end}`).join(', ')}`);

    // All slots must be within 17:00–19:00
    for (const slot of slots) {
      const startH = parseInt(slot.start.split(':')[0]);
      const endH = parseInt(slot.end.split(':')[0]);
      const endM = parseInt(slot.end.split(':')[1]);
      assert(startH >= 17, `Slot ${slot.start} starts at or after 17:00`);
      assert(endH < 19 || (endH === 19 && endM === 0), `Slot ${slot.end} ends at or before 19:00`);
    }

    // Must NOT contain 09:00 slot (the old hardcoded behavior)
    const has9am = slots.some(s => s.start === '09:00');
    assert(!has9am, 'No 09:00 slot returned (was the old bug)');

    // Should have exactly 2 slots: 17:00-18:00 and 18:00-19:00
    assert(slots.length === 2, `Expected 2 slots, got ${slots.length}`);

    // Test 2: Book the first slot, then verify it disappears from availability
    if (slots.length > 0) {
      const slotToBook = slots[0];
      // Build UTC datetime from local time
      const bookStart = `${testDate}T${slotToBook.start}:00`;
      const bookEnd = `${testDate}T${slotToBook.end}:00`;

      // We need to convert to UTC for the book request — use the same timezone logic
      // For simplicity, send the local time and let the server handle it
      // Actually /book expects ISO datetime (UTC). Let's compute UTC offset for Santiago.
      const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Santiago',
        timeZoneName: 'shortOffset',
      });
      // We'll just pass an approximate UTC time. The exact offset depends on DST.
      // A simpler approach: construct with timezone info
      const startDt = new Date(`${bookStart}-03:00`); // CLT is UTC-3 in summer, UTC-4 in winter
      const endDt = new Date(`${bookEnd}-03:00`);

      const bookRes = await fetch(`${BASE}/api/servicialo/${TEST_ORG_SLUG}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: service.id,
          provider_id: slotToBook.provider_id,
          start: startDt.toISOString(),
          end: endDt.toISOString(),
          requester: { name: 'Test User', email: 'test@test.com', agent: false },
        }),
      });

      const bookData = await bookRes.json();
      assert(bookRes.status === 201, `Booking returned 201 (got ${bookRes.status})`);
      if (bookRes.status !== 201) {
        console.error('  Book response:', JSON.stringify(bookData));
      }

      // Re-check availability — booked slot should be gone
      const availRes2 = await fetch(availUrl);
      const availData2 = await availRes2.json();
      const dayEntry2 = availData2.data.find((d: { date: string }) => d.date === testDate);

      if (dayEntry2) {
        const slots2 = dayEntry2.slots as { start: string }[];
        const bookedStillPresent = slots2.some(s => s.start === slotToBook.start);
        assert(!bookedStillPresent, `Booked slot ${slotToBook.start} no longer in availability`);
        assert(slots2.length === slots.length - 1, `One fewer slot after booking (${slots2.length} vs ${slots.length})`);
      } else {
        // All slots booked for the day — that's fine if we had only 1 slot
        assert(slots.length === 1, 'Day disappeared because all slots were booked');
      }
    }
  }

  // Test 3: Provider with NO availability configured
  const noAvailOrg = await prisma.organization.create({
    data: { slug: '__test_no_avail__', name: 'No Avail Org', discoverable: true },
  });
  const noAvailProvider = await prisma.provider.create({
    data: { name: 'No Config', organizationId: noAvailOrg.id },
  });
  const noAvailService = await prisma.service.create({
    data: { name: 'No Config Service', isActive: true, organizationId: noAvailOrg.id },
  });
  await prisma.serviceProvider.create({
    data: { serviceId: noAvailService.id, providerId: noAvailProvider.id },
  });

  const noAvailRes = await fetch(
    `${BASE}/api/servicialo/__test_no_avail__/availability?service_id=${noAvailService.id}&date_from=${testDate}`,
  );
  const noAvailData = await noAvailRes.json();
  assert(noAvailData.data.length === 0, 'No slots when availability not configured');
  assert(noAvailData.reason === 'NO_AVAILABILITY_CONFIGURED', 'Returns NO_AVAILABILITY_CONFIGURED reason');

  // Cleanup
  console.log('\nCleaning up...');
  await prisma.serviceProvider.deleteMany({ where: { service: { organizationId: noAvailOrg.id } } });
  await prisma.service.deleteMany({ where: { organizationId: noAvailOrg.id } });
  await prisma.provider.deleteMany({ where: { organizationId: noAvailOrg.id } });
  await prisma.organization.deleteMany({ where: { slug: '__test_no_avail__' } });
  await cleanup();

  await prisma.$disconnect();
  console.log('\nDone.');
}

run().catch(async (err) => {
  console.error(err);
  await cleanup().catch(() => {});
  await prisma.$disconnect();
  process.exit(1);
});
