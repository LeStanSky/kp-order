import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const total = await prisma.product.count();
  console.log('Total products:', total);

  // Show unit distribution
  const units = await prisma.$queryRaw<{ unit: string; count: bigint }[]>`
    SELECT unit, COUNT(*) as count FROM products GROUP BY unit ORDER BY count DESC
  `;
  console.log('\nUnit distribution:');
  units.forEach((r) => console.log(`  ${r.unit ?? 'NULL'}: ${r.count}`));

  // Show sample PET KEG products
  const kegs = await prisma.product.findMany({
    where: { cleanName: { contains: 'PET KEG', mode: 'insensitive' } },
    select: { cleanName: true, unit: true },
    take: 5,
  });
  console.log('\nSample PET KEG products:');
  kegs.forEach((p) => console.log(`  [${p.unit ?? 'NULL'}] ${p.cleanName}`));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
