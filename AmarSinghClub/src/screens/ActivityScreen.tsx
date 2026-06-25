import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { cacheService } from '../services/cacheService';
import Toast from 'react-native-toast-message';

// Import the wallet service to fetch real data
import { walletService } from '../services/walletService';

// Adjusted categories to match current backend capabilities
const CATEGORIES = ['All', 'Purchases', 'Top-ups'];

export default function ActivityScreen({ navigation }: any) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Fetch real transaction history from Laravel
  useFocusEffect(
    useCallback(() => {
      const fetchHistory = async () => {
        // 1. Instant UI from local cache
        const storedHistory = await cacheService.get<any>('walletHistory');
        let cachedTxs = [];
        if (Array.isArray(storedHistory)) {
          cachedTxs = storedHistory;
        } else if (storedHistory && typeof storedHistory === 'object') {
          // Recover from previously corrupted cache object
          cachedTxs = Object.values(storedHistory).filter((x: any) => x && x.id);
        }

        if (cachedTxs.length > 0) {
          setTransactions(cachedTxs);
          setIsLoading(false); // Stop loading immediately since we have data
        } else {
          setIsLoading(true);
        }

        // 2. Fetch fresh data in background
        try {
          const historyData = await walletService.history();
          let txs = [];
          
          if (Array.isArray(historyData)) {
            txs = historyData;
          } else if (historyData?.data && Array.isArray(historyData.data)) {
            txs = historyData.data;
          } else if (historyData?.transactions && Array.isArray(historyData.transactions)) {
            txs = historyData.transactions;
          } else if (historyData?.data?.transactions && Array.isArray(historyData.data.transactions)) {
            txs = historyData.data.transactions;
          } else if (historyData?.data?.data && Array.isArray(historyData.data.data)) {
            txs = historyData.data.data;
          }

          console.log("Parsed transactions count:", txs.length);
          if (txs.length === 0 && __DEV__) {
             console.log("History API Full Response:", JSON.stringify(historyData, null, 2));
          }
          
          setTransactions(txs);
          // Update the cache for next time
          await cacheService.set('walletHistory', txs);
        } catch (error) {
          console.log("Failed to fetch history, relying on cache.", error);
          if (cachedTxs.length === 0) {
            Toast.show({
              type: 'clubError',
              text1: 'Connection Failed',
              text2: 'Unable to load activity history. Please check your network.',
            });
          }
        } finally {
          setIsLoading(false);
        }
      };

      fetchHistory();
    }, [])
  );

  // Filter Logic based on real backend data
  const filteredData = (Array.isArray(transactions) ? transactions : []).filter(tx => {
    // Determine pseudo-category based on type
    const txCategory = tx.type === 'credit' ? 'Top-ups' : 'Purchases';
    
    const matchesCategory = activeFilter === 'All' || txCategory === activeFilter;
    
    const searchString = searchQuery.toLowerCase();
    const desc = tx.description ? tx.description.toLowerCase() : '';
    const txId = tx.transaction_id ? tx.transaction_id.toLowerCase() : '';
    
    const matchesSearch = desc.includes(searchString) || txId.includes(searchString);
    
    return matchesCategory && matchesSearch;
  });

  // Helper to format real dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar style="dark" />

      <View className="flex-row items-center justify-between px-6 py-4">
        <Text className="font-headline text-xl font-bold text-primary-container">Activity</Text>
        <TouchableOpacity>
          <MaterialIcons name="file-download" size={24} color="#132c2a" />
        </TouchableOpacity>
      </View>

      <View className="px-6 mb-2">
        {/* Search Bar */}
        <View className="flex-row items-center bg-surface-container-high rounded-xl px-4 py-3 mb-4">
          <MaterialIcons name="search" size={20} color="#727877" />
          <TextInput
            className="flex-1 ml-3 font-body text-primary text-sm"
            placeholder="Search by ID or description..."
            placeholderTextColor="#727877"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={18} color="#727877" />
            </TouchableOpacity>
          )}
        </View>

        {/* Horizontal Filters (Chips) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {CATEGORIES.map((cat) => {
            const isActive = activeFilter === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveFilter(cat)}
                className={`px-5 py-2 rounded-full mr-2 shadow-sm ${isActive ? 'bg-secondary' : 'bg-surface-container-low'}`}
              >
                <Text className={`font-label text-[11px] uppercase tracking-wider ${isActive ? 'text-white' : 'text-on-surface-variant'}`}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Transaction List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#132c2a" />
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View className="items-center justify-center mt-20 opacity-50">
              <MaterialIcons name="receipt-long" size={48} color="#727877" className="mb-4" />
              <Text className="font-headline text-lg text-primary">No transactions found</Text>
            </View>
          )}
          renderItem={({ item }) => {
            if (!item) return null;
            const isCredit = item.type === 'credit';
            const isPending = item.status === 'pending';
            
            // Dynamic styling based on transaction state
            const iconName = isCredit ? 'account-balance-wallet' : 'local-activity';
            const bgClass = isPending ? 'bg-[#fff8e1]' : (isCredit ? 'bg-[#e0ecd8]' : 'bg-surface-container-highest');
            const iconColor = isPending ? '#f57c00' : (isCredit ? '#2e5a1c' : '#735c00');
            const textColor = isPending ? 'text-[#f57c00]' : (isCredit ? 'text-[#2e5a1c]' : 'text-primary');

            return (
              <View className="bg-surface-container-low p-5 rounded-2xl flex-row items-center mb-3">
                <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${bgClass}`}>
                  <MaterialIcons 
                    name={isPending ? 'schedule' : iconName} 
                    size={20} 
                    color={iconColor} 
                  />
                </View>
                <View className="flex-1 pr-2">
                  <Text className="font-label text-sm font-bold text-primary" numberOfLines={1}>
                    {item.description || (isCredit ? 'Wallet Top-Up' : 'Club Purchase')}
                  </Text>
                  <View className="flex-row items-center mt-0.5">
                    <Text className="font-body text-xs text-on-surface-variant">
                      {formatDate(item.created_at)}
                    </Text>
                    {isPending && (
                      <View className="ml-2 bg-orange-100 px-1.5 py-0.5 rounded">
                        <Text className="text-[8px] font-label font-bold text-orange-800 uppercase tracking-widest">Pending</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View className="items-end">
                  <Text className={`font-headline text-base font-bold ${textColor}`}>
                    {isCredit ? '+' : '-'}₹{parseFloat(item.amount).toLocaleString('en-IN')}
                  </Text>
                  <Text className="font-body text-[9px] text-outline uppercase tracking-widest mt-1">
                    {item.transaction_id}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}