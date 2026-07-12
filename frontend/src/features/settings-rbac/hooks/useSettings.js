import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../services/settings.service.js';
import toast from 'react-hot-toast';

export const useSettingsRoles = () => {
  return useQuery({
    queryKey: ['settingsRoles'],
    queryFn: () => settingsApi.getRoles(),
  });
};

export const useUpdatePermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => settingsApi.updatePermissions(data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['settingsRoles'] });
      toast.success(`Permissions for role '${updated.roleName}' updated successfully`);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update role permissions');
    },
  });
};
