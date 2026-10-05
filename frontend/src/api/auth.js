import api from './client';

export const authApi = {
  login: async (username, password) => {
    const response = await api.post('/auth/login/', { username, password });
    return response.data;
  },
  me: async () => {
    const response = await api.get('/auth/me/');
    return response.data;
  },
  changePassword: async (old_password, new_password) => {
    const response = await api.post('/auth/change-password/', { old_password, new_password });
    return response.data;
  },
};
