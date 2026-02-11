import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
  ERPConnectionError,
} from '../errors';

describe('Error classes', () => {
  describe('AppError', () => {
    it('should set statusCode and message', () => {
      const err = new AppError('test error', 418);
      expect(err.message).toBe('test error');
      expect(err.statusCode).toBe(418);
      expect(err.isOperational).toBe(true);
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(AppError);
    });

    it('should support non-operational errors', () => {
      const err = new AppError('fatal', 500, false);
      expect(err.isOperational).toBe(false);
    });
  });

  describe('BadRequestError', () => {
    it('should default to 400 and "Bad request"', () => {
      const err = new BadRequestError();
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe('Bad request');
      expect(err).toBeInstanceOf(AppError);
    });

    it('should accept custom message', () => {
      const err = new BadRequestError('custom');
      expect(err.message).toBe('custom');
    });
  });

  describe('UnauthorizedError', () => {
    it('should default to 401', () => {
      const err = new UnauthorizedError();
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Unauthorized');
      expect(err).toBeInstanceOf(AppError);
    });
  });

  describe('ForbiddenError', () => {
    it('should default to 403', () => {
      const err = new ForbiddenError();
      expect(err.statusCode).toBe(403);
      expect(err.message).toBe('Forbidden');
      expect(err).toBeInstanceOf(AppError);
    });
  });

  describe('NotFoundError', () => {
    it('should default to 404', () => {
      const err = new NotFoundError();
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe('Not found');
      expect(err).toBeInstanceOf(AppError);
    });
  });

  describe('ConflictError', () => {
    it('should default to 409', () => {
      const err = new ConflictError();
      expect(err.statusCode).toBe(409);
      expect(err.message).toBe('Conflict');
      expect(err).toBeInstanceOf(AppError);
    });
  });

  describe('ValidationError', () => {
    it('should default to 422 with empty errors', () => {
      const err = new ValidationError();
      expect(err.statusCode).toBe(422);
      expect(err.message).toBe('Validation failed');
      expect(err.errors).toEqual({});
      expect(err).toBeInstanceOf(AppError);
    });

    it('should store field errors', () => {
      const errors = { email: ['Required'], password: ['Too short'] };
      const err = new ValidationError('Bad input', errors);
      expect(err.errors).toEqual(errors);
    });
  });

  describe('InternalServerError', () => {
    it('should default to 500 and non-operational', () => {
      const err = new InternalServerError();
      expect(err.statusCode).toBe(500);
      expect(err.message).toBe('Internal server error');
      expect(err.isOperational).toBe(false);
      expect(err).toBeInstanceOf(AppError);
    });
  });

  describe('ERPConnectionError', () => {
    it('should default to 503', () => {
      const err = new ERPConnectionError();
      expect(err.statusCode).toBe(503);
      expect(err.message).toBe('ERP service unavailable');
      expect(err).toBeInstanceOf(AppError);
    });
  });
});
