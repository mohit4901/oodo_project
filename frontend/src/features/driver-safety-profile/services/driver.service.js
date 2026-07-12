import api from '../../../lib/axios.js';

export const driverApi = {
  getDrivers: async (params = {}) => {
    const response = await api.get('/drivers', { params });
    return response.data;
  },
  getDriverById: async (id) => {
    const response = await api.get(`/drivers/${id}`);
    return response.data.data;
  },
  createDriver: async (data) => {
    const response = await api.post('/drivers', data);
    return response.data.data;
  },
  updateDriver: async (id, data) => {
    const response = await api.put(`/drivers/${id}`, data);
    return response.data.data;
  },
  deleteDriver: async (id) => {
    const response = await api.delete(`/drivers/${id}`);
    return response.data;
  },
};

export default driverApi;
