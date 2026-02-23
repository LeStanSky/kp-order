import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Delete in FK-safe order
  const alertHistory = await prisma.stockAlertHistory.deleteMany({});
  const alerts = await prisma.stockAlert.deleteMany({});
  const orderItems = await prisma.orderItem.deleteMany({});
  const orders = await prisma.order.deleteMany({});
  const stocks = await prisma.stock.deleteMany({});
  const prices = await prisma.price.deleteMany({});
  const products = await prisma.product.deleteMany({});
  console.log(
    `Deleted: ${products.count} products, ${stocks.count} stocks, ${prices.count} prices, ` +
      `${orderItems.count} orderItems, ${orders.count} orders, ` +
      `${alerts.count} stockAlerts, ${alertHistory.count} alertHistory`,
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
