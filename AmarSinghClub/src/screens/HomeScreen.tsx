import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { cacheService } from '../services/cacheService';
import { useFocusEffect } from '@react-navigation/native';

// Import our API Services
import { authService } from '../services/authService';
import { walletService } from '../services/walletService';

// Import our Clean Components
import WalletCard from '../components/WalletCard';
import TransactionRow from '../components/TransactionRow';

import { pushService } from '../services/pushService';
import { notificationService } from '../services/notificationService';

import Toast from 'react-native-toast-message';

import { DeviceEventEmitter } from 'react-native';

export default function HomeScreen({ navigation }: any) {
  const [userData, setUserData] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);


  React.useEffect(() => {
    pushService.registerForPushNotificationsAsync();

    const sub = DeviceEventEmitter.addListener('refresh_wallet', fetchLiveData);
    return () => sub.remove();
  }, []);

  // The ONE unified fetching function
  const fetchLiveData = async () => {
    // 0. LOAD FROM CACHE FIRST FOR INSTANT UI (Offline First)
    const storedUserData = await cacheService.get<any>('userData');
    if (storedUserData) {
      setUserData(storedUserData);
    }
    const storedHistory = await cacheService.get<any>('walletHistory');
    if (storedHistory) {
      if (Array.isArray(storedHistory)) {
        setRecentTransactions(storedHistory.slice(0, 3));
      } else if (storedHistory && typeof storedHistory === 'object') {
        // Recover from previously corrupted cache object
        const arr = Object.values(storedHistory).filter((x: any) => x && x.id);
        setRecentTransactions(arr.slice(0, 3));
      }
    }

    // 1. Fetch Fresh Profile Data in Background
    try {
      const freshData = await authService.getProfile();
      setUserData(freshData);
      await cacheService.set('userData', freshData);
    } catch (error) {
      if (__DEV__) {
        console.log('Profile fetch failed, keeping cache.');
      }
    }

    // 2. Fetch Fresh Recent Transactions
    try {
      const historyData = await walletService.history();
      let txs = [];
      if (Array.isArray(historyData)) {
        txs = historyData;
      } else if (historyData?.data && Array.isArray(historyData.data)) {
        txs = historyData.data;
      }
      setRecentTransactions(txs.slice(0, 3));
      await cacheService.set('walletHistory', txs);
    } catch (error) {
      if (__DEV__) {
        console.log('History fetch failed, keeping cache.');
      }
    }

    try {
      const data = await notificationService.getNotifications();
      let notificationsArray: any[] = [];
      if (Array.isArray(data)) {
        notificationsArray = data;
      } else if (typeof data === 'object' && data !== null) {
        notificationsArray = Object.values(data).filter((item: any) => item && item.id);
      }
      setHasUnreadNotifications(notificationsArray.some((item) => item.read_at === null));
    } catch {
      setHasUnreadNotifications(false);
    }
  };

  // Trigger fetch when screen opens
  useFocusEffect(
    useCallback(() => {
      fetchLiveData().finally(() => setIsLoading(false));
    }, [])
  );

  // Trigger fetch when user swipes down to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLiveData();
    setRefreshing(false);
  }, []);

  const getFirstName = (fullName: string) => {
    if (!fullName) return '';
    return fullName.split(' ')[0];
  };

  const getGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) return 'Good Morning,';
    if (currentHour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  if (isLoading && !userData) {
    return <View className="flex-1 bg-background" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar style="dark" />
      
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-background">
        <View>
          <Text className="text-[10px] font-label font-bold uppercase tracking-[0.15em] text-secondary mb-1">
            {getGreeting()}
          </Text>
          <Text className="font-headline text-2xl font-bold text-primary">
            {userData ? getFirstName(userData.name) : 'Member'}
          </Text>
        </View>
       <TouchableOpacity 
          className="relative p-2 bg-surface-container-low rounded-full shadow-sm"
          onPress={() => navigation.navigate('Notifications')}
        >
          <MaterialIcons name="notifications-none" size={24} color="#132c2a" />
          {hasUnreadNotifications ? (
            <View className="absolute top-2 right-2 w-2.5 h-2.5 bg-secondary rounded-full border-2 border-background" />
          ) : null}
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#cca72f" />
        }
      >
        
        {/* Wallet Component */}
        <WalletCard 
          balance={userData?.wallet_balance} 
          memberId={userData?.member_id} 
          onTopUpPress={() => navigation.navigate('Top-Up')} 
        />

        {/* Primary Action: QR Scanner */}
        <TouchableOpacity 
          className="bg-surface-container-highest p-6 rounded-3xl mb-8 flex-row items-center shadow-sm border-l-4 border-primary"
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Scanner')}
        >
          <View className="w-14 h-14 bg-primary rounded-2xl items-center justify-center shadow-md">
            <MaterialIcons name="qr-code-scanner" size={28} color="#cca72f" />
          </View>
          <View className="ml-5 flex-1">
            <Text className="font-headline text-xl font-bold text-primary mb-1">Scan to Pay</Text>
            <Text className="font-body text-sm text-on-surface-variant leading-5 pr-4">
              Scan the code on your table to instantly settle your tab via membership.
            </Text>
          </View>
        </TouchableOpacity>

        {/* Quick Privileges Grid */}
        <Text className="font-headline text-xl font-bold text-primary mb-4">Privileges</Text>
        <View className="flex-row justify-between mb-8">
          <TouchableOpacity
            onPress={() =>
              Toast.show({ type: 'clubError', text1: 'Coming Soon', text2: 'Digital menu will be available in a future update.' })
            }
            className="bg-surface-container-low w-[30%] aspect-square rounded-2xl items-center justify-center shadow-sm"
          >
            <MaterialIcons name="restaurant-menu" size={28} color="#8d4b4b" />
            <Text className="font-label text-[10px] font-bold uppercase tracking-widest text-primary text-center mt-2">Menu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              Toast.show({ type: 'clubError', text1: 'Coming Soon', text2: 'Table reservations will be available soon.' })
            }
            className="bg-surface-container-low w-[30%] aspect-square rounded-2xl items-center justify-center shadow-sm"
          >
            <MaterialIcons name="event-seat" size={28} color="#8d4b4b" />
            <Text className="font-label text-[10px] font-bold uppercase tracking-widest text-primary text-center mt-2">Reserve</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Activities')}
            className="bg-surface-container-low w-[30%] aspect-square rounded-2xl items-center justify-center shadow-sm"
          >
            <MaterialIcons name="receipt-long" size={28} color="#8d4b4b" />
            <Text className="font-label text-[10px] font-bold uppercase tracking-widest text-primary text-center mt-2">History</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity Section */}
        <View className="flex-row justify-between items-end mb-4">
          <Text className="font-headline text-xl font-bold text-primary">Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Activities')}>
             <Text className="font-label text-xs font-bold text-secondary uppercase tracking-widest">View All</Text>
          </TouchableOpacity>
        </View>

        {recentTransactions.length === 0 ? (
          <View className="bg-surface-container-low p-6 rounded-2xl items-center justify-center border border-outline-variant/20 border-dashed mb-4">
             <MaterialIcons name="receipt" size={32} color="#c1c8c6" className="mb-2" />
             <Text className="font-body text-sm text-on-surface-variant text-center">No recent activity found.</Text>
          </View>
        ) : (
          recentTransactions.map((tx) => (
            <TransactionRow key={tx.id} transaction={tx} />
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}