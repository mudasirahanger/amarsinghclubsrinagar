import { createNavigationContainerRef } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  Scanner: undefined;
  PaymentSuccess: Record<string, unknown>;
  Notifications: undefined;
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();
