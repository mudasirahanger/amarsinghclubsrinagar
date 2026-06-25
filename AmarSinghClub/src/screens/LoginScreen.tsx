import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';

import { authService } from '../services/authService';
import { cacheService } from '../services/cacheService';

const REMEMBER_KEY = 'rememberLogin';

export default function LoginScreen({ navigation }: any) {
  const [memberId, setMemberId] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({ memberId: '', secretCode: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  useEffect(() => {
    const loadRememberedMember = async () => {
      const saved = await cacheService.get<{ memberId: string; remember: boolean }>(REMEMBER_KEY);
      if (saved?.remember && saved.memberId) {
        setMemberId(saved.memberId);
        setRememberMe(true);
      }
    };
    loadRememberedMember();
  }, []);

  const validateForm = () => {
    let isValid = true;
    const newErrors = { memberId: '', secretCode: '' };

    if (!memberId.trim()) {
      newErrors.memberId = 'Member ID is required.';
      isValid = false;
    } else if (memberId.length < 4) {
      newErrors.memberId = 'Member ID must be at least 4 digits.';
      isValid = false;
    }

    if (!secretCode) {
      newErrors.secretCode = 'Secret Code is required.';
      isValid = false;
    } else if (secretCode.length < 4) {
      newErrors.secretCode = 'Secret Code must be exactly 4 digits.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const fullMemberId = `ASC-${memberId.toUpperCase()}`;
      const data = await authService.login(fullMemberId, secretCode);

      await SecureStore.setItemAsync('userToken', data.token);
      await cacheService.set('userData', data.user);

      if (rememberMe) {
        await cacheService.set(REMEMBER_KEY, { memberId, remember: true });
      } else {
        await cacheService.remove(REMEMBER_KEY);
      }

      Toast.show({
        type: 'clubSuccess',
        text1: 'Welcome Back',
        text2: `Access granted for ${data.user.name}`,
      });

      navigation.replace('MainTabs');
    } catch (error: any) {
      let errorMessage = 'Could not connect to the Club servers.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Toast.show({
        type: 'clubError',
        text1: 'Access Denied',
        text2: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="bg-surface-container-low rounded-2xl p-8 shadow-sm">
            <View className="items-center mb-8 mt-[-60px]">
              <View className="w-24 h-24 bg-background rounded-full items-center justify-center border-4 border-[#fff8f2] shadow-md overflow-hidden">
                <Image
                  source={require('../../assets/images/logo.png')}
                  style={{ width: 64, height: 64 }}
                  resizeMode="contain"
                />
              </View>
            </View>

            <View className="items-center mb-10">
              <Text className="font-headline text-3xl font-bold text-primary mb-2">Welcome Back</Text>
              <Text className="text-on-surface-variant font-label text-xs uppercase tracking-widest opacity-80">
                Member Portal Access
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-[10px] font-label font-bold uppercase tracking-[0.1em] text-on-surface-variant mb-2 ml-1">
                Member ID
              </Text>
              <View
                className={`flex-row items-center bg-surface-container-high rounded-xl px-4 py-4 border ${errors.memberId ? 'border-[#8d4b4b]' : 'border-transparent'}`}
              >
                <MaterialIcons name="badge" size={20} color={errors.memberId ? '#8d4b4b' : '#727877'} />
                <Text className="ml-4 font-headline text-primary font-bold text-base tracking-widest">ASC - </Text>
                <TextInput
                  className="flex-1 ml-2 font-body text-primary text-base font-bold"
                  placeholder="0000"
                  placeholderTextColor="#c1c8c6"
                  value={memberId}
                  onChangeText={(val) => {
                    setMemberId(val.replace(/[^0-9]/g, ''));
                    if (errors.memberId) setErrors({ ...errors, memberId: '' });
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
              {errors.memberId ? (
                <Text className="text-[#8d4b4b] font-body text-xs mt-1.5 ml-1">{errors.memberId}</Text>
              ) : null}
            </View>

            <View className="mb-8">
              <Text className="text-[10px] font-label font-bold uppercase tracking-[0.1em] text-on-surface-variant mb-2 ml-1">
                Secret Code
              </Text>
              <View
                className={`flex-row items-center bg-surface-container-high rounded-xl px-4 py-4 border ${errors.secretCode ? 'border-[#8d4b4b]' : 'border-transparent'}`}
              >
                <MaterialIcons name="lock" size={20} color={errors.secretCode ? '#8d4b4b' : '#727877'} />
                <TextInput
                  className="flex-1 ml-4 font-body text-primary text-base"
                  placeholder="••••"
                  placeholderTextColor="#c1c8c6"
                  secureTextEntry={!isPasswordVisible}
                  value={secretCode}
                  onChangeText={(val) => {
                    setSecretCode(val.replace(/[^0-9]/g, ''));
                    if (errors.secretCode) setErrors({ ...errors, secretCode: '' });
                  }}
                  maxLength={4}
                  keyboardType="number-pad"
                />
                <TouchableOpacity
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  className="p-1"
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={isPasswordVisible ? 'visibility' : 'visibility-off'}
                    size={20}
                    color="#727877"
                  />
                </TouchableOpacity>
              </View>
              {errors.secretCode ? (
                <Text className="text-[#8d4b4b] font-body text-xs mt-1.5 ml-1">{errors.secretCode}</Text>
              ) : null}
            </View>

            <View className="flex-row justify-between items-center mb-10">
              <TouchableOpacity className="flex-row items-center" onPress={() => setRememberMe(!rememberMe)}>
                <View
                  className={`w-5 h-5 rounded items-center justify-center mr-3 ${rememberMe ? 'bg-secondary' : 'bg-surface-container-highest'}`}
                >
                  {rememberMe && <MaterialIcons name="check" size={14} color="white" />}
                </View>
                <Text className="text-sm font-body font-medium text-on-surface-variant">Remember my ID</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className={`py-5 rounded-xl flex-row justify-center items-center shadow-lg ${isLoading ? 'bg-primary/80' : 'bg-primary'}`}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text className="text-white font-label font-bold tracking-wide text-base mr-2">LOGIN</Text>
                  <MaterialIcons name="chevron-right" size={22} color="white" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
