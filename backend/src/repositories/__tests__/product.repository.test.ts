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
