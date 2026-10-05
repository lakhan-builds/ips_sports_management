import api from './client';

export const trialsApi = {
  list: async (params = {}) => {
    const response = await api.get('/trials/', { params });
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/trials/${id}/`);
    return response.data;
  },
  create: async (formData) => {
    const response = await api.post('/trials/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  update: async (id, formData) => {
    const response = await api.put(`/trials/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/trials/${id}/`);
    return response.data;
  },
  publish: async (id) => {
    const response = await api.post(`/trials/${id}/publish/`);
    return response.data;
  },
  unpublish: async (id) => {
    const response = await api.post(`/trials/${id}/unpublish/`);
    return response.data;
  },
};
