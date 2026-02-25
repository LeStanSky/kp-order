import app from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { setupProductSync, stopProductSync } from './jobs/syncProducts.job';
import { setupStockAlerts, stopStockAlerts } from './jobs/stockAlerts.job';
import { emailService } from './services/email.service';
import { logger } from './utils/logger';

async function bootstrap() {
  await connectDatabase();
  await connectRedis();
  setupProductSync();
  setupStockAlerts();

  // SMTP check (non-blocking)
  if (env.SMTP_ENABLED) {
    emailService.verifyConnection().then((ok) => {
      if (ok) {
        logger.info('SMTP connection verified', { host: env.SMTP_HOST });
      } else {
        logger.warn('SMTP enabled but connection failed — emails will not be delivered', {
          host: env.SMTP_HOST,
        });
      }
    });
  } else {
    logger.info('SMTP disabled — set SMTP_ENABLED=true to enable email notifications');
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down...`);
    server.close();
    await stopProductSync();
    await stopStockAlerts();
    await disconnectRedis();
    await disconnectDatabase();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  logger.error('Failed to start server', { error: err.message });
  process.exit(1);
});
