import { Box, Chip } from '@mui/material';

interface CategoryFilterProps {
  categories: string[];
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
          key={cat}
          label={cat}
          onClick={() => onChange(cat)}
          color={selected === cat ? 'primary' : 'default'}
          variant={selected === cat ? 'filled' : 'outlined'}
        />
      ))}
    </Box>
  );
}
