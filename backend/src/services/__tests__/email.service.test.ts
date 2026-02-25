const mockSendMail = jest.fn();
const mockVerify = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: mockSendMail,
    verify: mockVerify,
  }),
}));

jest.mock('../../config/env', () => ({
  env: {
    SMTP_ENABLED: true,
    SMTP_HOST: 'smtp.yandex.ru',
    SMTP_PORT: 587,
    SMTP_USER: 'noreply@test.com',
    SMTP_PASS: 'testpass',
    SMTP_FROM: 'noreply@test.com',
    NODE_ENV: 'test',
  },
}));

import { emailService } from '../email.service';

describe('emailService', () => {
  beforeEach(() => {
    mockSendMail.mockReset();
    mockVerify.mockReset();
  });

  describe('sendOrderNotificationToManager', () => {
    const orderData = {
      orderNumber: 'ORD-20260315-001',
      customerName: 'Test Client',
      customerEmail: 'client@test.com',
      totalAmount: 5000,
      itemCount: 3,
      managerEmail: 'manager@test.com',
      managerName: 'Manager Name',
    };

    it('should send email to manager', async () => {
      mockSendMail.mockResolvedValue({ messageId: '123' });

      await emailService.sendOrderNotificationToManager(orderData);

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const call = mockSendMail.mock.calls[0][0];
      expect(call.to).toBe('manager@test.com');
      expect(call.subject).toContain('ORD-20260315-001');
      expect(call.html).toContain('Test Client');
    });

    it('should not throw on send failure (fire-and-forget)', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP error'));

      await expect(emailService.sendOrderNotificationToManager(orderData)).resolves.not.toThrow();
    });
  });

  describe('sendOrderConfirmationToClient', () => {
    const orderData = {
      orderNumber: 'ORD-20260315-001',
      customerEmail: 'client@test.com',
      customerName: 'Test Client',
      totalAmount: 5000,
      itemCount: 3,
    };

    it('should send confirmation email to client', async () => {
      mockSendMail.mockResolvedValue({ messageId: '456' });

      await emailService.sendOrderConfirmationToClient(orderData);

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const call = mockSendMail.mock.calls[0][0];
      expect(call.to).toBe('client@test.com');
      expect(call.subject).toContain('ORD-20260315-001');
    });

    it('should not throw on send failure (fire-and-forget)', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP error'));

      await expect(emailService.sendOrderConfirmationToClient(orderData)).resolves.not.toThrow();
    });
  });

  describe('verifyConnection', () => {
    it('should return true when SMTP connection succeeds', async () => {
      mockVerify.mockResolvedValue(true);

      const result = await emailService.verifyConnection();

      expect(result).toBe(true);
      expect(mockVerify).toHaveBeenCalledTimes(1);
    });

    it('should return false when SMTP connection fails', async () => {
      mockVerify.mockRejectedValue(new Error('Connection refused'));

      const result = await emailService.verifyConnection();

      expect(result).toBe(false);
    });
  });
});
