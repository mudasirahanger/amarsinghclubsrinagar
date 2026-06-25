import Constants from 'expo-constants';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://api.amarsinghclubsrinagar.com/api';

export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export const isExpoGo = Constants.appOwnership === 'expo';
