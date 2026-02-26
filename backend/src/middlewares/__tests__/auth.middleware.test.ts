import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from '../auth.middleware';
import { UnauthorizedError } from '../../utils/errors';
import { env } from '../../config/env';

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    ...overrides,
  } as unknown as Request;
}

function mockRes(): Response {
  return { locals: {} } as unknown as Response;
}

describe('authenticate middleware', () => {
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    next = jest.fn();
  });

  it('should set req.user and call next() for valid token', () => {
    const payload = {
      id: 'user-1',
      email: 'test@example.com',
      role: 'ADMIN',
      priceGroupId: null,
    };
    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });
    const req = mockReq({
      headers: { authorization: `Bearer ${token}` },
    });

    authenticate(req, mockRes(), next);

    expect(req.user).toBeDefined();
    expect(req.user!.id).toBe('user-1');
    expect(req.user!.email).toBe('test@example.com');
    expect(req.user!.role).toBe('ADMIN');
    expect(req.user!.priceGroupId).toBeNull();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should throw UnauthorizedError when no auth header', () => {
    const req = mockReq();

    expect(() => authenticate(req, mockRes(), next)).toThrow(UnauthorizedError);
    expect(next).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedError for non-Bearer header', () => {
    const req = mockReq({
      headers: { authorization: 'Basic some-token' },
    });

    expect(() => authenticate(req, mockRes(), next)).toThrow(UnauthorizedError);
  });

  it('should throw UnauthorizedError for invalid token', () => {
    const req = mockReq({
      headers: { authorization: 'Bearer invalid.token.here' },
    });

    expect(() => authenticate(req, mockRes(), next)).toThrow(UnauthorizedError);
  });

  it('should throw UnauthorizedError for expired token', () => {
    const token = jwt.sign(
      { id: 'user-1', email: 'test@test.com', role: 'CLIENT', priceGroupId: null },
      env.JWT_SECRET,
      { expiresIn: '0s' },
    );
    const req = mockReq({
      headers: { authorization: `Bearer ${token}` },
    });

    expect(() => authenticate(req, mockRes(), next)).toThrow(UnauthorizedError);
  });

  it('should throw UnauthorizedError for token signed with wrong secret', () => {
    const token = jwt.sign(
      { id: 'user-1', email: 'test@test.com', role: 'CLIENT', priceGroupId: null },
      'wrong-secret',
    );
    const req = mockReq({
      headers: { authorization: `Bearer ${token}` },
    });

    expect(() => authenticate(req, mockRes(), next)).toThrow(UnauthorizedError);
  });
});
