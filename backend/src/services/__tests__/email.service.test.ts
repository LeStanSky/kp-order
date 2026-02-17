const mockSendMail = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: mockSendMail,
  }),
}));

import { env } from '../../config/env';
import { emailService } from '../email.service';

describe('emailService', () => {
  const originalOperatorEmail = env.OPERATOR_EMAIL;

  beforeEach(() => {
    mockSendMail.mockReset();
    env.OPERATOR_EMAIL = 'operator@test.com';
  });

  afterEach(() => {
    env.OPERATOR_EMAIL = originalOperatorEmail;
  });

  describe('sendOrderNotificationToOperator', () => {
    const orderData = {
      orderNumber: 'ORD-20260315-001',
      customerName: 'Test Client',
      customerEmail: 'client@test.com',
      totalAmount: 5000,
      itemCount: 3,
    };

    it('should send email to operator', async () => {
      mockSendMail.mockResolvedValue({ messageId: '123' });

      await emailService.sendOrderNotificationToOperator(orderData);

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const call = mockSendMail.mock.calls[0][0];
      expect(call.subject).toContain('ORD-20260315-001');
      expect(call.html).toContain('Test Client');
    });

    it('should skip sending if OPERATOR_EMAIL is empty', async () => {
      env.OPERATOR_EMAIL = '';

      await emailService.sendOrderNotificationToOperator(orderData);

      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should not throw on send failure (fire-and-forget)', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP error'));

      await expect(emailService.sendOrderNotificationToOperator(orderData)).resolves.not.toThrow();
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
});
