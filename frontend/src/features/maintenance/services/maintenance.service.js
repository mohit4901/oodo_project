import api from '../../../lib/axios.js';

const clean = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '' && v != null));

export const maintenanceApi = {
  getLogs: async (params = {}) => {
    const response = await api.get('/maintenance', { params: clean(params) });
    return response.data;
  },
  getLogById: async (id) => {
    const response = await api.get(`/maintenance/${id}`);
    return response.data.data;
  },
  createLog: async (data) => {
    const response = await api.post('/maintenance', data);
    return response.data.data;
  },
  closeLog: async (id, data) => {
    const response = await api.put(`/maintenance/${id}/close`, data);
    return response.data.data;
  },
};

export default maintenanceApi;
