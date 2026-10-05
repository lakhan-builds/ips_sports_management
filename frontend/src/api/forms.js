import api from './client';

export const formsApi = {
  list: async (params = {}) => {
    const response = await api.get('/forms/', { params });
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/forms/${id}/`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/forms/', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/forms/${id}/`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/forms/${id}/`);
    return response.data;
  },
  publish: async (id) => {
    const response = await api.post(`/forms/${id}/publish/`);
    return response.data;
  },
  close: async (id) => {
    const response = await api.post(`/forms/${id}/close/`);
    return response.data;
  },
  reopen: async (id) => {
    const response = await api.post(`/forms/${id}/reopen/`);
    return response.data;
  },
};
