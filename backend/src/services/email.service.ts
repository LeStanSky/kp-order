import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
});

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  itemCount: number;
}

export const emailService = {
  async sendOrderNotificationToManager(
    data: OrderEmailData & { managerEmail: string; managerName: string },
  ): Promise<void> {
    try {
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to: data.managerEmail,
        subject: `Новый заказ ${data.orderNumber}`,
        html: `
          <h2>Новый заказ ${data.orderNumber}</h2>
          <p><strong>Менеджер:</strong> ${data.managerName}</p>
          <p><strong>Клиент:</strong> ${data.customerName} (${data.customerEmail})</p>
          <p><strong>Позиций:</strong> ${data.itemCount}</p>
          <p><strong>Сумма:</strong> ${data.totalAmount} руб.</p>
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
    try {
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to: data.customerEmail,
        subject: `Заказ ${data.orderNumber} принят`,
        html: `
          <h2>Ваш заказ ${data.orderNumber} принят</h2>
          <p>Здравствуйте, ${data.customerName}!</p>
          <p>Ваш заказ на ${data.itemCount} позиций на сумму ${data.totalAmount} руб. принят в обработку.</p>
          <p>Номер заказа: <strong>${data.orderNumber}</strong></p>
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
