import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverApi } from '../services/driver.service.js';
import toast from 'react-hot-toast';

export const useDriversList = (params) => {
  return useQuery({
    queryKey: ['drivers', params],
    queryFn: () => driverApi.getDrivers(params),
  });
};

export const useCreateDriver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => driverApi.createDriver(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Driver profile registered successfully');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to register driver');
    },
  });
};

export const useUpdateDriver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => driverApi.updateDriver(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Driver ${updated.name} updated successfully`);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update driver');
    },
  });
};

export const useDeleteDriver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => driverApi.deleteDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Driver profile removed from registry');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to remove driver');
    },
  });
};
