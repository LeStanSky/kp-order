import dns from 'dns';
import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

dns.setDefaultResultOrder('ipv4first');

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  family: 4,
  auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
} as any);

interface OrderEmailItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  itemCount: number;
  items?: OrderEmailItem[];
  comment?: string;
}

function renderItemsTable(items: OrderEmailItem[]): string {
  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:4px 8px;border-bottom:1px solid #eee">${i.name}</td><td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right">${i.quantity}</td><td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right">${i.price.toFixed(2)}</td><td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right">${i.total.toFixed(2)}</td></tr>`,
    )
    .join('');
  return `<table style="width:100%;border-collapse:collapse;margin:12px 0"><thead><tr style="background:#f5f5f5"><th style="padding:6px 8px;text-align:left">Товар</th><th style="padding:6px 8px;text-align:right">Кол-во</th><th style="padding:6px 8px;text-align:right">Цена</th><th style="padding:6px 8px;text-align:right">Сумма</th></tr></thead><tbody>${rows}</tbody></table>`;
}

export const emailService = {
  async verifyConnection(): Promise<boolean> {
    try {
      await transporter.verify();
      return true;
    } catch (error) {
      logger.error('SMTP connection verification failed', { error: (error as Error).message });
      return false;
    }
  },

  async sendOrderNotificationToManager(
    data: OrderEmailData & { managerEmail: string; managerName: string },
  ): Promise<void> {
    if (!env.SMTP_ENABLED) {
      logger.debug('SMTP disabled, skipping manager notification', {
        orderNumber: data.orderNumber,
      });
      return;
    }
    try {
      logger.info('Sending manager notification', {
        to: data.managerEmail,
        orderNumber: data.orderNumber,
      });
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to: data.managerEmail,
        subject: `Новый заказ ${data.orderNumber}`,
        html: `
          <h2>Новый заказ ${data.orderNumber}</h2>
          <p><strong>Менеджер:</strong> ${data.managerName}</p>
          <p><strong>Клиент:</strong> ${data.customerName} (${data.customerEmail})</p>
          ${data.items?.length ? renderItemsTable(data.items) : `<p><strong>Позиций:</strong> ${data.itemCount}</p>`}
          <p><strong>Итого:</strong> ${data.totalAmount.toFixed(2)} руб.</p>
          ${data.comment ? `<p><strong>Комментарий:</strong> ${data.comment}</p>` : ''}
        `,
      });
    } catch (error) {
      logger.error('Failed to send manager notification', {
        orderNumber: data.orderNumber,
        error: (error as Error).message,
      });
    }
  },

  async sendOrderConfirmationToClient(data: OrderEmailData): Promise<void> {
    if (!env.SMTP_ENABLED) {
      logger.debug('SMTP disabled, skipping client confirmation', {
        orderNumber: data.orderNumber,
      });
      return;
    }
    try {
      logger.info('Sending client confirmation', {
        to: data.customerEmail,
        orderNumber: data.orderNumber,
      });
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to: data.customerEmail,
        subject: `Заказ ${data.orderNumber} принят`,
        html: `
          <h2>Ваш заказ ${data.orderNumber} принят</h2>
          <p>Здравствуйте, ${data.customerName}!</p>
          <p>Ваш заказ принят в обработку.</p>
          ${data.items?.length ? renderItemsTable(data.items) : `<p><strong>Позиций:</strong> ${data.itemCount}</p>`}
          <p><strong>Итого:</strong> ${data.totalAmount.toFixed(2)} руб.</p>
          ${data.comment ? `<p><strong>Комментарий:</strong> ${data.comment}</p>` : ''}
        `,
      });
    } catch (error) {
      logger.error('Failed to send client confirmation', {
        orderNumber: data.orderNumber,
        error: (error as Error).message,
      });
    }
  },

  async sendStockAlertNotification(data: {
    recipientEmail: string;
    productName: string;
    currentStock: number;
    minStock: number;
  }): Promise<void> {
    if (!env.SMTP_ENABLED) {
      logger.debug('SMTP disabled, skipping stock alert notification', {
        productName: data.productName,
      });
      return;
    }
    try {
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to: data.recipientEmail,
        subject: `Низкий остаток: ${data.productName}`,
        html: `
          <h2>Низкий остаток товара</h2>
          <p><strong>Товар:</strong> ${data.productName}</p>
          <p><strong>Текущий остаток:</strong> ${data.currentStock}</p>
          <p><strong>Минимальный порог:</strong> ${data.minStock}</p>
        `,
      });
    } catch (error) {
      logger.error('Failed to send stock alert notification', {
        productName: data.productName,
        error: (error as Error).message,
      });
    }
  },
};
