import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import NetInfo from '@react-native-community/netinfo';
import api from './api';

const QUEUE_KEY = '@AmarSinghClub:SyncQueue';

export interface QueuedRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  headers?: any;
  timestamp: number;
}

export const syncQueue = {
  /**
   * Add a failed request to the offline queue
   */
  async enqueue(request: Omit<QueuedRequest, 'id' | 'timestamp'>): Promise<void> {
    try {
      const queue = await this.getQueue();
      const newRequest: QueuedRequest = {
        ...request,
        id: Crypto.randomUUID(),
        timestamp: Date.now(),
      };
      
      queue.push(newRequest);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      console.log(`[SyncQueue] Added request ${newRequest.id} to queue. Total: ${queue.length}`);
    } catch (e) {
      console.error('[SyncQueue] Error enqueueing request', e);
    }
  },

  /**
   * Get all queued requests
   */
  async getQueue(): Promise<QueuedRequest[]> {
    try {
      const json = await AsyncStorage.getItem(QUEUE_KEY);
      return json ? JSON.parse(json) : [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Flush the queue by attempting to send all queued requests
   */
  async flush(): Promise<void> {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.log('[SyncQueue] Cannot flush, no internet connection.');
      return;
    }

    const queue = await this.getQueue();
    if (queue.length === 0) return;

    console.log(`[SyncQueue] Attempting to flush ${queue.length} requests...`);
    const remainingQueue: QueuedRequest[] = [];

    for (const req of queue) {
      try {
        console.log(`[SyncQueue] Processing ${req.method} ${req.url}`);
        // We bypass the standard interceptor to avoid infinite queueing loops
        await api.request({
          url: req.url,
          method: req.method,
          data: req.data,
          headers: req.headers,
          // Add a special header so the interceptor knows this is a background sync
          _isBackgroundSync: true 
        } as any);
        console.log(`[SyncQueue] Successfully processed ${req.id}`);
      } catch (error: any) {
        // If it's a 5xx error or network error, keep it in the queue
        if (!error.response || error.response.status >= 500) {
          console.log(`[SyncQueue] Request ${req.id} failed again, keeping in queue.`);
          remainingQueue.push(req);
        } else {
          // It's a 4xx error (e.g., validation failed, unauthorized), drop it
          console.error(`[SyncQueue] Request ${req.id} failed permanently (4xx), dropping from queue.`, error.response.data);
        }
      }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
    console.log(`[SyncQueue] Flush complete. ${remainingQueue.length} requests remain.`);
  },

  /**
   * Clear the queue (e.g. on logout)
   */
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY);
  }
};

// Setup network listener to flush queue automatically when coming back online
NetInfo.addEventListener(state => {
  if (state.isConnected && state.isInternetReachable) {
    syncQueue.flush();
  }
});
