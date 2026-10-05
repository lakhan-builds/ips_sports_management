import api from './client';

export const branchesApi = {
  list: async (params = {}) => {
    const response = await api.get('/branches/', { params });
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/branches/${id}/`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/branches/', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/branches/${id}/`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/branches/${id}/`);
    return response.data;
  },
};
