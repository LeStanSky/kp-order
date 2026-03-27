import { prisma } from '../../config/database';
import { productRepository } from '../product.repository';

const db = prisma as jest.Mocked<typeof prisma>;

describe('ProductRepository', () => {
  describe('findAll', () => {
    it('should filter by stocks with quantity > 0', async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([]);
      (db.product.count as jest.Mock).mockResolvedValue(0);

      await productRepository.findAll({
        page: 1,
        limit: 20,
        sortBy: 'cleanName',
        sortOrder: 'asc',
      });

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            stocks: { some: { quantity: { gt: 0 } } },
          }),
        }),
      );
    });

    it('should exclude expired products', async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([]);
      (db.product.count as jest.Mock).mockResolvedValue(0);

      await productRepository.findAll({
        page: 1,
        limit: 20,
        sortBy: 'cleanName',
        sortOrder: 'asc',
      });

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ expiryDate: null }, { expiryDate: { gte: expect.any(Date) } }],
          }),
        }),
      );
    });

    it('should show only expired products when expired=true', async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([]);
      (db.product.count as jest.Mock).mockResolvedValue(0);

      await productRepository.findAll({
        page: 1,
        limit: 20,
        sortBy: 'cleanName',
        sortOrder: 'asc',
        expired: true,
      });

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            expiryDate: { lt: expect.any(Date) },
          }),
        }),
      );
      // Should NOT have OR filter
      const where = (db.product.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.OR).toBeUndefined();
    });

    it('should filter by search term', async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([]);
      (db.product.count as jest.Mock).mockResolvedValue(0);

      await productRepository.findAll({
        page: 1,
        limit: 20,
        search: 'Jaws',
        sortBy: 'cleanName',
        sortOrder: 'asc',
      });

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            cleanName: { contains: 'Jaws', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should filter by category', async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([]);
      (db.product.count as jest.Mock).mockResolvedValue(0);

      await productRepository.findAll({
        page: 1,
        limit: 20,
        category: 'Jaws',
        sortBy: 'cleanName',
        sortOrder: 'asc',
      });

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'Jaws',
          }),
        }),
      );
    });

    it('should use priceGroupId for price filtering', async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([]);
      (db.product.count as jest.Mock).mockResolvedValue(0);

      await productRepository.findAll(
        { page: 1, limit: 20, sortBy: 'cleanName', sortOrder: 'asc' },
        'pg-1',
      );

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            prices: expect.objectContaining({
              where: { priceGroupId: 'pg-1' },
            }),
          }),
        }),
      );
    });

    it('should calculate pagination correctly', async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([]);
      (db.product.count as jest.Mock).mockResolvedValue(50);

      const result = await productRepository.findAll({
        page: 3,
        limit: 10,
        sortBy: 'cleanName',
        sortOrder: 'asc',
      });

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
      expect(result).toEqual({
        products: [],
        total: 50,
        page: 3,
        limit: 10,
        totalPages: 5,
      });
    });
  });

  describe('getCategories', () => {
    it('should return categories with stock and non-expired', async () => {
      (db.product.findMany as jest.Mock).mockResolvedValue([
        { category: 'Jaws' },
        { category: 'Ostrovica' },
      ]);

      const result = await productRepository.getCategories();

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            category: { not: null },
            stocks: { some: { quantity: { gt: 0 } } },
            OR: [{ expiryDate: null }, { expiryDate: { gte: expect.any(Date) } }],
          }),
          distinct: ['category'],
        }),
      );
      expect(result).toEqual(['Jaws', 'Ostrovica']);
    });
  });

  describe('updateById', () => {
    it('should call prisma.product.update with correct args', async () => {
      const mockProduct = { id: 'prod-1', name: 'Beer', description: 'Updated' };
      (db.product.update as jest.Mock).mockResolvedValue(mockProduct);

      const result = await productRepository.updateById('prod-1', {
        description: 'Updated',
      });

      expect(db.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { description: 'Updated' },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should update characteristics', async () => {
      const chars = { volume: '500мл', abv: '4.5%' };
      const mockProduct = { id: 'prod-1', characteristics: chars };
      (db.product.update as jest.Mock).mockResolvedValue(mockProduct);

      const result = await productRepository.updateById('prod-1', {
        characteristics: chars,
      });

      expect(db.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { characteristics: chars },
      });
      expect(result.characteristics).toEqual(chars);
    });

    it('should update imageUrl', async () => {
      const mockProduct = { id: 'prod-1', imageUrl: '/uploads/123.jpg' };
      (db.product.update as jest.Mock).mockResolvedValue(mockProduct);

      const result = await productRepository.updateById('prod-1', {
        imageUrl: '/uploads/123.jpg',
      });

      expect(db.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { imageUrl: '/uploads/123.jpg' },
      });
      expect(result.imageUrl).toBe('/uploads/123.jpg');
    });

    it('should update multiple fields at once', async () => {
      const data = {
        description: 'New desc',
        characteristics: { style: 'IPA' },
        imageUrl: '/uploads/img.png',
      };
      const mockProduct = { id: 'prod-1', ...data };
      (db.product.update as jest.Mock).mockResolvedValue(mockProduct);

      await productRepository.updateById('prod-1', data);

      expect(db.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data,
      });
    });

    it('should clear imageUrl with null', async () => {
      const mockProduct = { id: 'prod-1', imageUrl: null };
      (db.product.update as jest.Mock).mockResolvedValue(mockProduct);

      const result = await productRepository.updateById('prod-1', {
        imageUrl: null,
      });

      expect(db.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { imageUrl: null },
      });
      expect(result.imageUrl).toBeNull();
    });
  });
});
