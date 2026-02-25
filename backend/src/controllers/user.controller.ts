import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { UpdateUserInput } from '../validators/user.validator';

export const userController = {
  async getUsers(_req: Request, res: Response) {
    const users = await userService.getUsers();
    res.json(users);
  },

  async getUserById(req: Request, res: Response) {
    const user = await userService.getUserById(req.params.id as string);
    res.json(user);
  },

  async updateUser(req: Request, res: Response) {
    const input = req.body as UpdateUserInput;
    const user = await userService.updateUser(req.params.id as string, input);
    res.json(user);
  },
};
