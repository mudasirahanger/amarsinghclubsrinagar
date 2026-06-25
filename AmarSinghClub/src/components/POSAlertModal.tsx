import React from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface POSAlertModalProps {
  visible: boolean;
  amount: number;
  isLoading: boolean;
  onPay: () => void;
  onCancel: () => void;
  onDismiss: () => void;
}

export default function POSAlertModal({ visible, amount, isLoading, onPay, onCancel, onDismiss }: POSAlertModalProps) {
  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.85)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View className="bg-background w-full rounded-3xl p-8 items-center shadow-2xl border border-outline-variant/10">
          
          <View className="w-16 h-16 bg-[#cca72f]/10 rounded-full items-center justify-center mb-3">
            <MaterialIcons name="receipt-long" size={32} color="#cca72f" />
          </View>
          
          <Text className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-1">
            New Catering Bill
          </Text>
          
          <Text className="font-headline text-5xl font-bold text-primary mb-8 tracking-tighter">
            ₹{amount}
          </Text>

          <View className="w-full gap-3">
            <TouchableOpacity 
              className={`w-full py-4 rounded-xl items-center flex-row justify-center shadow-lg shadow-primary/20 ${isLoading ? 'bg-primary/70' : 'bg-primary'}`}
              onPress={onPay}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#cca72f" />
              ) : (
                <>
                  <MaterialIcons name="account-balance-wallet" size={20} color="#cca72f" style={{ marginRight: 8 }} />
                  <Text className="font-label text-sm font-bold text-[#cca72f] uppercase tracking-[0.15em]">
                    Pay Securely
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              className="w-full py-3.5 rounded-xl items-center border border-[#d32f2f]/20 bg-[#d32f2f]/5"
              onPress={onCancel}
              disabled={isLoading}
              activeOpacity={0.6}
            >
              <Text className="font-label text-xs font-bold text-[#d32f2f] uppercase tracking-[0.1em]">
                Cancel Order
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="w-full py-3 items-center mt-1"
              onPress={onDismiss}
              disabled={isLoading}
            >
              <Text className="font-label text-xs font-bold text-on-surface-variant/50 uppercase tracking-[0.1em]">
                Dismiss for Now
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}
