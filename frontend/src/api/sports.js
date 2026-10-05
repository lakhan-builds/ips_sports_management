import api from './client';

export const sportsApi = {
  list: async (params = {}) => {
    const response = await api.get('/sports/', { params });
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/sports/${id}/`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/sports/', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/sports/${id}/`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/sports/${id}/`);
    return response.data;
  },
};
