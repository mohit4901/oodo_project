import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleApi } from '../services/vehicle.service.js';
import toast from 'react-hot-toast';

export const useVehiclesList = (params) => {
  return useQuery({
    queryKey: ['vehicles', params],
    queryFn: () => vehicleApi.getVehicles(params),
  });
};

export const useCreateVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => vehicleApi.createVehicle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Vehicle registered successfully');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to register vehicle');
    },
  });
};

export const useUpdateVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => vehicleApi.updateVehicle(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Vehicle ${updated.registrationNumber} updated successfully`);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update vehicle');
    },
  });
};

export const useDeleteVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => vehicleApi.deleteVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Vehicle removed from registry');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to remove vehicle');
    },
  });
};
