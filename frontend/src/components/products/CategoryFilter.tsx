import { Box, Chip } from '@mui/material';

export const EXPIRED_CATEGORY = '__expired__';

interface CategoryFilterProps {
  categories: string[];
  selected: string | null;
  onChange: (category: string | null) => void;
  showExpired?: boolean;
}

export function CategoryFilter({
  categories,
  selected,
  onChange,
  showExpired,
}: CategoryFilterProps) {
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
      {showExpired && (
        <Chip
          label="Просрочка"
          onClick={() => onChange(EXPIRED_CATEGORY)}
          color={selected === EXPIRED_CATEGORY ? 'error' : 'default'}
          variant={selected === EXPIRED_CATEGORY ? 'filled' : 'outlined'}
        />
      )}
    </Box>
  );
}
