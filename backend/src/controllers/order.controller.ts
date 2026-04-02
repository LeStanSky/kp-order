import { Request, Response } from 'express';
import { orderService } from '../services/order.service';
import { CreateOrderInput, GetOrdersQuery } from '../validators/order.validator';

export const orderController = {
  async createOrder(req: Request, res: Response) {
    const input = req.body as CreateOrderInput;
    const order = await orderService.createOrder(req.user!.id, input);
    res.status(201).json(order);
  },

  async getOrders(req: Request, res: Response) {
    const query = res.locals.query as GetOrdersQuery;
    const result = await orderService.getOrders({ id: req.user!.id, role: req.user!.role }, query);
    res.json(result);
  },

  async getOrderById(req: Request, res: Response) {
    const order = await orderService.getOrderById(req.params.id as string, {
      id: req.user!.id,
      role: req.user!.role,
    });
    res.json(order);
  },

  async cancelOrder(req: Request, res: Response) {
    const order = await orderService.cancelOrder(req.params.id as string, {
      id: req.user!.id,
      role: req.user!.role,
    });
    res.json(order);
  },

  async repeatOrder(req: Request, res: Response) {
    const order = await orderService.repeatOrder(
      req.params.id as string,
      { id: req.user!.id, role: req.user!.role },
      req.body?.comment,
    );
    res.status(201).json(order);
  },

  async deleteOrder(req: Request, res: Response) {
    await orderService.deleteOrder(req.params.id as string, {
      id: req.user!.id,
      role: req.user!.role,
    });
    res.status(204).send();
  },
};
