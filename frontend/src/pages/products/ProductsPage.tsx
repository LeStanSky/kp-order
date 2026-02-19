import { useState, useCallback, useMemo, Fragment } from 'react';
import {
  Box,
  Typography,
  Stack,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useProducts, useCategories } from '@/hooks/useProducts';
import { ProductRow } from '@/components/products/ProductRow';
import { ProductDetailModal } from '@/components/products/ProductDetailModal';
import { CategoryFilter } from '@/components/products/CategoryFilter';
import { SearchBar } from '@/components/products/SearchBar';
import { useAuthStore } from '@/store/authStore';
import type { Product } from '@/types/product.types';

const PAGE_SIZE = 100;

function groupByCategory(products: Product[]): Map<string, Product[]> {
  const map = new Map<string, Product[]>();
  for (const p of products) {
    const key = p.category ?? 'Без категории';
    const group = map.get(key) ?? [];
    group.push(p);
    map.set(key, group);
  }
  return map;
}

export function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { hasRole } = useAuthStore();

  const toggleCategory = (catName: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(catName)) next.delete(catName);
      else next.add(catName);
      return next;
    });
  };
  const isClient = hasRole('CLIENT');

  const {
    data: productsData,
    isLoading,
    error,
  } = useProducts({
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

  const grouped = useMemo(
    () => (productsData ? groupByCategory(productsData.data) : null),
    [productsData],
  );

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }} alignItems="center">
        <SearchBar onSearch={handleSearch} />
        {categories && (
          <CategoryFilter categories={categories} selected={category} onChange={handleCategory} />
        )}
      </Stack>

      {isLoading ? (
        <Box>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={44} sx={{ mb: 1, borderRadius: 1 }} />
          ))}
        </Box>
      ) : error ? (
        <Typography color="error">
          Не удалось загрузить товары. Проверьте подключение к серверу.
        </Typography>
      ) : productsData?.data.length === 0 ? (
        <Typography color="text.secondary">Товары не найдены</Typography>
      ) : (
        <>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Наименование</TableCell>
                  <TableCell align="center">Ед.</TableCell>
                  <TableCell align="right">Остаток</TableCell>
                  <TableCell align="right">Цена</TableCell>
                  {isClient && (
                    <>
                      <TableCell align="center">Кол-во</TableCell>
                      <TableCell align="center" />
                      <TableCell align="center">В корзине</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>

              <TableBody>
                {Array.from((grouped ?? new Map<string, Product[]>()).entries()).map(
                  ([catName, products]) => (
                    <Fragment key={catName}>
                      {/* Заголовок категории */}
                      <TableRow
                        sx={{ backgroundColor: 'action.hover', cursor: 'pointer' }}
                        onClick={() => toggleCategory(catName)}
                      >
                        <TableCell
                          colSpan={isClient ? 7 : 4}
                          sx={{
                            py: 0.5,
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            color: 'text.secondary',
                            letterSpacing: 0.5,
                            textTransform: 'uppercase',
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <IconButton size="small" sx={{ p: 0.25 }}>
                              {collapsed.has(catName) ? (
                                <ExpandMoreIcon fontSize="small" />
                              ) : (
                                <ExpandLessIcon fontSize="small" />
                              )}
                            </IconButton>
                            <span>{catName}</span>
                            <Typography variant="caption" color="text.disabled" sx={{ ml: 0.5 }}>
                              ({products.length})
                            </Typography>
                          </Stack>
                        </TableCell>
                      </TableRow>

                      {/* Строки товаров */}
                      {!collapsed.has(catName) &&
                        products.map((product) => (
                          <ProductRow
                            key={product.id}
                            product={product}
                            onOpen={() => setSelectedProduct(product)}
                          />
                        ))}
                    </Fragment>
                  ),
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {productsData && productsData.pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
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

      <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </Box>
  );
}
