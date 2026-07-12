import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../services/dashboard.service.js';

export const useDashboard = (filters) => {
  return useQuery({
    queryKey: ['dashboard', filters],
    queryFn: async () => {
      return await dashboardApi.getSummary(filters);
    },
  });
};

export default useDashboard;
