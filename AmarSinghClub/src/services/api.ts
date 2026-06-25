import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { syncQueue } from './syncQueue';
import { cacheService } from './cacheService';
import { navigationRef } from '../navigation/navigationRef';
import { API_BASE_URL } from '../constants/config';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
        if (!config.headers['X-Idempotency-Key']) {
          config.headers['X-Idempotency-Key'] = Crypto.randomUUID();
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error in request interceptor', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('userToken');
      await cacheService.clearAll();

      if (navigationRef.isReady()) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    }

    if ((!error.response || error.response.status >= 500) && config && !config._isBackgroundSync) {
      if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
        const payload =
          typeof config.data === 'string'
            ? JSON.parse(config.data)
            : config.data;

        await syncQueue.enqueue({
          url: config.url,
          method: config.method.toUpperCase(),
          data: payload,
          headers: config.headers,
        });

        return Promise.reject({ isOfflineQueued: true, originalError: error });
      }
    }

    return Promise.reject(error);
  }
);

export default api;
