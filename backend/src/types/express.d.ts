import { UserRole } from '../generated/prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        priceGroupId: string | null;
      };
    }
  }
}
