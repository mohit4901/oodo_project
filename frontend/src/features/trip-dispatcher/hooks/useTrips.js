import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripApi } from '../services/trip.service.js';
import toast from 'react-hot-toast';

export const useTripsList = (params) => {
  return useQuery({
    queryKey: ['trips', params],
    queryFn: () => tripApi.getTrips(params),
  });
};

export const useCreateTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => tripApi.createTrip(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Trip draft booked successfully');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to book trip');
    },
  });
};

export const useDispatchTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => tripApi.dispatchTrip(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Trip ${updated.tripId} dispatched successfully. Driver and vehicle status set to On Trip.`);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to dispatch trip');
    },
  });
};

export const useCompleteTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => tripApi.completeTrip(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Trip ${updated.tripId} completed. Odometer updated and fuel log generated.`);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to complete trip');
    },
  });
};

export const useCancelTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => tripApi.cancelTrip(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Trip ${updated.tripId} cancelled. Resources returned to Available status.`);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to cancel trip');
    },
  });
};
