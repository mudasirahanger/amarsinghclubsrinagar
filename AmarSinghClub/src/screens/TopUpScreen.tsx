import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import RazorpayCheckout from 'react-native-razorpay';
import { useFocusEffect } from '@react-navigation/native';
import { isExpoGo } from '../constants/config';

// Import services
import { authService } from '../services/authService';
import { walletService } from '../services/walletService';
import { cacheService } from '../services/cacheService';

export default function TopUpScreen({ navigation }: any) {
  const [userData, setUserData] = useState<any>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(10000);
  const [customAmount, setCustomAmount] = useState('');
  
  // New state for payment method selection
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cash'>('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);

  const displayAmount = customAmount ? parseInt(customAmount) || 0 : selectedAmount || 0;

  // Fetch real-time balance
  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        try {
          const freshData = await authService.getProfile();
          setUserData(freshData);
          await cacheService.set('userData', freshData);
        } catch (error) {
          try {
            const user = await cacheService.get<any>('userData');
            if (user) setUserData(user);
          } catch (e) {
            console.error("Failed to load fallback user data", e);
          }
        }
      };
      fetchProfile();
    }, [])
  );

  const processCashTopUp = async () => {
    setIsProcessing(true);
    try {
      // Send directly to Laravel API as pending cash request
      const response = await walletService.topUp(displayAmount, 'cash');
      
      setIsProcessing(false);
      navigation.navigate('PaymentSuccess', {
        amount: displayAmount,
        transactionId: response.transaction_id,
        method: 'Cash at Front Desk',
        status: 'pending',
        type: 'topup',
        message: response.message
      });
    } catch (error: any) {
      setIsProcessing(false);
      Toast.show({
        type: 'clubError',
        text1: 'Request Failed',
        text2: error.originalError?.response?.data?.message || error.response?.data?.message || error.message || "Could not process cash request.",
      });
    }
  };

  const processRazorpayTopUp = () => {
    if (isExpoGo) {
      Toast.show({
        type: 'clubError',
        text1: 'Development Build Required',
        text2: 'Online payments need the Amar Singh Club dev app, not Expo Go.',
      });
      return;
    }

    const razorpayKey = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID;
    if (!razorpayKey || razorpayKey.includes('your_key')) {
      Toast.show({
        type: 'clubError',
        text1: 'Payment Not Configured',
        text2: 'Razorpay key is missing. Contact club support.',
      });
      return;
    }

    setIsProcessing(true);
    const options = {
      description: 'Amar Singh Club Wallet Top-Up',
      image: 'https://amarsinghclubsrinagar.com/wp-content/uploads/2023/12/cropped-cropped-amarsinghlogo.png',
      currency: 'INR',
      key: razorpayKey,
      amount: displayAmount * 100,
      name: 'Amar Singh Club',
      prefill: {
        email: userData?.email || '',
        contact: userData?.phone || '',
        name: userData?.name || 'Member'
      },
      theme: { color: '#132c2a' }
    };

    RazorpayCheckout.open(options)
      .then(async (data: any) => {
        try {
          // Send success token to Laravel API to update the real ledger
          const response = await walletService.topUp(displayAmount, 'razorpay', data.razorpay_payment_id);
          
          setIsProcessing(false);
          navigation.navigate('PaymentSuccess', {
            amount: displayAmount,
            transactionId: response.transaction_id,
            method: 'Razorpay',
            status: 'completed',
            type: 'topup',
            message: response.message
          });

        } catch (error: any) {
          setIsProcessing(false);
          Toast.show({ type: 'clubError', text1: 'Server Error', text2: 'Payment processed but failed to update wallet. Contact support.' });
        }
      })
      .catch((error: any) => {
        setIsProcessing(false);
        Toast.show({ type: 'clubError', text1: 'Payment Cancelled', text2: 'The transaction was not completed.' });
      });
  };

  const handleProceed = () => {
    if (displayAmount < 100) {
      Toast.show({ type: 'clubError', text1: 'Invalid Amount', text2: 'Minimum top-up amount is ₹100' });
      return;
    }

    if (paymentMethod === 'cash') {
      processCashTopUp();
    } else {
      processRazorpayTopUp();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar style="dark" />

      <View className="px-6 py-4">
        <Text className="font-headline text-xl font-bold text-primary-container">Top-up Account</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          
          {/* Hero Balance Card */}
          <View className="bg-[#0b1f1d] p-8 rounded-3xl mb-8 items-center shadow-lg relative overflow-hidden">
            <View className="absolute -top-12 -right-12 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
            <Text className="text-[10px] font-label font-bold uppercase tracking-[0.15em] text-white/60 mb-2">
              Available Balance
            </Text>
            <View className="flex-row items-start mb-4">
              <Text className="font-headline text-2xl font-bold text-tertiary mt-2 mr-1">₹</Text>
              <Text className="font-headline text-5xl font-bold text-white">
                {userData?.wallet_balance ? parseFloat(userData.wallet_balance).toLocaleString('en-IN') : '0'}
              </Text>
            </View>
            <View className="bg-white/10 px-4 py-1.5 rounded-full flex-row items-center border border-white/5">
              <MaterialIcons name="verified" size={14} color="#cca72f" />
              <Text className="text-white font-label text-[10px] ml-1.5 uppercase tracking-widest">
                {userData?.member_tier || 'Standard'} Member
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between items-end mb-4">
            <Text className="font-headline text-xl font-bold text-primary">Add Funds</Text>
            <Text className="text-[10px] font-label uppercase tracking-widest text-outline">Select Amount</Text>
          </View>

          <View className="flex-row justify-between mb-4">
            {[5000, 10000, 25000].map((amt, idx) => (
              <TouchableOpacity 
                key={amt}
                onPress={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                className={`w-[31%] py-4 rounded-xl items-center border ${selectedAmount === amt ? 'border-tertiary bg-[#fcf5e3]' : 'border-outline-variant/30 bg-surface-container-lowest'}`}
              >
                <Text className={`text-[9px] font-label font-bold mb-1 ${selectedAmount === amt ? 'text-tertiary' : 'text-outline'}`}>
                  {idx === 0 ? 'MIN' : idx === 1 ? 'RECOMMENDED' : 'MAX'}
                </Text>
                <Text className={`font-headline font-bold ${selectedAmount === amt ? 'text-primary text-lg' : 'text-primary text-base'}`}>
                  ₹{amt.toLocaleString('en-IN')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="relative mt-2 mb-8">
            <View className="absolute -top-2.5 left-4 z-10 bg-background px-1">
              <Text className="text-[10px] font-label font-bold uppercase tracking-widest text-tertiary">Custom Amount</Text>
            </View>
            <View className="flex-row items-center bg-surface-container-lowest rounded-xl border border-outline-variant/40 px-4 py-4">
              <Text className="font-body text-xl text-outline mr-2">₹</Text>
              <TextInput
                className="flex-1 font-body text-primary text-lg"
                placeholder="Enter amount manually"
                placeholderTextColor="#c1c8c6"
                keyboardType="numeric"
                value={customAmount}
                onChangeText={(val) => { setCustomAmount(val); setSelectedAmount(null); }}
              />
            </View>
          </View>

          <Text className="font-headline text-xl font-bold text-primary mb-4">Payment Methods</Text>
          
          {/* Razorpay Option */}
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => setPaymentMethod('razorpay')}
            className={`p-4 rounded-2xl flex-row items-center mb-3 border ${paymentMethod === 'razorpay' ? 'bg-[#fcf5e3] border-tertiary/50' : 'bg-surface-container-lowest border-outline-variant/30'}`}
          >
            <View className="w-10 h-10 bg-surface-container-highest rounded-xl items-center justify-center mr-4">
              <MaterialIcons name="security" size={20} color={paymentMethod === 'razorpay' ? "#735c00" : "#727877"} />
            </View>
            <View className="flex-1">
              <Text className="font-label font-bold text-primary">Online Payment</Text>
              <Text className="font-body text-xs text-on-surface-variant mt-0.5">UPI, Cards, Net Banking</Text>
            </View>
            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${paymentMethod === 'razorpay' ? 'border-secondary' : 'border-outline-variant'}`}>
              {paymentMethod === 'razorpay' && <View className="w-2.5 h-2.5 rounded-full bg-secondary" />}
            </View>
          </TouchableOpacity>

          {/* Cash Option */}
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => setPaymentMethod('cash')}
            className={`p-4 rounded-2xl flex-row items-center mb-8 border ${paymentMethod === 'cash' ? 'bg-[#fcf5e3] border-tertiary/50' : 'bg-surface-container-lowest border-outline-variant/30'}`}
          >
            <View className="w-10 h-10 bg-surface-container-highest rounded-xl items-center justify-center mr-4">
              <MaterialIcons name="payments" size={20} color={paymentMethod === 'cash' ? "#735c00" : "#727877"} />
            </View>
            <View className="flex-1">
              <Text className="font-label font-bold text-primary">Cash Deposit</Text>
              <Text className="font-body text-xs text-on-surface-variant mt-0.5">Pay at the Club Front Desk</Text>
            </View>
            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${paymentMethod === 'cash' ? 'border-secondary' : 'border-outline-variant'}`}>
              {paymentMethod === 'cash' && <View className="w-2.5 h-2.5 rounded-full bg-secondary" />}
            </View>
          </TouchableOpacity>

          <View className="mt-4">
            <TouchableOpacity 
              className={`bg-[#0b1f1d] py-5 rounded-xl flex-row justify-center items-center shadow-lg ${isProcessing ? 'opacity-80' : ''}`}
              onPress={handleProceed}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text className="text-white font-label font-bold tracking-widest text-sm mr-2">
                    PROCEED TO PAY ₹{displayAmount.toLocaleString('en-IN')}
                  </Text>
                  <MaterialIcons name="arrow-forward" size={20} color="white" />
                </>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}