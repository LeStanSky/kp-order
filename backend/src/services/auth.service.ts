import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { userRepository } from '../repositories/user.repository';
import { ConflictError, UnauthorizedError } from '../utils/errors';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface UserPayload {
  id: string;
  email: string;
  role: string;
  priceGroupId: string | null;
}

function generateTokens(user: UserPayload): TokenPair {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role, priceGroupId: user.priceGroupId },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as any },
  );

  const refreshToken = jwt.sign({ id: user.id }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  });

  return { accessToken, refreshToken };
}

function parseExpiry(expiresIn: string): Date {
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  if (!match) return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // fallback 30d

  const value = parseInt(match[1], 10);
  const unit = match[2];
  const ms =
    unit === 'd'
      ? value * 86400000
      : unit === 'h'
        ? value * 3600000
        : unit === 'm'
          ? value * 60000
          : value * 1000;

  return new Date(Date.now() + ms);
}

export const authService = {
  async register(email: string, password: string, name: string) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await userRepository.create({
      email,
      password: hashedPassword,
      name,
    });

    const tokens = generateTokens(user);

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: parseExpiry(env.JWT_REFRESH_EXPIRES_IN),
      },
    });

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      ...tokens,
    };
  },

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const tokens = generateTokens(user);

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: parseExpiry(env.JWT_REFRESH_EXPIRES_IN),
      },
    });

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      ...tokens,
    };
  },

  async refresh(refreshToken: string) {
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = stored.user;
    if (!user.isActive) {
      throw new UnauthorizedError('Account deactivated');
    }

    // Rotate: delete old, create new
    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const tokens = generateTokens(user);

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: parseExpiry(env.JWT_REFRESH_EXPIRES_IN),
      },
    });

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      ...tokens,
    };
  },

  async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  },

  async getMe(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      priceGroup: user.priceGroup ? { id: user.priceGroup.id, name: user.priceGroup.name } : null,
    };
  },
};
