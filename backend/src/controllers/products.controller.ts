import { Request, Response } from 'express';
import { productsService } from '../services/products.service';
import { GetProductsQuery, UpdateProductBody } from '../validators/product.validator';
import { BadRequestError } from '../utils/errors';

export const productsController = {
  async getProducts(req: Request, res: Response) {
    const options = res.locals.query as GetProductsQuery;
    const result = await productsService.getProducts(
      options,
      req.user!.role,
      req.user!.priceGroupId,
    );
    res.json(result);
  },

  async getProductById(req: Request, res: Response) {
    const { id } = res.locals.params as { id: string };
    const result = await productsService.getProductById(id, req.user!.role, req.user!.priceGroupId);
    res.json(result);
  },

  async getCategories(_req: Request, res: Response) {
    const categories = await productsService.getCategories();
    res.json({ data: categories });
  },

  async updateProduct(req: Request, res: Response) {
    const { id } = res.locals.params as { id: string };
    const data = req.body as UpdateProductBody;
    const result = await productsService.updateProduct(id, data);
    res.json(result);
  },

  async uploadImage(req: Request, res: Response) {
    const { id } = res.locals.params as { id: string };
    if (!req.file) {
      throw new BadRequestError('No image file provided');
    }
    const result = await productsService.uploadImage(id, req.file);
    res.json(result);
  },

  async deleteImage(req: Request, res: Response) {
    const { id } = res.locals.params as { id: string };
    const result = await productsService.deleteImage(id);
    res.json(result);
  },
};
