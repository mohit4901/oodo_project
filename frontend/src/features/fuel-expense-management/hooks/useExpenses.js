import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseApi } from '../services/expense.service.js';
import toast from 'react-hot-toast';

export const useFuelLogsList = (params) => {
  return useQuery({
    queryKey: ['fuelLogs', params],
    queryFn: () => expenseApi.getFuelLogs(params),
  });
};

export const useExpensesList = (params) => {
  return useQuery({
    queryKey: ['expenses', params],
    queryFn: () => expenseApi.getExpenses(params),
  });
};

export const useVehicleTotalCostQuery = (vehicleId) => {
  return useQuery({
    queryKey: ['vehicleCost', vehicleId],
    queryFn: () => expenseApi.getVehicleTotalCost(vehicleId),
    enabled: !!vehicleId,
  });
};

export const useLogFuel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => expenseApi.logFuel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuelLogs'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['vehicleCost'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Fuel purchase transaction logged successfully');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to log fuel purchase');
    },
  });
};

export const useLogExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => expenseApi.logExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['vehicleCost'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Expense transaction logged successfully');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to log expense');
    },
  });
};
