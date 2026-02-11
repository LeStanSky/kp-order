import { Request, Response } from 'express';
import { productsService } from '../services/products.service';
import { GetProductsQuery } from '../validators/product.validator';

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
    const result = await productsService.getProductById(
      req.params.id as string,
      req.user!.role,
      req.user!.priceGroupId,
    );
    res.json(result);
  },

  async getCategories(_req: Request, res: Response) {
    const categories = await productsService.getCategories();
    res.json({ data: categories });
  },
};
