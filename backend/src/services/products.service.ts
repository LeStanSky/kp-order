import { UserRole } from '../generated/prisma/client';
import { productRepository } from '../repositories/product.repository';
import { cacheService } from './cache.service';
import { uploadService } from './upload.service';
import { NotFoundError } from '../utils/errors';
import { GetProductsOptions } from '../types/erp.types';

type ExpiryStatus = 'green' | 'blue' | 'yellow' | 'orange' | 'red';

function getExpiryStatus(expiryDate: Date | null): ExpiryStatus | null {
  if (!expiryDate) return null;

  const now = new Date();
  const diff = expiryDate.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return 'red';
  if (days <= 7) return 'orange';
  if (days <= 30) return 'yellow';
  if (days <= 90) return 'blue';
  return 'green';
}

const PRODUCTS_CACHE_TTL = 120; // 2 min
const CATEGORIES_CACHE_TTL = 300; // 5 min

export const productsService = {
  async getProducts(options: GetProductsOptions, userRole: UserRole, priceGroupId?: string | null) {
    const cacheKey = `products:${JSON.stringify(options)}:${userRole}:${priceGroupId ?? 'none'}`;
    const cached = await cacheService.get<any>(cacheKey);
    if (cached) return cached;

    const result = await productRepository.findAll(options, priceGroupId);

    const products = result.products.map((product: any) => {
      const base: any = {
        id: product.id,
        name: product.cleanName,
        description: product.description,
        category: product.category,
        unit: product.unit,
        imageUrl: product.imageUrl,
        isActive: product.isActive,
        stock: (product.stocks as any[]).reduce((sum: number, s: any) => sum + s.quantity, 0),
        prices:
          (product as any).prices?.map((p: any) => ({
            value: p.value,
            currency: p.currency,
            priceGroup: p.priceGroup?.name,
          })) ?? [],
      };

      // MANAGER and ADMIN can see expiry info
      if (userRole === 'MANAGER' || userRole === 'ADMIN') {
        base.expiryDate = product.expiryDate;
        base.expiryStatus = getExpiryStatus(product.expiryDate);
      }

      return base;
    });

    const response = {
      data: products,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };

    await cacheService.set(cacheKey, response, PRODUCTS_CACHE_TTL);
    return response;
  },

  async getProductById(id: string, userRole: UserRole, priceGroupId?: string | null) {
    const product = await productRepository.findById(id, priceGroupId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const base: any = {
      id: product.id,
      name: product.cleanName,
      description: product.description,
      category: product.category,
      unit: product.unit,
      imageUrl: product.imageUrl,
      characteristics: product.characteristics ?? null,
      isActive: product.isActive,
      stock: (product.stocks as any[]).reduce((sum: number, s: any) => sum + s.quantity, 0),
      stocks: product.stocks.map((s: any) => ({
        quantity: s.quantity,
        warehouse: s.warehouse,
      })),
      prices:
        (product as any).prices?.map((p: any) => ({
          value: p.value,
          currency: p.currency,
          priceGroup: p.priceGroup?.name,
        })) ?? [],
    };

    if (userRole === 'MANAGER' || userRole === 'ADMIN') {
      base.expiryDate = product.expiryDate;
      base.expiryStatus = getExpiryStatus(product.expiryDate);
    }

    return base;
  },

  async updateProduct(
    id: string,
    data: { description?: string | null; characteristics?: Record<string, string> },
  ) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const updated = await productRepository.updateById(id, data);
    await cacheService.delByPattern('products:*');
    return updated;
  },

  async uploadImage(id: string, file: Express.Multer.File) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Delete old image if it was a local upload
    const oldFilename = uploadService.filenameFromUrl(product.imageUrl);
    if (oldFilename) {
      uploadService.deleteFile(uploadService.getAbsolutePath(oldFilename));
    }

    const imageUrl = uploadService.getImageUrl(file.filename);
    const updated = await productRepository.updateById(id, { imageUrl });
    await cacheService.delByPattern('products:*');
    return updated;
  },

  async deleteImage(id: string) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const filename = uploadService.filenameFromUrl(product.imageUrl);
    if (filename) {
      uploadService.deleteFile(uploadService.getAbsolutePath(filename));
    }

    const updated = await productRepository.updateById(id, { imageUrl: null });
    await cacheService.delByPattern('products:*');
    return updated;
  },

  async getCategories() {
    const cacheKey = 'categories';
    const cached = await cacheService.get<string[]>(cacheKey);
    if (cached) return cached;

    const categories = await productRepository.getCategories();
    await cacheService.set(cacheKey, categories, CATEGORIES_CACHE_TTL);
    return categories;
  },
};
