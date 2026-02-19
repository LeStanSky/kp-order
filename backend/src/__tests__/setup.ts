// Global mock for database (Prisma)
jest.mock('../config/database', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    stock: {
      upsert: jest.fn(),
    },
    price: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    orderItem: {
      findMany: jest.fn(),
    },
    stockAlert: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    stockAlertHistory: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $queryRaw: jest.fn(),
  };

  return {
    prisma: mockPrisma,
    connectDatabase: jest.fn(),
    disconnectDatabase: jest.fn(),
  };
});

// Global mock for Redis
jest.mock('../config/redis', () => {
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn().mockResolvedValue([]),
    exists: jest.fn(),
    ping: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    status: 'ready',
    connect: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
  };

  return {
    redis: mockRedis,
    connectRedis: jest.fn(),
    disconnectRedis: jest.fn(),
  };
});

// Suppress Winston logging during tests
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));
