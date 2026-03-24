import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const PRICE_GROUPS = [
  'Прайс основной',
  'Прайс 1 уровень',
  'Прайс 2 уровень',
  'Прайс Спот',
  'Прайс Субы',
  'Прайс Градусы',
  'Прайс Пив.com',
  'Прайс beer.exe',
  'Прайс ХС',
];

const SYNC_GROUPS = [
  'Jaws',
  'Jaws Розлив',
  'Lapochka',
  'Mjolnir',
  'Mjolnir Розлив',
  'Ostrovica',
  'Ostrovica розлив',
  'Бродилка сидры',
  'Бродилка сидры Розлив',
  'Полукультурка сидры',
  'Полукультурка сидры Розлив',
  'Степь и Ветер',
  'Степь и Ветер розлив',
  'Чипсы',
];

async function main() {
  console.log('Seeding...');

  // Price groups
  const priceGroupMap = new Map<string, string>();
  for (const name of PRICE_GROUPS) {
    const pg = await prisma.priceGroup.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    priceGroupMap.set(name, pg.id);
  }
  console.log(`  ${PRICE_GROUPS.length} price groups`);

  // Sync groups
  for (const name of SYNC_GROUPS) {
    await prisma.syncGroup.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }
  console.log(`  ${SYNC_GROUPS.length} sync groups`);

  // Users
  const password = await bcrypt.hash('password123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@erpstock.local' },
    create: {
      email: 'admin@erpstock.local',
      password,
      name: 'Admin',
      role: 'ADMIN',
    },
    update: {},
  });

  await prisma.user.upsert({
    where: { email: 'manager@erpstock.local' },
    create: {
      email: 'manager@erpstock.local',
      password,
      name: 'Manager',
      role: 'MANAGER',
    },
    update: {},
  });

  const spotPriceGroupId = priceGroupMap.get('Прайс Спот')!;
  await prisma.user.upsert({
    where: { email: 'client1@erpstock.local' },
    create: {
      email: 'client1@erpstock.local',
      password,
      name: 'Client Spot',
      role: 'CLIENT',
      priceGroupId: spotPriceGroupId,
    },
    update: {},
  });

  const level1PriceGroupId = priceGroupMap.get('Прайс 1 уровень')!;
  await prisma.user.upsert({
    where: { email: 'client2@erpstock.local' },
    create: {
      email: 'client2@erpstock.local',
      password,
      name: 'Client Level 1',
      role: 'CLIENT',
      priceGroupId: level1PriceGroupId,
    },
    update: {},
  });

  console.log('  4 users (admin, manager, client1/Spot, client2/Level1)');
  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
