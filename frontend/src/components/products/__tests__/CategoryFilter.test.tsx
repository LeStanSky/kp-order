import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { CategoryFilter } from '../CategoryFilter';
import type { Category } from '@/types/product.types';

const categories: Category[] = [
  { id: '1', name: 'Молочные' },
  { id: '2', name: 'Мясные' },
];

describe('CategoryFilter', () => {
  it('renders all categories plus "All" option', () => {
    renderWithProviders(
      <CategoryFilter categories={categories} selected={null} onChange={vi.fn()} />,
    );
    expect(screen.getByText(/все|all/i)).toBeInTheDocument();
    expect(screen.getByText('Молочные')).toBeInTheDocument();
    expect(screen.getByText('Мясные')).toBeInTheDocument();
  });

  it('calls onChange with category id when clicking a category', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <CategoryFilter categories={categories} selected={null} onChange={onChange} />,
    );
    await userEvent.click(screen.getByText('Молочные'));
    expect(onChange).toHaveBeenCalledWith('1');
  });

  it('calls onChange with null when clicking "All"', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <CategoryFilter categories={categories} selected="1" onChange={onChange} />,
    );
    await userEvent.click(screen.getByText(/все|all/i));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
