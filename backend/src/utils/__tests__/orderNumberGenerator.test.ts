import { generateOrderNumber } from '../orderNumberGenerator';
import { redis } from '../../config/redis';

const mockRedis = redis as jest.Mocked<typeof redis>;

describe('generateOrderNumber', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-15T10:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should generate order number in format ORD-YYYYMMDD-NNN', async () => {
    (mockRedis.incr as jest.Mock).mockResolvedValue(1);
    (mockRedis.expire as jest.Mock).mockResolvedValue(1);

    const result = await generateOrderNumber();

    expect(result).toBe('ORD-20260315-001');
  });

  it('should pad counter to 3 digits', async () => {
    (mockRedis.incr as jest.Mock).mockResolvedValue(42);
    (mockRedis.expire as jest.Mock).mockResolvedValue(1);

    const result = await generateOrderNumber();

    expect(result).toBe('ORD-20260315-042');
  });

  it('should handle counter above 999', async () => {
    (mockRedis.incr as jest.Mock).mockResolvedValue(1234);
    (mockRedis.expire as jest.Mock).mockResolvedValue(1);

    const result = await generateOrderNumber();

    expect(result).toBe('ORD-20260315-1234');
  });

  it('should use correct Redis key with date', async () => {
    (mockRedis.incr as jest.Mock).mockResolvedValue(1);
    (mockRedis.expire as jest.Mock).mockResolvedValue(1);

    await generateOrderNumber();

    expect(mockRedis.incr).toHaveBeenCalledWith('erpstock:order:counter:20260315');
  });

  it('should set TTL of 48 hours on Redis key', async () => {
    (mockRedis.incr as jest.Mock).mockResolvedValue(1);
    (mockRedis.expire as jest.Mock).mockResolvedValue(1);

    await generateOrderNumber();

    expect(mockRedis.expire).toHaveBeenCalledWith('erpstock:order:counter:20260315', 172800);
  });
});
