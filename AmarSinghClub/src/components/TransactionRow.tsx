import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface TransactionProps {
  transaction: any;
}

export default function TransactionRow({ transaction }: TransactionProps) {
  const isCredit = transaction.type === 'credit';
  const isPending = transaction.status === 'pending';
  
  const iconName = isPending ? 'schedule' : (isCredit ? 'account-balance-wallet' : 'local-activity');
  const iconColor = isPending ? '#f57c00' : (isCredit ? '#2e5a1c' : '#735c00');
  const bgClass = isPending ? 'bg-[#fff8e1]' : (isCredit ? 'bg-[#e0ecd8]' : 'bg-surface-container-highest');
  const textColor = isPending ? 'text-[#f57c00]' : (isCredit ? 'text-[#2e5a1c]' : 'text-primary');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View className="bg-surface-container-low p-4 rounded-2xl flex-row items-center mb-3">
      <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${bgClass}`}>
        <MaterialIcons name={iconName} size={20} color={iconColor} />
      </View>
      <View className="flex-1 pr-2">
        <Text className="font-label text-sm font-bold text-primary" numberOfLines={1}>
          {transaction.description || (isCredit ? 'Wallet Top-Up' : 'Club Purchase')}
        </Text>
        <Text className="font-body text-[11px] text-on-surface-variant mt-0.5">
          {formatDate(transaction.created_at)}
        </Text>
      </View>
      <View className="items-end">
        <Text className={`font-headline text-base font-bold ${textColor}`}>
          {isCredit ? '+' : '-'}₹{parseFloat(transaction.amount).toLocaleString('en-IN')}
        </Text>
        {isPending && (
          <Text className="font-label text-[8px] font-bold text-orange-800 uppercase tracking-widest mt-1">Pending</Text>
        )}
      </View>
    </View>
  );
}