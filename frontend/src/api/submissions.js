import api from './client';

export const submissionsApi = {
  list: async (params = {}) => {
    const response = await api.get('/submissions/', { params });
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/submissions/${id}/`);
    return response.data;
  },
  submit: async (data) => {
    const response = await api.post('/submissions/', data);
    return response.data;
  },
  exportCsvUrl: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return `/api/v1/submissions/export/${query ? `?${query}` : ''}`;
  },
};
