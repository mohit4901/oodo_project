import api from '../../../lib/axios.js';

export const vehicleApi = {
  getVehicles: async (params = {}) => {
    const response = await api.get('/vehicles', { params });
    return response.data;
  },
  getVehicleById: async (id) => {
    const response = await api.get(`/vehicles/${id}`);
    return response.data.data;
  },
  createVehicle: async (data) => {
    const response = await api.post('/vehicles', data);
    return response.data.data;
  },
  updateVehicle: async (id, data) => {
    const response = await api.put(`/vehicles/${id}`, data);
    return response.data.data;
  },
  deleteVehicle: async (id) => {
    const response = await api.delete(`/vehicles/${id}`);
    return response.data;
  },
};

export default vehicleApi;
