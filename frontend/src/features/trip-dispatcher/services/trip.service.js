import api from '../../../lib/axios.js';

const clean = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '' && v != null));

export const tripApi = {
  getTrips: async (params = {}) => {
    const response = await api.get('/trips', { params: clean(params) });
    return response.data;
  },
  getTripById: async (id) => {
    const response = await api.get(`/trips/${id}`);
    return response.data.data;
  },
  createTrip: async (data) => {
    const response = await api.post('/trips', data);
    return response.data.data;
  },
  dispatchTrip: async (id) => {
    const response = await api.post(`/trips/${id}/dispatch`);
    return response.data.data;
  },
  completeTrip: async (id, data) => {
    const response = await api.post(`/trips/${id}/complete`, data);
    return response.data.data;
  },
  cancelTrip: async (id) => {
    const response = await api.post(`/trips/${id}/cancel`);
    return response.data.data;
  },
};

export default tripApi;
