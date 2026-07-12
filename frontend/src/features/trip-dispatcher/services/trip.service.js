import api from '../../../lib/axios.js';

export const tripApi = {
  getTrips: async (params = {}) => {
    const response = await api.get('/trips', { params });
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
