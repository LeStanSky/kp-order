import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, act, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { SearchBar } from '../SearchBar';

afterEach(() => {
  vi.useRealTimers();
});

describe('SearchBar', () => {
  it('renders text input', () => {
    renderWithProviders(<SearchBar onSearch={vi.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('calls onSearch after debounce when text is typed', () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    renderWithProviders(<SearchBar onSearch={onSearch} />);
    const input = screen.getByRole('textbox');

    act(() => {
      fireEvent.change(input, { target: { value: 'test' } });
    });

    expect(onSearch).not.toHaveBeenCalledWith('test');

    act(() => {
      vi.runAllTimers();
    });

    expect(onSearch).toHaveBeenCalledWith('test');
  });

  it('calls onSearch with empty string when cleared', () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    renderWithProviders(<SearchBar onSearch={onSearch} />);
    const input = screen.getByRole('textbox');

    act(() => {
      fireEvent.change(input, { target: { value: 'abc' } });
      vi.runAllTimers();
    });

    act(() => {
      fireEvent.change(input, { target: { value: '' } });
      vi.runAllTimers();
    });

    expect(onSearch).toHaveBeenLastCalledWith('');
  });
});
