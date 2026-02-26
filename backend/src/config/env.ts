import dotenv from 'dotenv';

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // ERP
  ERP_TYPE: (process.env.ERP_TYPE || 'mock') as 'moysklad' | 'mock',
  MOYSKLAD_TOKEN: process.env.MOYSKLAD_TOKEN || '',
  MOYSKLAD_BASE_URL: process.env.MOYSKLAD_BASE_URL || 'https://api.moysklad.ru/api/remap/1.2',

  // SMTP
  SMTP_ENABLED: process.env.SMTP_ENABLED === 'true',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'noreply@kporder.local',

  // Notifications
  OPERATOR_EMAIL: process.env.OPERATOR_EMAIL || '',

  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Uploads
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};
