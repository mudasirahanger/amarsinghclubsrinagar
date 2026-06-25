import api from './api';

export const notificationService = {
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },
  markAsRead: async () => {
    const response = await api.post('/notifications/read');
    return response.data;
  }
};