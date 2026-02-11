import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../errorHandler.middleware';
import { AppError, ValidationError, NotFoundError } from '../../utils/errors';

function mockRes() {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as Response;
}

const mockReq = {} as Request;
const mockNext = jest.fn() as NextFunction;

describe('errorHandler middleware', () => {
  it('should handle ValidationError with 422 and errors object', () => {
    const errors = { email: ['Required'] };
    const err = new ValidationError('Bad input', errors);
    const res = mockRes();

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Bad input',
      errors: { email: ['Required'] },
    });
  });

  it('should handle AppError with correct statusCode', () => {
    const err = new NotFoundError('Product not found');
    const res = mockRes();

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Product not found' });
  });

  it('should handle generic AppError', () => {
    const err = new AppError('Custom error', 418);
    const res = mockRes();

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({ error: 'Custom error' });
  });

  it('should handle Prisma P2002 (unique constraint) as 409', () => {
    const err = new Error('Unique constraint') as any;
    err.code = 'P2002';
    const res = mockRes();

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Resource already exists' });
  });

  it('should handle unknown errors as 500', () => {
    const err = new Error('Something broke');
    const res = mockRes();

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
