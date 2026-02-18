import { Box, Chip } from '@mui/material';
import type { Category } from '@/types/product.types';

interface CategoryFilterProps {
  categories: Category[];
  selected: string | null;
  onChange: (category: string | null) => void;
}

export function CategoryFilter({ categories, selected, onChange }: CategoryFilterProps) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      <Chip
        label="Все"
        onClick={() => onChange(null)}
        color={selected === null ? 'primary' : 'default'}
        variant={selected === null ? 'filled' : 'outlined'}
      />
      {categories.map((cat) => (
        <Chip
          key={cat.id}
          label={cat.name}
          onClick={() => onChange(cat.id)}
          color={selected === cat.id ? 'primary' : 'default'}
          variant={selected === cat.id ? 'filled' : 'outlined'}
        />
      ))}
    </Box>
  );
}
