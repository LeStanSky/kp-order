import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { ExpiryBadge } from '../ExpiryBadge';
import type { ExpiryStatus } from '@/types/product.types';

describe('ExpiryBadge', () => {
  it('renders nothing when status is undefined', () => {
    const { container } = renderWithProviders(<ExpiryBadge expiryStatus={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it.each<ExpiryStatus>(['green', 'blue', 'yellow', 'orange', 'red'])(
    'renders chip for status %s',
    (status) => {
      renderWithProviders(<ExpiryBadge expiryStatus={status} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    },
  );
});
