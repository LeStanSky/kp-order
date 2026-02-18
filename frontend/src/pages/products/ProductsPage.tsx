import { useState, useCallback } from 'react';
import { Box, Grid, Pagination, Skeleton, Typography, Stack } from '@mui/material';
import { useProducts, useCategories } from '@/hooks/useProducts';
import { ProductCard } from '@/components/products/ProductCard';
import { CategoryFilter } from '@/components/products/CategoryFilter';
import { SearchBar } from '@/components/products/SearchBar';

const PAGE_SIZE = 20;

export function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const { data: productsData, isLoading } = useProducts({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    category: category ?? undefined,
  });

  const { data: categories } = useCategories();

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleCategory = (cat: string | null) => {
    setCategory(cat);
    setPage(1);
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Каталог товаров
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <SearchBar onSearch={handleSearch} />
        {categories && (
          <CategoryFilter categories={categories} selected={category} onChange={handleCategory} />
        )}
      </Stack>

      {isLoading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          {productsData?.data.length === 0 ? (
            <Typography color="text.secondary">Товары не найдены</Typography>
          ) : (
            <Grid container spacing={2}>
              {productsData?.data.map((product) => (
                <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <ProductCard product={product} />
                </Grid>
              ))}
            </Grid>
          )}

          {productsData && productsData.pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={productsData.pagination.totalPages}
                page={page}
                onChange={(_, p) => setPage(p)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
