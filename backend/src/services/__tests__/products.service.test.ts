import { productsService } from '../products.service';
import { productRepository } from '../../repositories/product.repository';
import { cacheService } from '../cache.service';
import { uploadService } from '../upload.service';
import { NotFoundError } from '../../utils/errors';

jest.mock('../../repositories/product.repository');
jest.mock('../cache.service');
jest.mock('../upload.service');

const mockRepo = productRepository as jest.Mocked<typeof productRepository>;
const mockCache = cacheService as jest.Mocked<typeof cacheService>;
const mockUpload = uploadService as jest.Mocked<typeof uploadService>;

const sampleProduct = {
  id: 'prod-1',
  externalId: 'ext-1',
  name: 'Beer / 2026-06-01',
  cleanName: 'Beer',
  description: 'Tasty beer',
  category: 'Drinks',
  unit: 'шт',
  imageUrl: null,
  characteristics: null,
  isActive: true,
  expiryDate: new Date('2026-06-01'),
  createdAt: new Date(),
  updatedAt: new Date(),
  stocks: [{ quantity: 10, warehouse: 'Main' }],
  prices: [{ value: 100, currency: 'RUB', priceGroup: { name: 'Retail' } }],
};

describe('ProductsService', () => {
  describe('getProducts', () => {
    it('should fetch allowedCategories and pass to repository', async () => {
      mockCache.get.mockResolvedValue(null);
      mockCache.set.mockResolvedValue(undefined);
      mockRepo.getAllowedCategories.mockResolvedValue(['Jaws', 'Jaws розлив']);
      mockRepo.findAll.mockResolvedValue({
        products: [sampleProduct] as any,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const options = { page: 1, limit: 20, sortBy: 'cleanName', sortOrder: 'asc' as const };
      await productsService.getProducts(options, 'CLIENT', 'pg-suby');

      expect(mockRepo.getAllowedCategories).toHaveBeenCalledWith('pg-suby');
      expect(mockRepo.findAll).toHaveBeenCalledWith(options, 'pg-suby', ['Jaws', 'Jaws розлив']);
    });

    it('should not fetch allowedCategories when no priceGroupId', async () => {
      mockCache.get.mockResolvedValue(null);
      mockCache.set.mockResolvedValue(undefined);
      mockRepo.findAll.mockResolvedValue({
        products: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      const options = { page: 1, limit: 20, sortBy: 'cleanName', sortOrder: 'asc' as const };
      await productsService.getProducts(options, 'ADMIN', null);

      expect(mockRepo.getAllowedCategories).not.toHaveBeenCalled();
      expect(mockRepo.findAll).toHaveBeenCalledWith(options, null, []);
    });
  });

  describe('getCategories', () => {
    it('should filter categories by allowedCategories when priceGroupId provided', async () => {
      mockCache.get.mockResolvedValue(null);
      mockCache.set.mockResolvedValue(undefined);
      mockRepo.getAllowedCategories.mockResolvedValue(['Jaws']);
      mockRepo.getCategories.mockResolvedValue(['Jaws']);

      const result = await productsService.getCategories('pg-suby');

      expect(mockRepo.getAllowedCategories).toHaveBeenCalledWith('pg-suby');
      expect(mockRepo.getCategories).toHaveBeenCalledWith(['Jaws']);
      expect(result).toEqual(['Jaws']);
    });

    it('should return all categories when no priceGroupId', async () => {
      mockCache.get.mockResolvedValue(null);
      mockCache.set.mockResolvedValue(undefined);
      mockRepo.getCategories.mockResolvedValue(['Jaws', 'Ostrovica']);

      const result = await productsService.getCategories(null);

      expect(mockRepo.getAllowedCategories).not.toHaveBeenCalled();
      expect(mockRepo.getCategories).toHaveBeenCalledWith([]);
      expect(result).toEqual(['Jaws', 'Ostrovica']);
    });

    it('should use per-priceGroup cache key', async () => {
      mockCache.get.mockResolvedValue(null);
      mockCache.set.mockResolvedValue(undefined);
      mockRepo.getAllowedCategories.mockResolvedValue([]);
      mockRepo.getCategories.mockResolvedValue(['Jaws']);

      await productsService.getCategories('pg-1');

      expect(mockCache.get).toHaveBeenCalledWith('categories:pg-1');
      expect(mockCache.set).toHaveBeenCalledWith('categories:pg-1', ['Jaws'], 300);
    });
  });

  describe('updateProduct', () => {
    it('should update description and invalidate cache', async () => {
      mockRepo.findById.mockResolvedValue(sampleProduct as any);
      mockRepo.updateById.mockResolvedValue({
        ...sampleProduct,
        description: 'New desc',
      } as any);
      mockCache.delByPattern.mockResolvedValue(undefined);

      const result = await productsService.updateProduct('prod-1', {
        description: 'New desc',
      });

      expect(mockRepo.findById).toHaveBeenCalledWith('prod-1');
      expect(mockRepo.updateById).toHaveBeenCalledWith('prod-1', {
        description: 'New desc',
      });
      expect(mockCache.delByPattern).toHaveBeenCalledWith('products:*');
      expect(result.description).toBe('New desc');
    });

    it('should update characteristics', async () => {
      const chars = { volume: '500мл', abv: '4.5%' };
      mockRepo.findById.mockResolvedValue(sampleProduct as any);
      mockRepo.updateById.mockResolvedValue({
        ...sampleProduct,
        characteristics: chars,
      } as any);
      mockCache.delByPattern.mockResolvedValue(undefined);

      const result = await productsService.updateProduct('prod-1', {
        characteristics: chars,
      });

      expect(mockRepo.updateById).toHaveBeenCalledWith('prod-1', {
        characteristics: chars,
      });
      expect(result.characteristics).toEqual(chars);
    });

    it('should throw NotFoundError for non-existent product', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        productsService.updateProduct('non-existent', { description: 'test' }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('uploadImage', () => {
    it('should update imageUrl and invalidate cache', async () => {
      const mockFile = { filename: 'abc123.jpg' } as Express.Multer.File;
      mockRepo.findById.mockResolvedValue(sampleProduct as any);
      mockUpload.getImageUrl.mockReturnValue('/uploads/abc123.jpg');
      mockUpload.filenameFromUrl.mockReturnValue(null);
      mockRepo.updateById.mockResolvedValue({
        ...sampleProduct,
        imageUrl: '/uploads/abc123.jpg',
      } as any);
      mockCache.delByPattern.mockResolvedValue(undefined);

      const result = await productsService.uploadImage('prod-1', mockFile);

      expect(mockRepo.updateById).toHaveBeenCalledWith('prod-1', {
        imageUrl: '/uploads/abc123.jpg',
      });
      expect(mockCache.delByPattern).toHaveBeenCalledWith('products:*');
      expect(result.imageUrl).toBe('/uploads/abc123.jpg');
    });

    it('should delete old image when replacing', async () => {
      const productWithImage = { ...sampleProduct, imageUrl: '/uploads/old.jpg' };
      const mockFile = { filename: 'new.jpg' } as Express.Multer.File;
      mockRepo.findById.mockResolvedValue(productWithImage as any);
      mockUpload.getImageUrl.mockReturnValue('/uploads/new.jpg');
      mockUpload.filenameFromUrl.mockReturnValue('old.jpg');
      mockUpload.getAbsolutePath.mockReturnValue('/abs/path/old.jpg');
      mockRepo.updateById.mockResolvedValue({
        ...productWithImage,
        imageUrl: '/uploads/new.jpg',
      } as any);
      mockCache.delByPattern.mockResolvedValue(undefined);

      await productsService.uploadImage('prod-1', mockFile);

      expect(mockUpload.deleteFile).toHaveBeenCalledWith('/abs/path/old.jpg');
    });

    it('should throw NotFoundError for non-existent product', async () => {
      const mockFile = { filename: 'abc.jpg' } as Express.Multer.File;
      mockRepo.findById.mockResolvedValue(null);

      await expect(productsService.uploadImage('non-existent', mockFile)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('deleteImage', () => {
    it('should clear imageUrl and delete file', async () => {
      const productWithImage = { ...sampleProduct, imageUrl: '/uploads/img.jpg' };
      mockRepo.findById.mockResolvedValue(productWithImage as any);
      mockUpload.filenameFromUrl.mockReturnValue('img.jpg');
      mockUpload.getAbsolutePath.mockReturnValue('/abs/path/img.jpg');
      mockRepo.updateById.mockResolvedValue({
        ...productWithImage,
        imageUrl: null,
      } as any);
      mockCache.delByPattern.mockResolvedValue(undefined);

      const result = await productsService.deleteImage('prod-1');

      expect(mockUpload.deleteFile).toHaveBeenCalledWith('/abs/path/img.jpg');
      expect(mockRepo.updateById).toHaveBeenCalledWith('prod-1', { imageUrl: null });
      expect(mockCache.delByPattern).toHaveBeenCalledWith('products:*');
      expect(result.imageUrl).toBeNull();
    });

    it('should throw NotFoundError for non-existent product', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(productsService.deleteImage('non-existent')).rejects.toThrow(NotFoundError);
    });

    it('should handle product with no image (no-op for file delete)', async () => {
      mockRepo.findById.mockResolvedValue(sampleProduct as any);
      mockUpload.filenameFromUrl.mockReturnValue(null);
      mockRepo.updateById.mockResolvedValue({ ...sampleProduct, imageUrl: null } as any);
      mockCache.delByPattern.mockResolvedValue(undefined);

      const result = await productsService.deleteImage('prod-1');

      expect(mockUpload.deleteFile).not.toHaveBeenCalled();
      expect(result.imageUrl).toBeNull();
    });
  });

  describe('getProductById (characteristics in response)', () => {
    it('should include characteristics in response', async () => {
      const productWithChars = {
        ...sampleProduct,
        characteristics: { volume: '500мл' },
      };
      mockRepo.findById.mockResolvedValue(productWithChars as any);

      const result = await productsService.getProductById('prod-1', 'ADMIN');

      expect(result.characteristics).toEqual({ volume: '500мл' });
    });

    it('should return null characteristics when not set', async () => {
      mockRepo.findById.mockResolvedValue(sampleProduct as any);

      const result = await productsService.getProductById('prod-1', 'CLIENT');

      expect(result.characteristics).toBeNull();
    });
  });
});
