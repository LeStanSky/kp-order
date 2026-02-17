import { redis } from '../config/redis';

export async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const dateStr =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');

  const key = `erpstock:order:counter:${dateStr}`;
  const counter = await redis.incr(key);
  await redis.expire(key, 172800); // 48 hours TTL

  const paddedCounter = counter.toString().padStart(3, '0');
  return `ORD-${dateStr}-${paddedCounter}`;
}
