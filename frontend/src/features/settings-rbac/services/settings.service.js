import api from '../../../lib/axios.js';

export const settingsApi = {
  getRoles: async () => {
    const response = await api.get('/settings/roles');
    return response.data.data;
  },
  updatePermissions: async (data) => {
    const response = await api.put('/settings/permissions', data);
    return response.data.data;
  },
};

export default settingsApi;
