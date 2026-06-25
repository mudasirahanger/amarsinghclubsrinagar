import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@AmarSinghClub:';

export const cacheService = {
  /**
   * Save structured data to local cache
   */
  async set(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, jsonValue);
    } catch (e) {
      console.error('Error writing to cache', e);
    }
  },

  /**
   * Retrieve structured data from local cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error('Error reading from cache', e);
      return null;
    }
  },

  /**
   * Remove a specific key from local cache
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } catch (e) {
      console.error('Error removing from cache', e);
    }
  },

  /**
   * Clear all app cache (e.g. on logout)
   */
  async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(appKeys);
    } catch (e) {
      console.error('Error clearing cache', e);
    }
  }
};
