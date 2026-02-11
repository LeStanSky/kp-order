import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../validation.middleware';
import { ValidationError } from '../../utils/errors';

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    query: {},
    params: {},
    ...overrides,
  } as unknown as Request;
}

function mockRes(): Response {
  const res = {
    locals: {},
  } as unknown as Response;
  return res;
}

describe('validate middleware', () => {
  const testSchema = z.object({
    name: z.string().min(1),
    age: z.coerce.number().int().min(0),
  });

  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    next = jest.fn();
  });

  describe('body validation', () => {
    it('should update req.body with parsed data and call next on success', () => {
      const req = mockReq({ body: { name: 'John', age: '25' } });
      const res = mockRes();

      validate(testSchema, 'body')(req, res, next);

      expect(req.body).toEqual({ name: 'John', age: 25 });
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should throw ValidationError on invalid data', () => {
      const req = mockReq({ body: { name: '', age: -1 } });
      const res = mockRes();

      expect(() => validate(testSchema, 'body')(req, res, next)).toThrow(ValidationError);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('query validation', () => {
    it('should set res.locals.query with parsed data', () => {
      const req = mockReq({ query: { name: 'John', age: '25' } });
      const res = mockRes();

      validate(testSchema, 'query')(req, res, next);

      expect(res.locals.query).toEqual({ name: 'John', age: 25 });
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should throw ValidationError on invalid query', () => {
      const req = mockReq({ query: {} });
      const res = mockRes();

      expect(() => validate(testSchema, 'query')(req, res, next)).toThrow(ValidationError);
    });
  });

  describe('params validation', () => {
    it('should set res.locals.params with parsed data', () => {
      const paramsSchema = z.object({ id: z.string().min(1) });
      const req = mockReq({ params: { id: 'abc123' } });
      const res = mockRes();

      validate(paramsSchema, 'params')(req, res, next);

      expect(res.locals.params).toEqual({ id: 'abc123' });
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  it('should include field paths in ValidationError.errors', () => {
    const req = mockReq({ body: {} });
    const res = mockRes();

    try {
      validate(testSchema, 'body')(req, res, next);
      fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      const ve = err as ValidationError;
      expect(ve.errors).toHaveProperty('name');
      expect(ve.errors).toHaveProperty('age');
    }
  });
});
