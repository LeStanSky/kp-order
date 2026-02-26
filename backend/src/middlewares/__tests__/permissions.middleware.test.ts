import { Request, Response, NextFunction } from 'express';
import { requireRole } from '../permissions.middleware';
import { ForbiddenError, UnauthorizedError } from '../../utils/errors';

function mockReq(user?: Request['user']): Request {
  return { user } as unknown as Request;
}

function mockRes(): Response {
  return { locals: {} } as unknown as Response;
}

describe('requireRole middleware', () => {
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    next = jest.fn();
  });

  it('should call next() when user has the allowed role', () => {
    const req = mockReq({
      id: '1',
      email: 'admin@test.com',
      role: 'ADMIN',
      priceGroupId: null,
    });

    requireRole('ADMIN', 'MANAGER')(req, mockRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should throw ForbiddenError when user role not in allowed list', () => {
    const req = mockReq({
      id: '1',
      email: 'client@test.com',
      role: 'CLIENT',
      priceGroupId: 'pg-1',
    });

    expect(() => requireRole('ADMIN', 'MANAGER')(req, mockRes(), next)).toThrow(ForbiddenError);
    expect(next).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedError when no user', () => {
    const req = mockReq(undefined);

    expect(() => requireRole('ADMIN')(req, mockRes(), next)).toThrow(UnauthorizedError);
    expect(next).not.toHaveBeenCalled();
  });

  it('should accept single role', () => {
    const req = mockReq({
      id: '1',
      email: 'manager@test.com',
      role: 'MANAGER',
      priceGroupId: null,
    });

    requireRole('MANAGER')(req, mockRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
