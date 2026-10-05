import api from './client';

export const selectionsApi = {
  list: async (params = {}) => {
    const response = await api.get('/selections/', { params });
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/selections/${id}/`);
    return response.data;
  },
  select: async (submission_id, notes = '') => {
    const response = await api.post('/selections/select/', { submission_id, notes });
    return response.data;
  },
  unselect: async (submission_id, notes = '') => {
    const response = await api.post('/selections/unselect/', { submission_id, notes });
    return response.data;
  },
  exportCsvUrl: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return `/api/v1/selections/export/${query ? `?${query}` : ''}`;
  },
};
