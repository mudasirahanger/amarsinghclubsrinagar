import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface WalletCardProps {
  balance: string;
  memberId: string;
  onTopUpPress: () => void;
}

export default function WalletCard({ balance, memberId, onTopUpPress }: WalletCardProps) {
  return (
    <View className="bg-primary p-6 rounded-3xl mb-8 shadow-lg relative overflow-hidden">
      <View className="absolute -top-12 -right-12 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
      
      <View className="flex-row justify-between items-start mb-8">
        <View>
          <Text className="text-[10px] font-label font-bold uppercase tracking-widest text-white/70 mb-1">
            Club Balance
          </Text>
          <Text className="font-headline text-4xl font-bold text-white">
            ₹{balance ? parseFloat(balance).toLocaleString('en-IN') : '0'}
          </Text>
        </View>
        <MaterialIcons name="account-balance-wallet" size={28} color="#cca72f" />
      </View>

      <View className="flex-row items-center justify-between mt-2">
        <View className="flex-row items-center">
          <Text className="font-body text-white/80 text-xs uppercase tracking-wider">
            ID: {memberId || 'ASC-XXXX'}
          </Text>
        </View>
        <TouchableOpacity 
          className="bg-tertiary px-5 py-2.5 rounded-xl shadow-sm"
          onPress={onTopUpPress}
        >
          <Text className="font-label text-xs font-bold uppercase tracking-widest text-white">Top Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}