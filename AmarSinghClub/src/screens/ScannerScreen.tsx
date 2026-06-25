import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { walletService } from '../services/walletService';
import { cacheService } from '../services/cacheService';
import * as LocalAuthentication from 'expo-local-authentication';


const decodeBase64 = (str: any) => {
  try {
    if (typeof atob === 'function') return atob(str);
  } catch (e) {}
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  str = String(str).replace(/=+$/, '');
  if (str.length % 4 == 1) return str;
  for (let bc = 0, bs = 0, buffer, idx = 0; buffer = str.charAt(idx++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
    buffer = chars.indexOf(buffer);
  }
  return output;
};

export default function ScannerScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  
  // Real-time Wallet State
  const [walletBalance, setWalletBalance] = useState(0);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  // States for the Payment Popup
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [billAmount, setBillAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedPayload, setScannedPayload] = useState<any>(null);

  // Fetch the real wallet balance and user data from local storage when the screen opens
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await cacheService.get<any>('userData');
        if (user) {
          setLoggedInUser(user);
          setWalletBalance(parseFloat(user.wallet_balance || '0'));
        }
      } catch (error) {
        console.error("Failed to load user data in ScannerScreen:", error);
      }
    };
    fetchUserData();
  }, []);

  // 1. Loading & Permission States
  if (!permission) return <View className="flex-1 bg-primary" />;

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-background justify-center items-center p-8">
        <MaterialIcons name="camera-alt" size={80} color="#cca72f" className="mb-6" />
        <Text className="text-white text-xl font-headline font-bold text-center mb-3">Camera Access Required</Text>
        <Text className="text-on-surface-variant font-body text-center mb-8">
          We need access to your camera so you can scan QR codes and settle your table bills seamlessly.
        </Text>
        <TouchableOpacity 
          className="bg-primary px-8 py-4 rounded-xl shadow-lg"
          onPress={() => {
            if (permission.canAskAgain) {
              requestPermission();
            } else {
              Linking.openSettings();
            }
          }}
        >
          <Text className="text-white font-label font-bold text-center">
            {permission.canAskAgain ? "Grant Permission" : "Open Settings"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity className="mt-6" onPress={() => navigation.goBack()}>
          <Text className="text-secondary font-label font-bold">Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 2. Triggered when ANY QR code is scanned
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    try {
      let parsed;
      let rawData = data;
      try {
        // If data looks like base64 (no { or [ at start), try to decode it
        if (!data.trim().startsWith('{') && !data.trim().startsWith('[')) {
          try {
            rawData = decodeBase64(data);
          } catch (e) {
            // Ignore decode error, keep rawData as data
          }
        }
        
        // Attempt to parse our secure JSON payload
        parsed = JSON.parse(rawData);
        
        if (parsed.prefix === 'AMARSINGHCLUB' && parsed.signature) {
          // STRICT IDENTITY MATCHING
          const qrMemberId = String(parsed.data?.member_id);
          const qrMemberName = String(parsed.data?.member_name).toLowerCase().trim();
          
          const localMemberId = String(loggedInUser?.member_id);
          const localMemberName = String(loggedInUser?.name).toLowerCase().trim();

          if (qrMemberId !== localMemberId || qrMemberName !== localMemberName) {
            throw new Error('Identity Mismatch');
          }
        } else {
          // If it's JSON but not our format, check if it's a KOT order
          const amountValue = parsed.amount || parsed.total_amount;
          if (parsed.order_id && amountValue) {
            parsed = { 
              data: { table: "Order #" + parsed.order_id },
              amount: amountValue,
              order_id: parsed.order_id
            };
          } else {
            // Treat as raw text
            parsed = { data: { table: data }, raw_scan: data };
          }
        }
      } catch (jsonError: any) {
        if (jsonError.message === 'Identity Mismatch') throw jsonError;
        
        // If it's not JSON at all, wrap it in our payload structure
        parsed = { data: { table: data }, raw_scan: data };
      }
      
      // Store the payload so the backend can process the KOT string or table
      setScannedPayload(parsed);

      if (parsed.amount) {
        setBillAmount(String(parsed.amount));
      } else {
        setBillAmount('');
      }

      setScanned(true); // Stop scanning
      setShowPaymentModal(true); // Open the payment popup
    } catch (e: any) {
      setScanned(true); // Pause scanning
      
      if (e.message === 'Identity Mismatch') {
        Toast.show({
          type: 'clubError',
          text1: 'Identity Mismatch',
          text2: 'This QR code is assigned to a different member.',
          position: 'top',
          topOffset: 60,
        });
      } else {
        Toast.show({
          type: 'clubError',
          text1: 'Invalid QR Code',
          text2: 'This QR code cannot be processed.',
          position: 'top',
          topOffset: 60,
        });
      }
      
      // Resume scanning after 2 seconds
      setTimeout(() => setScanned(false), 2000);
    }
  };

  // 3. Handle Payment Submission
  const handlePayment = async () => {
    if (!billAmount) {
      Toast.show({
        type: 'clubError',
        text1: 'Invalid Amount',
        text2: 'Please enter the bill amount to proceed.',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    const numericAmount = parseFloat(billAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Toast.show({
        type: 'clubError',
        text1: 'Invalid Amount',
        text2: 'Please enter a valid bill amount to proceed.',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    if (numericAmount > walletBalance) {
      Toast.show({
        type: 'clubError',
        text1: 'Insufficient Funds',
        text2: 'Your bill exceeds your available wallet balance.',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Biometric Authentication Check
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to confirm payment',
          fallbackLabel: 'Use PIN',
        });

        if (!authResult.success) {
          setIsProcessing(false);
          Toast.show({
            type: 'clubError',
            text1: 'Authentication Failed',
            text2: 'Could not verify your identity. Payment cancelled.',
            position: 'top',
            topOffset: 60,
          });
          return;
        }
      }

      // 2. Process Payment via Backend
      const description = scannedPayload?.data?.table ? `Payment for ${scannedPayload.data.table}` : "Club Payment via QR Scan";
      
      // Send the deduction request to the Laravel backend along with the QR signature
      let response;
      if (scannedPayload?.order_id) {
        response = await walletService.approveOrder(scannedPayload.order_id);
      } else {
        if (scannedPayload?.raw_scan) {
          throw new Error('Unrecognized QR Code format: ' + scannedPayload.raw_scan);
        }
        response = await walletService.pay(numericAmount, description, scannedPayload);
      }
      
      setIsProcessing(false);
      setShowPaymentModal(false);
      
      // Navigate to the Success Screen with real transaction data
      navigation.replace('PaymentSuccess', { 
        amount: numericAmount,
        transactionId: response.transaction_id,
        method: 'Club Wallet',
        status: 'completed',
        type: 'payment',
        message: 'Payment deducted successfully.'
      });

    } catch (error: any) {
      setIsProcessing(false);
      setShowPaymentModal(false);
      console.error("Scanner Payment Error:", error.response?.status, error.response?.data);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Payment processing failed.';
      
      Toast.show({
        type: 'clubError',
        text1: 'Transaction Failed',
        text2: errorMsg,
        position: 'top',
        topOffset: 60,
      });

      // Allow the user to scan again after viewing the error
      setTimeout(() => setScanned(false), 2500);
    }
  };

  // 4. Handle cancelling the payment popup
  const handleCancelPayment = () => {
    setShowPaymentModal(false);
    setBillAmount('');
    // Wait a second before allowing the camera to scan again
    setTimeout(() => setScanned(false), 1000);
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      
      {/* Background Camera Feed */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        // Disable scanner if a code was already scanned OR the modal is open
        onBarcodeScanned={scanned || showPaymentModal ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      {/* Camera UI Overlay */}
      <SafeAreaView className="flex-1 justify-between p-6 pointer-events-box-none">
        <View className="flex-row justify-between items-center mt-2">
          <TouchableOpacity 
            className="w-12 h-12 bg-black/40 rounded-full items-center justify-center border border-white/20"
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text className="font-headline font-bold text-white text-xl">Scan to Pay</Text>
          <View className="w-12" />
        </View>

        <View className="flex-1 items-center justify-center pointer-events-none">
          <View className="w-[70%] aspect-square border-2 border-tertiary rounded-3xl bg-transparent shadow-[0_0_0_999px_rgba(0,0,0,0.5)]" />
        </View>

        <View className="bg-black/70 p-6 rounded-3xl items-center border border-white/10">
          <MaterialIcons name="qr-code-scanner" size={32} color="#cca72f" className="mb-3" />
          <Text className="font-headline text-lg font-bold text-white mb-2">Align QR Code</Text>
          <Text className="font-body text-white/70 text-center text-sm leading-5">
            Scan any Amar Singh Club QR code to open the payment terminal and settle your tab.
          </Text>
        </View>
      </SafeAreaView>

      {/* --- PAYMENT POPUP MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPaymentModal}
        onRequestClose={handleCancelPayment}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/60"
        >
          <View className="bg-background rounded-t-3xl p-6 pb-10 shadow-2xl">
            
            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="font-headline text-2xl font-bold text-primary">Settle Bill</Text>
              <TouchableOpacity onPress={handleCancelPayment} className="p-2 bg-surface-container-high rounded-full">
                <MaterialIcons name="close" size={20} color="#132c2a" />
              </TouchableOpacity>
            </View>

            {/* Wallet Balance Display */}
            <View className="bg-[#0b1f1d] p-5 rounded-2xl mb-6 flex-row justify-between items-center">
              <View>
                <Text className="text-[10px] font-label font-bold uppercase tracking-widest text-white/60 mb-1">
                  Wallet Balance
                </Text>
                <Text className="font-headline text-2xl font-bold text-white">
                  ₹{walletBalance.toLocaleString('en-IN')}
                </Text>
              </View>
              <MaterialIcons name="account-balance-wallet" size={28} color="#cca72f" />
            </View>

            {/* Amount Input */}
            <Text className="text-[10px] font-label font-bold uppercase tracking-[0.1em] text-on-surface-variant mb-2 ml-1">
              Enter Bill Amount
            </Text>
            <View className="flex-row items-center bg-surface-container-high rounded-xl px-4 py-4 mb-8 border border-outline-variant/30">
              <Text className="font-body text-xl text-primary font-bold mr-2">₹</Text>
              <TextInput
                className="flex-1 font-body text-primary text-xl font-bold"
                placeholder="0.00"
                placeholderTextColor="#c1c8c6"
                keyboardType="numeric"
                value={billAmount}
                onChangeText={setBillAmount}
                autoFocus={true}
                editable={!scannedPayload?.amount}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              className={`py-5 rounded-xl flex-row justify-center items-center shadow-lg mb-6 ${isProcessing ? 'bg-primary/70' : 'bg-primary'}`}
              onPress={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text className="text-white font-label font-bold tracking-widest text-sm mr-2">
                    AUTHORIZE PAYMENT
                  </Text>
                  <MaterialIcons name="lock-outline" size={18} color="white" />
                </>
              )}
            </TouchableOpacity>

          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}