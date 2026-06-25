import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, BackHandler, Animated, Easing, DeviceEventEmitter } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function PaymentSuccessScreen({ route, navigation }: any) {
  // Extract the data passed from the TopUp screen
  const { amount, transactionId, method, status, message, type } = route.params;

  const isPending = status === 'pending';

  // Animation Values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Prevent user from swiping back to the payment processing screen
  useEffect(() => {
    const backAction = () => {
      navigation.navigate('MainTabs');
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    
    // Trigger Animations
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      ])
    ]).start();

    // Floating animation for "Cheers!" text
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    ).start();

    DeviceEventEmitter.emit('refresh_wallet');

    return () => backHandler.remove();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background justify-between p-6" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <Animated.View 
        className="flex-1 items-center justify-center mt-10"
        style={{ opacity: fadeAnim }}
      >
        <Animated.View 
          className={`w-24 h-24 rounded-full items-center justify-center mb-8 border-4 ${isPending ? 'bg-[#fff8e1] border-[#ffc107]' : 'bg-[#e8f5e9] border-[#4caf50]'}`}
          style={{ transform: [{ scale: scaleAnim }] }}
        >
          <MaterialIcons 
            name={isPending ? "access-time" : "check"} 
            size={48} 
            color={isPending ? "#ffb300" : "#4caf50"} 
          />
        </Animated.View>

        <Animated.View style={{ transform: [{ translateY: slideAnim }] }} className="items-center w-full">
          {!isPending && type === 'payment' && (
            <Animated.Text 
              style={{ transform: [{ translateY: floatAnim }] }} 
              className="text-2xl font-bold text-[#ffb300] mb-2"
            >
              🎉 Cheers!
            </Animated.Text>
          )}
          <Text className="font-headline text-3xl font-bold text-primary mb-2 text-center">
            {isPending ? 'Request Pending' : (type === 'payment' ? 'Payment Successful' : 'Top-up Successful')}
          </Text>
          
          <Text className="font-body text-base text-on-surface-variant text-center mb-8 px-4 leading-6">
            {message || 'Your transaction has been processed.'}
          </Text>

          <View className="w-full bg-surface-container-low rounded-3xl p-6 border border-outline-variant/30">
            <View className="border-b border-outline-variant/20 pb-4 mb-4 items-center">
              <Text className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1">Amount</Text>
              <Text className="font-headline text-4xl font-bold text-primary">₹{amount.toLocaleString('en-IN')}</Text>
            </View>

            <View className="flex-row justify-between mb-3">
              <Text className="font-body text-sm text-on-surface-variant">Transaction ID</Text>
              <Text className="font-body text-sm font-bold text-primary">{transactionId}</Text>
            </View>

            <View className="flex-row justify-between mb-3">
              <Text className="font-body text-sm text-on-surface-variant">Payment Method</Text>
              <Text className="font-body text-sm font-bold text-primary uppercase">{method}</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="font-body text-sm text-on-surface-variant">Date</Text>
              <Text className="font-body text-sm font-bold text-primary">
                {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        </Animated.View>
      </Animated.View>

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <TouchableOpacity 
          className="bg-primary py-5 rounded-xl items-center shadow-lg w-full mb-4"
          onPress={() => navigation.navigate('MainTabs')}
        >
          <Text className="text-white font-label font-bold tracking-widest text-sm uppercase">Return to Dashboard</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}
