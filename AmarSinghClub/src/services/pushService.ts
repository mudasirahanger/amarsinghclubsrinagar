import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from './api';

// Tell the app to show alerts and play sounds even if the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
  }),
});

export const pushService = {
  registerForPushNotificationsAsync: async () => {
    let token;

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#cca72f',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      
      if (!projectId) {
        console.log("No EAS Project ID found!");
      }

      // Get the token from Expo
      token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId
      });

      // Send the token securely to our Laravel Backend!
      try {
        await api.post('/user/push-token', { 
          token: token.data,
          device_os: Platform.OS
        });
        console.log("Push token securely saved to Laravel:", token.data);
      } catch (error) {
        console.log("Failed to save push token to backend");
      }
      
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }
};