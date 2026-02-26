import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  stockAlertsApi,
  type GetStockAlertsParams,
  type CreateStockAlertParams,
  type UpdateStockAlertParams,
} from '@/api/stockAlerts.api';

export function useStockAlerts(params?: GetStockAlertsParams) {
  return useQuery({
    queryKey: ['stock-alerts', params],
    queryFn: () => stockAlertsApi.getAlerts(params),
  });
}

export function useCreateStockAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: CreateStockAlertParams) => stockAlertsApi.createAlert(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
    },
  });
}

export function useUpdateStockAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: UpdateStockAlertParams }) =>
      stockAlertsApi.updateAlert(id, params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
    },
  });
}

export function useDeleteStockAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => stockAlertsApi.deleteAlert(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
    },
  });
}
