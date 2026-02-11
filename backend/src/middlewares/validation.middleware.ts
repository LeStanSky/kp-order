import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '../utils/errors';

type ValidationSource = 'body' | 'query' | 'params';

export function validate(schema: z.ZodSchema, source: ValidationSource = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.') || '_';
        if (!errors[path]) errors[path] = [];
        errors[path].push(issue.message);
      }
      throw new ValidationError('Validation failed', errors);
    }

    if (source === 'body') {
      req.body = result.data;
    } else {
      res.locals[source] = result.data;
    }
    next();
  };
}
