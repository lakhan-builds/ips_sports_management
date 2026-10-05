import api from './client';

export const usersApi = {
  list: async (params = {}) => {
    const response = await api.get('/users/', { params });
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/users/${id}/`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/users/', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/users/${id}/`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/users/${id}/`);
    return response.data;
  },
  resetPassword: async (id, new_password) => {
    const response = await api.post(`/users/${id}/reset-password/`, { new_password });
    return response.data;
  },
  auditLogs: async (params = {}) => {
    const response = await api.get('/audit-logs/', { params });
    return response.data;
  },
};
