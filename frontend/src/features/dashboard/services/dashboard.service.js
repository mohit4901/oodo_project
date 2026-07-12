import api from '../../../lib/axios.js';

export const dashboardApi = {
  getSummary: async (filters = {}) => {
    // Clean up empty filters
    const params = {};
    if (filters.vehicleType) params.vehicleType = filters.vehicleType;
    if (filters.region) params.region = filters.region;
    if (filters.status) params.status = filters.status;

    const response = await api.get('/dashboard', { params });
    return response.data.data;
  },
};

export default dashboardApi;
