import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface ProfileUpdateModalProps {
  visible: boolean;
  initialEmail: string;
  initialPhone: string;
  isLoading: boolean;
  onSave: (email: string, phone: string) => void;
  onDismiss: () => void;
}

export default function ProfileUpdateModal({ 
  visible, 
  initialEmail, 
  initialPhone, 
  isLoading, 
  onSave, 
  onDismiss 
}: ProfileUpdateModalProps) {
  
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Update local state when modal opens with new props
  useEffect(() => {
    if (visible) {
      setEmail(initialEmail || '');
      setPhone(initialPhone || '');
    }
  }, [visible, initialEmail, initialPhone]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <View className="flex-1 bg-black/60 items-center justify-end">
          <View className="bg-background w-full rounded-t-[32px] p-6 shadow-xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="font-headline text-2xl font-bold text-primary">
                Update Information
              </Text>
              <TouchableOpacity onPress={onDismiss} disabled={isLoading} className="p-2 bg-surface-container-low rounded-full">
                <MaterialIcons name="close" size={20} color="#132c2a" />
              </TouchableOpacity>
            </View>
          
          <Text className="font-body text-sm text-on-surface-variant mb-6">
            Keep your contact information up to date so we can send you club announcements and receipts.
          </Text>

          <View className="mb-4">
            <Text className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">
              Email Address
            </Text>
            <View className="bg-surface-container-low rounded-xl px-4 flex-row items-center h-14 border border-outline-variant/30">
              <MaterialIcons name="email" size={20} color="#735c00" className="mr-3 opacity-60" />
              <TextInput
                className="flex-1 font-body text-base text-primary h-full"
                placeholder="Enter email address"
                placeholderTextColor="#A0A0A0"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                editable={!isLoading}
              />
            </View>
          </View>

          <View className="mb-8">
            <Text className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">
              Phone Number
            </Text>
            <View className="bg-surface-container-low rounded-xl px-4 flex-row items-center h-14 border border-outline-variant/30">
              <MaterialIcons name="phone" size={20} color="#735c00" className="mr-3 opacity-60" />
              <TextInput
                className="flex-1 font-body text-base text-primary h-full"
                placeholder="Enter phone number"
                placeholderTextColor="#A0A0A0"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                editable={!isLoading}
              />
            </View>
          </View>

          <View className="w-full gap-3 pb-8">
            <TouchableOpacity 
              className={`w-full py-4 rounded-xl items-center flex-row justify-center ${isLoading ? 'bg-primary/70' : 'bg-primary'}`}
              onPress={() => onSave(email, phone)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#132c2a" />
              ) : (
                <Text className="font-label text-sm font-bold text-secondary uppercase tracking-widest">
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              className="w-full py-4 rounded-xl items-center"
              onPress={onDismiss}
              disabled={isLoading}
            >
              <Text className="font-label text-sm font-bold text-on-surface-variant uppercase tracking-widest">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
