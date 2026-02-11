import { env } from '../../config/env';
import { IERPProvider } from './IERPProvider';
import { MockProvider } from './providers/MockProvider';
import { MoySkladProvider } from './providers/MoySkladProvider';

export function createERPProvider(): IERPProvider {
  switch (env.ERP_TYPE) {
    case 'moysklad':
      return new MoySkladProvider();
    case 'mock':
    default:
      return new MockProvider();
  }
}
