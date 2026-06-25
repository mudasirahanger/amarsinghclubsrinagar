import api from './api';
import * as SecureStore from 'expo-secure-store';
import { cacheService } from './cacheService';
import { syncQueue } from './syncQueue';

export const authService = {
  login: async (memberId: string, secretCode: string) => {
    const response = await api.post('/login', {
      member_id: memberId,
      password: secretCode,
    });
    return response.data;
  },

  updateSecretCode: async (currentCode: string, newCode: string) => {
    const response = await api.post('/update-secret-code', {
      current_code: currentCode,
      new_code: newCode,
    });
    return response.data;
  },

  updateProfile: async (data: { email: string; phone: string }) => {
    const response = await api.post('/user/profile', data);
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/logout');
    } catch {
      // Ignore API errors on logout
    }
    await SecureStore.deleteItemAsync('userToken');
    await cacheService.clearAll();
    await syncQueue.clear();
    return { success: true };
  },

  getProfile: async () => {
    const response = await api.get('/user');
    return response.data;
  },
};
