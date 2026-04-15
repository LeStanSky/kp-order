import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  Stack,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import UploadIcon from '@mui/icons-material/Upload';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { Product } from '@/types/product.types';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { productsApi } from '@/api/products.api';
import {
  isKeg,
  resolveDisplayName,
  resolveStock,
  resolvePrice,
  formatPrice,
} from '@/utils/productDisplay';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const { hasRole, user } = useAuthStore();
  const { items: cartItems, addItem, updateQuantity, removeItem } = useCartStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentCartItem = product ? cartItems.find((i) => i.productId === product.id) : undefined;
  const cartQty = currentCartItem?.quantity ?? 0;
  const [qty, setQty] = useState(cartQty);
  const [trackedCartQty, setTrackedCartQty] = useState(cartQty);
  const [prevProductId, setPrevProductId] = useState<string | null>(null);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  if (product && product.id !== prevProductId) {
    setPrevProductId(product.id);
    setQty(cartQty);
    setTrackedCartQty(cartQty);
    setIsEditingDescription(false);
    setDescriptionDraft('');
  } else if (cartQty !== trackedCartQty) {
    setTrackedCartQty(cartQty);
    setQty(cartQty);
  }
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (file: File) => productsApi.uploadImage(product?.id ?? '', file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Фото загружено');
    },
    onError: () => toast.error('Ошибка загрузки фото'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => productsApi.deleteImage(product?.id ?? ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Фото удалено');
    },
    onError: () => toast.error('Ошибка удаления фото'),
  });

  const descriptionMutation = useMutation({
    mutationFn: (description: string | null) =>
      productsApi.updateProduct(product?.id ?? '', { description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsEditingDescription(false);
      toast.success('Описание сохранено');
    },
    onError: () => toast.error('Ошибка сохранения описания'),
  });

  const isClient = hasRole('CLIENT');
  const canOrder = isClient && user?.canOrder !== false;
  const isAdmin = hasRole('ADMIN');

  const displayName = product ? resolveDisplayName(product.name, product.unit) : '';
  const displayStock = product
    ? resolveStock(product.name, product.stock, product.unit)
    : { value: 0, unit: 'шт' };
  const displayPrice = product ? resolvePrice(product.prices, product.name, product.unit) : null;
  const outOfStock = displayStock.value === 0;
  const cartItem = currentCartItem;

  useEffect(() => {
    if (!product || !canOrder) return;
    if (qty === cartQty) return;
    const handle = setTimeout(() => {
      const target = Math.min(Math.max(0, qty), displayStock.value);
      if (target === cartQty) return;
      if (target === 0) {
        if (cartItem) removeItem(product.id);
      } else if (cartItem) {
        updateQuantity(product.id, target);
      } else {
        addItem({
          productId: product.id,
          name: displayName,
          price: displayPrice?.value ?? 0,
          currency: displayPrice?.currency ?? 'RUB',
          quantity: target,
          isKeg: isKeg(product.name, product.unit),
        });
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [
    qty,
    cartQty,
    product,
    canOrder,
    cartItem,
    displayName,
    displayPrice?.value,
    displayPrice?.currency,
    displayStock.value,
    addItem,
    updateQuantity,
    removeItem,
  ]);

  if (!product) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    // reset so same file can be re-selected
    e.target.value = '';
  };

  const hasCharacteristics =
    product.characteristics && Object.keys(product.characteristics).length > 0;

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        {displayName}
        <IconButton
          aria-label="Закрыть диалог"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
          {/* Левая колонка: фото */}
          <Box sx={{ minWidth: 180, flexShrink: 0 }}>
            {product.imageUrl ? (
              <Box
                component="img"
                src={product.imageUrl}
                alt={displayName}
                sx={{
                  width: '100%',
                  maxHeight: 300,
                  objectFit: 'contain',
                  borderRadius: 1,
                  display: 'block',
                }}
              />
            ) : (
              <Box
                sx={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Нет фото
                </Typography>
              </Box>
            )}

            {isAdmin && (
              <Stack spacing={1} sx={{ mt: 1 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={handleFileChange}
                />
                <Button
                  size="small"
                  startIcon={<UploadIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  loading={uploadMutation.isPending}
                >
                  Загрузить фото
                </Button>
                {product.imageUrl && (
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => deleteMutation.mutate()}
                    loading={deleteMutation.isPending}
                  >
                    Удалить фото
                  </Button>
                )}
              </Stack>
            )}
          </Box>

          {/* Правая колонка: данные */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {isAdmin && isEditingDescription ? (
              <Stack spacing={1} sx={{ mb: 2 }}>
                <TextField
                  multiline
                  minRows={3}
                  fullWidth
                  size="small"
                  value={descriptionDraft}
                  onChange={(e) => setDescriptionDraft(e.target.value)}
                  placeholder="Описание товара"
                  autoFocus
                />
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={() => descriptionMutation.mutate(descriptionDraft.trim() || null)}
                    loading={descriptionMutation.isPending}
                  >
                    Сохранить
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setIsEditingDescription(false);
                      setDescriptionDraft(product.description ?? '');
                    }}
                    disabled={descriptionMutation.isPending}
                  >
                    Отмена
                  </Button>
                </Stack>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ flex: 1, whiteSpace: 'pre-wrap' }}>
                  {product.description || (
                    <Typography component="span" variant="body2" color="text.secondary">
                      {isAdmin ? 'Нет описания' : ''}
                    </Typography>
                  )}
                </Typography>
                {isAdmin && (
                  <IconButton
                    size="small"
                    aria-label="Редактировать описание"
                    onClick={() => {
                      setDescriptionDraft(product.description ?? '');
                      setIsEditingDescription(true);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>
            )}

            {hasCharacteristics && (
              <Table size="small" sx={{ mb: 2 }}>
                <TableBody>
                  {Object.entries(product.characteristics!).map(([key, val]) => (
                    <TableRow key={key}>
                      <TableCell
                        sx={{ fontWeight: 500, borderBottom: 'none', py: 0.5, pl: 0, width: '40%' }}
                      >
                        {key}
                      </TableCell>
                      <TableCell sx={{ borderBottom: 'none', py: 0.5 }}>{val}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Остаток:{' '}
                <Typography
                  component="span"
                  variant="body2"
                  fontWeight={600}
                  color={displayStock.value < 10 ? 'warning.main' : 'text.primary'}
                >
                  {displayStock.value}
                </Typography>{' '}
                {displayStock.unit}
              </Typography>
              {displayPrice && (
                <Typography variant="body1" fontWeight={600}>
                  {formatPrice(displayPrice.value)} {displayPrice.currency}
                </Typography>
              )}
            </Stack>

            {canOrder && !outOfStock && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  В корзине:
                </Typography>
                <TextField
                  type="number"
                  size="small"
                  value={qty}
                  onChange={(e) =>
                    setQty(Math.min(Math.max(0, Number(e.target.value)), displayStock.value))
                  }
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      max: displayStock.value,
                      style: { textAlign: 'center', width: 56 },
                    },
                  }}
                  variant="outlined"
                />
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
}
