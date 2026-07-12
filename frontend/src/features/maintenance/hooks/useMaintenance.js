import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi } from '../services/maintenance.service.js';
import toast from 'react-hot-toast';

export const useMaintenanceList = (params) => {
  return useQuery({
    queryKey: ['maintenance', params],
    queryFn: () => maintenanceApi.getLogs(params),
  });
};

export const useCreateMaintenance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => maintenanceApi.createLog(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Vehicle logged into maintenance successfully');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to start maintenance log');
    },
  });
};

export const useCloseMaintenance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => maintenanceApi.closeLog(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Maintenance log closed. Vehicle status restored and expense logged.');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to close maintenance log');
    },
  });
};
