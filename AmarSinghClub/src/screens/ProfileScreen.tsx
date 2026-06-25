import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Switch , Platform, Modal , KeyboardAvoidingView ,TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';

// Import our API Service
import { authService } from '../services/authService';
import { cacheService } from '../services/cacheService';
import ProfileUpdateModal from '../components/ProfileUpdateModal';

export default function ProfileScreen({ navigation }: any) {
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Biometric States
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentCode, setCurrentCode] = useState('');
  const [newCode, setNewCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [isUpdatingCode, setIsUpdatingCode] = useState(false);

  // Profile Update State
  const [isProfileUpdateVisible, setIsProfileUpdateVisible] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // 1. Check if the phone has FaceID/Fingerprint hardware
  useEffect(() => {
    const checkBiometrics = async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);
      
      // Check if user previously enabled it
      const savedPreference = await cacheService.get<string>('biometricEnabled');
      if (savedPreference === 'true') setIsBiometricEnabled(true);
    };
    checkBiometrics();
  }, []);

  // 2. Fetch live data every time screen opens
  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        setIsLoading(true);
        try {
          const freshData = await authService.getProfile();
          setProfileData(freshData);
          await cacheService.set('userData', freshData);
        } catch (error: any) {
          const storedData = await cacheService.get<any>('userData');
          if (storedData) {
            setProfileData(storedData);
          } else {
            handleForceLogout();
          }
        } finally {
          setIsLoading(false);
        }
      };

      fetchProfile();
    }, [])
  );

  // 3. Handle Biometric Toggle
  // 3. Handle Biometric Toggle
  const toggleBiometrics = async () => {
    if (isBiometricEnabled) {
      // Turn off
      setIsBiometricEnabled(false);
      await cacheService.set('biometricEnabled', 'false');
      Toast.show({ type: 'clubSuccess', text1: 'Biometrics Disabled' });
    } else {
      // 1. Check if they actually have a Face/Fingerprint enrolled in their phone settings
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        Toast.show({ 
          type: 'clubError', 
          text1: 'Not Setup', 
          text2: 'Please set up FaceID/TouchID in your phone settings first.' 
        });
        return;
      }

      // 2. Try to authenticate
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable Quick Login',
        fallbackLabel: 'Use Secret Code',
        disableDeviceFallback: false, // Allows them to use their PIN if FaceID fails
      });

      if (result.success) {
        setIsBiometricEnabled(true);
        await cacheService.set('biometricEnabled', 'true');
        Toast.show({ type: 'clubSuccess', text1: 'Biometrics Enabled', text2: 'You can now log in with FaceID/TouchID' });
      } else {
        // Log the exact reason it failed
        console.log("BIOMETRIC ERROR: ", result.error);
        
        Toast.show({ 
          type: 'clubError', 
          text1: 'Authentication Failed',
          text2: result.error === 'user_cancel' ? 'You cancelled the prompt.' : 'Please try again.'
        });
      }
    }
  };

  // 4. Handle Secure Logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
      Toast.show({
        type: 'clubSuccess',
        text1: 'Logged Out',
        text2: 'Your session has been securely closed.',
      });
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleForceLogout = async () => {
    await authService.logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const submitNewSecretCode = async () => {
    if (!currentCode || !newCode || !confirmCode) {
      Toast.show({ type: 'clubError', text1: 'Missing Fields', text2: 'Please fill out all fields.' });
      return;
    }
    if (newCode.length !== 4) {
      Toast.show({ type: 'clubError', text1: 'Invalid Length', text2: 'New code must be exactly 4 digits.' });
      return;
    }
    if (newCode !== confirmCode) {
      Toast.show({ type: 'clubError', text1: 'Mismatch', text2: 'The new codes do not match.' });
      return;
    }

    setIsUpdatingCode(true);

    try {
      await authService.updateSecretCode(currentCode, newCode);
      
      Toast.show({ type: 'clubSuccess', text1: 'Success', text2: 'Your Secret Code has been updated.' });
      
      // Reset form and close modal
      setCurrentCode('');
      setNewCode('');
      setConfirmCode('');
      setIsModalVisible(false);

    } catch (error: any) {
      let msg = "Failed to update code.";
      if (error.response?.data?.message) {
        msg = error.response.data.message;
      }
      Toast.show({ type: 'clubError', text1: 'Update Failed', text2: msg });
    } finally {
      setIsUpdatingCode(false);
    }
  };

  const handleUpdateProfile = async (email: string, phone: string) => {
    setIsUpdatingProfile(true);
    try {
      const response = await authService.updateProfile({ email, phone });
      setProfileData(response.user);
      setIsProfileUpdateVisible(false);
      Toast.show({ type: 'clubSuccess', text1: 'Profile Updated', text2: 'Your contact details have been updated.' });
    } catch (error: any) {
      let msg = "Failed to update profile.";
      if (error.response?.data?.message) {
        msg = error.response.data.message;
      }
      Toast.show({ type: 'clubError', text1: 'Update Failed', text2: msg });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  if (isLoading && !profileData) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#132c2a" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar style="dark" />
      
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-background">
        <View className="flex-row items-center">
          <TouchableOpacity className="p-2 -ml-2 rounded-full" onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#132c2a" />
          </TouchableOpacity>
          <Text className="ml-4 font-headline text-xl font-bold text-primary-container">Amar Singh Club</Text>
        </View>
        <TouchableOpacity>
           <Image 
                source={require('../../assets/images/logo.png')}
                className="w-8 h-8"
                resizeMode="contain"
            />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Profile Header Block */}
        <View className="items-center mb-10">
          <View className="relative mb-6">
            <View className="w-32 h-32 rounded-2xl bg-surface-container-highest border-2 border-tertiary overflow-hidden items-center justify-center">
              <Text className="font-headline text-5xl font-bold text-primary">
                {profileData?.name ? profileData.name.charAt(0) : 'M'}
              </Text>
            </View>
            <View className="absolute -bottom-3 self-center bg-tertiary px-4 py-1.5 rounded-full shadow-sm">
              <Text className="text-white font-label text-[10px] font-bold tracking-widest uppercase">
                {profileData?.member_tier || 'Standard'} Patron
              </Text>
            </View>
          </View>
          
          <Text className="text-[10px] font-label font-bold uppercase tracking-[0.15em] text-secondary mb-1">
            Member Identity
          </Text>
          <Text className="font-headline text-3xl font-bold text-primary mb-2 text-center">
            {profileData?.name || 'Member Name'}
          </Text>
          <View className="flex-row items-center">
            <Text className="font-body text-on-surface-variant text-xs uppercase tracking-wider">ID: {profileData?.member_id}</Text>
            <Text className="text-tertiary mx-2">•</Text>
            <Text className="font-body text-on-surface-variant text-xs uppercase tracking-wider">Active</Text>
          </View>
        </View>

        {/* Personal Information Card */}
        <View className="bg-surface-container-low p-6 rounded-2xl mb-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="font-headline text-xl font-bold text-primary">Personal Information</Text>
            <TouchableOpacity onPress={() => setIsProfileUpdateVisible(true)}>
              <MaterialIcons name="edit" size={20} color="#735c00" />
            </TouchableOpacity>
          </View>

          <View className="mb-4">
            <Text className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1">Email Address</Text>
            <View className="border-b border-outline-variant pb-2 opacity-60">
              <Text className="font-body text-base text-primary font-medium">
                {profileData?.email || 'Not provided'}
              </Text>
            </View>
          </View>
          
          <View className="mb-4">
            <Text className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1">Phone Number</Text>
            <View className="border-b border-outline-variant pb-2 opacity-60">
              <Text className="font-body text-base text-primary font-medium">
                {profileData?.phone || 'Not provided'}
              </Text>
            </View>
          </View>

          <View>
            <Text className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1">Status</Text>
            <View className="border-b border-outline-variant pb-2 opacity-60 flex-row items-center">
               <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
              <Text className="font-body text-base text-primary font-medium capitalize">
                {profileData?.status || 'Active'}
              </Text>
            </View>
          </View>
        </View>

        {/* Club Preferences Card */}
        <View className="bg-surface-container-highest p-6 rounded-2xl mb-6 border-l-4 border-secondary overflow-hidden">
          <Text className="font-headline text-xl font-bold text-primary mb-6">Club Preferences</Text>
          
          <View className="flex-row items-start mb-5">
            <MaterialIcons name="restaurant" size={24} color="#8d4b4b" className="mt-1" />
            <View className="ml-4 flex-1">
              <Text className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1">Favorite Table</Text>
              <Text className="font-body text-base text-primary font-medium">Window Side - Table 12</Text>
            </View>
          </View>

          <View className="flex-row items-start mb-6">
            <MaterialIcons name="no-meals" size={24} color="#8d4b4b" className="mt-1" />
            <View className="ml-4 flex-1">
              <Text className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1">Dietary Restrictions</Text>
              <Text className="font-body text-base text-primary font-medium">None</Text>
            </View>
          </View>

          <TouchableOpacity className="border border-secondary bg-background py-3 rounded-xl items-center opacity-80">
            <Text className="font-label text-xs font-bold uppercase tracking-widest text-secondary">Update Preferences</Text>
          </TouchableOpacity>
        </View>

        {/* Security & Access Card */}
        <View className="bg-surface-container-low p-6 rounded-2xl mb-8">
          <Text className="font-headline text-xl font-bold text-primary mb-2">Security & Access</Text>
          <Text className="font-body text-sm text-on-surface-variant mb-6 leading-5">
            Manage your digital key, biometric login, and notification protocols for club updates.
          </Text>

          {isBiometricSupported && (
            <View className="flex-row items-center justify-between bg-background px-4 py-3 rounded-lg mb-6 shadow-sm border border-outline-variant/20">
              <View className="flex-row items-center">
                <MaterialIcons name={Platform.OS === 'ios' ? "face" : "fingerprint"} size={20} color={isBiometricEnabled ? "#735c00" : "#727877"} />
                <Text className="ml-3 font-label text-sm font-bold text-primary">FaceID / TouchID</Text>
              </View>
              <Switch 
                value={isBiometricEnabled}
                onValueChange={toggleBiometrics}
                trackColor={{ false: '#c1c8c6', true: '#cca72f' }}
                thumbColor={'#ffffff'}
              />
            </View>
          )}

          <TouchableOpacity 
            className="bg-primary py-4 rounded-xl items-center shadow-md"
            onPress={() => setIsModalVisible(true)}
          >
            <Text className="font-label text-xs font-bold uppercase tracking-widest text-white">Change Secret Code</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          className={`flex-row items-center justify-center py-4 mb-4 ${isLoggingOut ? 'opacity-50' : ''}`}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color="#8d4b4b" />
          ) : (
            <>
              <MaterialIcons name="logout" size={22} color="#8d4b4b" />
              <Text className="ml-3 font-label text-sm font-bold uppercase tracking-widest text-secondary">Log Out</Text>
            </>
          )}
        </TouchableOpacity>


        {/* --- NEW: PASSWORD UPDATE MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <View className="flex-1 justify-end bg-black/60">
            <View className="bg-background rounded-t-[32px] p-6 shadow-xl">
              
              <View className="flex-row justify-between items-center mb-6">
                <Text className="font-headline text-xl font-bold text-primary">Change Secret Code</Text>
                <TouchableOpacity onPress={() => setIsModalVisible(false)} className="p-2 bg-surface-container-low rounded-full">
                  <MaterialIcons name="close" size={20} color="#132c2a" />
                </TouchableOpacity>
              </View>

              <View className="mb-4">
                <Text className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-2">Current Code</Text>
                <TextInput
                  className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-4 font-body text-primary text-base tracking-widest"
                  placeholder="••••"
                  secureTextEntry
                  maxLength={4}
                  keyboardType="number-pad"
                  value={currentCode}
                  onChangeText={setCurrentCode}
                />
              </View>

              <View className="mb-4">
                <Text className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-2">New 4-Digit Code</Text>
                <TextInput
                  className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-4 font-body text-primary text-base tracking-widest"
                  placeholder="••••"
                  secureTextEntry
                  maxLength={4}
                  keyboardType="number-pad"
                  value={newCode}
                  onChangeText={setNewCode}
                />
              </View>

              <View className="mb-8">
                <Text className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-2">Confirm New Code</Text>
                <TextInput
                  className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-4 font-body text-primary text-base tracking-widest"
                  placeholder="••••"
                  secureTextEntry
                  maxLength={4}
                  keyboardType="number-pad"
                  value={confirmCode}
                  onChangeText={setConfirmCode}
                />
              </View>

              <TouchableOpacity 
                className={`py-4 rounded-xl items-center shadow-md mb-8 ${isUpdatingCode ? 'bg-primary/80' : 'bg-primary'}`}
                onPress={submitNewSecretCode}
                disabled={isUpdatingCode}
              >
                {isUpdatingCode ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="font-label text-sm font-bold uppercase tracking-widest text-white">Save New Code</Text>
                )}
              </TouchableOpacity>

            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ProfileUpdateModal
        visible={isProfileUpdateVisible}
        initialEmail={profileData?.email || ''}
        initialPhone={profileData?.phone || ''}
        isLoading={isUpdatingProfile}
        onSave={handleUpdateProfile}
        onDismiss={() => setIsProfileUpdateVisible(false)}
      />

      </ScrollView>
    </SafeAreaView>
  );
}