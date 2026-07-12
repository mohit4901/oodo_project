import api from '../../../lib/axios.js';

const clean = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '' && v != null));

export const expenseApi = {
  getFuelLogs: async (params = {}) => {
    const response = await api.get('/expenses/fuel', { params: clean(params) });
    return response.data;
  },
  getExpenses: async (params = {}) => {
    const response = await api.get('/expenses', { params: clean(params) });
    return response.data;
  },
  getVehicleTotalCost: async (vehicleId) => {
    const response = await api.get(`/expenses/vehicle/${vehicleId}/total-cost`);
    return response.data.data;
  },
  logFuel: async (data) => {
    const response = await api.post('/expenses/fuel', data);
    return response.data.data;
  },
  logExpense: async (data) => {
    const response = await api.post('/expenses', data);
    return response.data.data;
  },
};

export default expenseApi;
