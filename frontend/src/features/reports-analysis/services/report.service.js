import api from '../../../lib/axios.js';

export const reportApi = {
  getAnalytics: async () => {
    const response = await api.get('/reports');
    return response.data.data;
  },
  exportCSV: async () => {
    const response = await api.get('/reports/export', {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default reportApi;
