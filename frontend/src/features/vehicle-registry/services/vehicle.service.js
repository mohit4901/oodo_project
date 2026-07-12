import api from '../../../lib/axios.js';

/** Strip keys whose value is falsy (empty string, null, undefined) */
const clean = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '' && v != null));

export const vehicleApi = {
  getVehicles: async (params = {}) => {
    const response = await api.get('/vehicles', { params: clean(params) });
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
