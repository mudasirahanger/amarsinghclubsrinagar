import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, DeviceEventEmitter } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import Toast from 'react-native-toast-message';

import { notificationService } from '../services/notificationService';
import { walletService } from '../services/walletService';

export default function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [processingId, setProcessingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const fetchAndReadNotifications = async () => {
        setIsLoading(true);
        try {
          // Fetch all notifications
          // The backend injects a _meta key, which converts the array to an object.
          // We need to safely extract only the notification objects.
          const data = await notificationService.getNotifications();
          let notificationsArray: any[] = [];
          if (Array.isArray(data)) {
            notificationsArray = data;
          } else if (typeof data === 'object' && data !== null) {
            // Filter out _meta or any non-notification items by checking for 'id'
            notificationsArray = Object.values(data).filter((item: any) => item && item.id);
          }
          setNotifications(notificationsArray);
          
          // Mark them as read in the background so the red badge disappears
          await notificationService.markAsRead();
        } catch (error) {
          console.log("Failed to fetch notifications", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchAndReadNotifications();

      let sub: any;
      import('react-native').then(({ DeviceEventEmitter }) => {
        sub = DeviceEventEmitter.addListener('refresh_wallet', fetchAndReadNotifications);
      });

      return () => {
        if (sub) sub.remove();
      };
    }, [])
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handlePayNow = async (item: any) => {
    setProcessingId(item.id);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage: `Authenticate to pay ₹${item.data.amount}`,
          fallbackLabel: 'Use PIN',
        });

        if (!authResult.success) {
          Toast.show({
            type: 'clubError',
            text1: 'Authentication Failed',
            text2: 'Could not verify your identity. Payment cancelled.',
          });
          setProcessingId(null);
          return;
        }
      }

      await walletService.approveOrder(item.data.order_id);
      
      Toast.show({
        type: 'clubSuccess',
        text1: 'Payment Successful',
        text2: `You paid ₹${item.data.amount} for catering.`,
      });

      // Remove from list
      setNotifications(prev => prev.filter(n => n.id !== item.id));
      DeviceEventEmitter.emit('refresh_wallet');

    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || 'Insufficient balance or network error.';
      Toast.show({
        type: 'clubError',
        text1: 'Payment Failed',
        text2: errorMessage,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelOrder = async (item: any) => {
    setProcessingId(item.id);
    try {
      await walletService.cancelOrder(item.data.order_id);
      Toast.show({
        type: 'clubSuccess',
        text1: 'Order Cancelled',
        text2: `Order #${item.data.order_id} has been cancelled.`,
      });
      // Remove from list
      setNotifications(prev => prev.filter(n => n.id !== item.id));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || 'Could not cancel the order.';
      Toast.show({
        type: 'clubError',
        text1: 'Cancellation Failed',
        text2: errorMessage,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const renderNotification = ({ item }: { item: any }) => {
    const isTopUp = item.data.type === 'topup';
    const isPendingPayment = item.data.type === 'order_pending_payment';
    const isUnread = item.read_at === null;
    const isProcessing = processingId === item.id;

    return (
      <View className={`p-4 rounded-2xl flex-row items-start mb-3 border ${isUnread ? 'bg-surface-container-low border-secondary/30' : 'bg-background border-outline-variant/20'}`}>
        <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 mt-1 ${isTopUp ? 'bg-[#e0ecd8]' : 'bg-surface-container-highest'}`}>
          <MaterialIcons name={isTopUp ? 'account-balance-wallet' : 'receipt-long'} size={20} color={isTopUp ? '#2e5a1c' : '#735c00'} />
        </View>
        <View className="flex-1">
          <View className="flex-row justify-between items-start mb-1">
            <Text className={`font-headline text-base font-bold ${isUnread ? 'text-primary' : 'text-primary/70'}`}>
              {item.data.title}
            </Text>
            {isUnread && <View className="w-2 h-2 rounded-full bg-secondary mt-2" />}
          </View>
          <Text className="font-body text-sm text-on-surface-variant leading-5 mb-2">
            {item.data.message || item.data.body}
          </Text>
          <Text className="font-body text-[10px] text-outline uppercase tracking-widest mb-3">
            {formatDate(item.created_at)}
          </Text>

          {isPendingPayment && (
            <View className="flex-row items-center mt-2 pt-3 border-t border-outline-variant/10">
              <TouchableOpacity 
                className={`flex-1 py-2.5 rounded-lg items-center justify-center mr-2 ${isProcessing ? 'bg-primary/50' : 'bg-primary'}`}
                onPress={() => handlePayNow(item)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-label font-bold text-xs uppercase tracking-widest">Pay Now</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="flex-1 py-2.5 rounded-lg items-center justify-center bg-surface-container-high border border-outline-variant/20"
                onPress={() => handleCancelOrder(item)}
                disabled={isProcessing}
              >
                <Text className="text-on-surface-variant font-label font-bold text-xs uppercase tracking-widest">Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-outline-variant/10 mb-2">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2 rounded-full">
          <MaterialIcons name="arrow-back" size={24} color="#132c2a" />
        </TouchableOpacity>
        <Text className="ml-4 font-headline text-xl font-bold text-primary">Notifications</Text>
      </View>

      {/* List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#cca72f" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          ListEmptyComponent={() => (
            <View className="items-center justify-center mt-20 opacity-50">
              <MaterialIcons name="notifications-off" size={48} color="#727877" className="mb-4" />
              <Text className="font-headline text-lg text-primary">No new notifications</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}