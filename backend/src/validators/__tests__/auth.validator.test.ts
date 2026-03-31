import { registerSchema, loginSchema, refreshSchema } from '../auth.validator';

describe('registerSchema', () => {
  it('should accept valid data', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      name: 'John Doe',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        email: 'user@example.com',
        password: 'password123',
        name: 'John Doe',
      });
    }
  });

  it('should reject missing fields', () => {
    const result = registerSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject short password (< 8 chars)', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: '1234567',
      name: 'John',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain('Password must be at least 8 characters');
    }
  });

  it('should reject invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'not-email',
      password: 'password123',
      name: 'John',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain('Invalid email address');
    }
  });

  it('should lowercase email', () => {
    const result = registerSchema.safeParse({
      email: 'User@Example.COM',
      password: 'password123',
      name: 'John Doe',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });

  it('should reject short name (< 2 chars)', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      name: 'J',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('should accept valid data', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('should lowercase email', () => {
    const result = loginSchema.safeParse({
      email: 'User@Example.COM',
      password: 'password123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });

  it('should reject missing email', () => {
    const result = loginSchema.safeParse({ password: 'password123' });
    expect(result.success).toBe(false);
  });

  it('should reject missing password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com' });
    expect(result.success).toBe(false);
  });

  it('should reject empty password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('refreshSchema', () => {
  it('should accept valid token', () => {
    const result = refreshSchema.safeParse({ refreshToken: 'some-jwt-token' });
    expect(result.success).toBe(true);
  });

  it('should reject empty token', () => {
    const result = refreshSchema.safeParse({ refreshToken: '' });
    expect(result.success).toBe(false);
  });

  it('should reject missing token', () => {
    const result = refreshSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
