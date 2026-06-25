import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, Linking, TouchableOpacity, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import Toast, { ToastConfig } from 'react-native-toast-message';
import { MaterialIcons } from '@expo/vector-icons';
import './global.css';

import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { NotoSerif_700Bold } from '@expo-google-fonts/noto-serif';

import LoginScreen from './src/screens/LoginScreen';
import TabNavigator from './src/navigation/TabNavigator';
import ScannerScreen from './src/screens/ScannerScreen';
import PaymentSuccessScreen from './src/screens/PaymentSuccessScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import GlobalPOSAlert from './src/components/GlobalPOSAlert';
import { navigationRef } from './src/navigation/navigationRef';
import { API_BASE_URL, APP_VERSION } from './src/constants/config';
import { cacheService } from './src/services/cacheService';

const Stack = createNativeStackNavigator();

const toastConfig: ToastConfig = {
  clubSuccess: ({ text1, text2 }) => (
    <View className="bg-[#323232] w-[90%] px-4 py-3 rounded shadow-md flex-row items-center mt-10">
      <MaterialIcons name="check-circle" size={20} color="#4caf50" />
      <View className="ml-3 flex-1">
        <Text className="text-white font-body text-sm font-medium">{text1}</Text>
        {text2 ? <Text className="text-white/70 font-body text-xs mt-0.5">{text2}</Text> : null}
      </View>
    </View>
  ),
  clubError: ({ text1, text2 }) => (
    <View className="bg-[#d32f2f] w-[90%] px-4 py-3 rounded shadow-md flex-row items-center mt-10">
      <MaterialIcons name="error-outline" size={20} color="#ffffff" />
      <View className="ml-3 flex-1">
        <Text className="text-white font-body text-sm font-medium">{text1}</Text>
        {text2 ? <Text className="text-white/80 font-body text-xs mt-0.5">{text2}</Text> : null}
      </View>
    </View>
  ),
};

type InitState = 'loading' | 'blocked' | 'biometric' | 'ready';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    NotoSerif_700Bold,
  });

  const [initState, setInitState] = useState<InitState>('loading');
  const [initialRoute, setInitialRoute] = useState<'Login' | 'MainTabs'>('Login');
  const [systemStatus, setSystemStatus] = useState<{
    blocked: boolean;
    reason: 'maintenance' | 'update' | null;
    appStoreUrl?: string;
    playStoreUrl?: string;
  }>({ blocked: false, reason: null });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/system/status`);
        const data = await response.json();

        if (data.maintenance_mode) {
          setSystemStatus({ blocked: true, reason: 'maintenance' });
          setInitState('blocked');
          return;
        }

        if (
          data.minimum_app_version &&
          APP_VERSION.localeCompare(data.minimum_app_version, undefined, {
            numeric: true,
            sensitivity: 'base',
          }) < 0
        ) {
          setSystemStatus({
            blocked: true,
            reason: 'update',
            appStoreUrl: data.app_store_url,
            playStoreUrl: data.play_store_url,
          });
          setInitState('blocked');
          return;
        }

        const token = await SecureStore.getItemAsync('userToken');
        if (token) {
          setInitialRoute('MainTabs');
          const biometricEnabled = (await cacheService.get<string>('biometricEnabled')) === 'true';

          if (biometricEnabled) {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            if (hasHardware && isEnrolled) {
              setInitState('biometric');
              return;
            }
          }
        }
      } catch (e) {
        if (__DEV__) {
          console.error('Failed to fetch system status or token:', e);
        }
        const token = await SecureStore.getItemAsync('userToken');
        if (token) {
          setInitialRoute('MainTabs');
        }
      }

      setInitState('ready');
    };

    initializeApp();
  }, []);

  const unlockWithBiometrics = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Amar Singh Club',
      fallbackLabel: 'Use Secret Code',
    });

    if (result.success) {
      setInitState('ready');
    }
  };

  const signOutFromBiometricGate = async () => {
    await SecureStore.deleteItemAsync('userToken');
    await cacheService.clearAll();
    setInitialRoute('Login');
    setInitState('ready');
  };

  if ((!fontsLoaded && !fontError) || initState === 'loading') {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#132c2a" />
      </View>
    );
  }

  if (initState === 'blocked' || systemStatus.blocked) {
    return (
      <SafeAreaProvider>
        <View className="flex-1 bg-background items-center justify-center p-6">
          <MaterialIcons
            name={systemStatus.reason === 'maintenance' ? 'build' : 'system-update'}
            size={80}
            color="#d4b476"
          />
          <Text className="text-primary text-2xl font-display font-bold mb-4 text-center mt-6">
            {systemStatus.reason === 'maintenance' ? 'Under Maintenance' : 'Update Required'}
          </Text>
          <Text className="text-on-surface-variant text-base font-body text-center mb-8">
            {systemStatus.reason === 'maintenance'
              ? 'We are currently performing scheduled maintenance. Please try again later.'
              : 'A new version of the Amar Singh Club app is available. Please update to continue.'}
          </Text>

          {systemStatus.reason === 'update' && (
            <View className="w-full">
              {systemStatus.appStoreUrl ? (
                <TouchableOpacity
                  className="bg-[#d4b476] py-3 rounded-lg mb-3"
                  onPress={() => Linking.openURL(systemStatus.appStoreUrl!)}
                >
                  <Text className="text-[#132c2a] text-center font-body font-semibold">
                    Update on App Store
                  </Text>
                </TouchableOpacity>
              ) : null}
              {systemStatus.playStoreUrl ? (
                <TouchableOpacity
                  className="bg-[#d4b476] py-3 rounded-lg mb-3"
                  onPress={() => Linking.openURL(systemStatus.playStoreUrl!)}
                >
                  <Text className="text-[#132c2a] text-center font-body font-semibold">
                    Update on Play Store
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </View>
      </SafeAreaProvider>
    );
  }

  if (initState === 'biometric') {
    return (
      <SafeAreaProvider>
        <View className="flex-1 bg-background items-center justify-center p-6">
          <MaterialIcons name="fingerprint" size={72} color="#132c2a" />
          <Text className="text-primary text-2xl font-display font-bold mb-3 text-center mt-6">
            Welcome Back
          </Text>
          <Text className="text-on-surface-variant text-base font-body text-center mb-8">
            Use {Platform.OS === 'ios' ? 'Face ID' : 'biometrics'} to unlock your club wallet.
          </Text>
          <TouchableOpacity
            className="bg-primary py-4 px-8 rounded-xl w-full mb-3"
            onPress={unlockWithBiometrics}
          >
            <Text className="text-white text-center font-label font-bold">Unlock App</Text>
          </TouchableOpacity>
          <TouchableOpacity className="py-3" onPress={signOutFromBiometricGate}>
            <Text className="text-secondary font-label font-bold">Sign in with Secret Code</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen
            name="Scanner"
            component={ScannerScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="PaymentSuccess"
            component={PaymentSuccessScreen}
            options={{ animation: 'fade' }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </Stack.Navigator>
      </NavigationContainer>

      <GlobalPOSAlert />
      <Toast config={toastConfig} topOffset={Platform.OS === 'ios' ? 50 : 40} />
    </SafeAreaProvider>
  );
}
