import React, { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import POSAlertModal from './POSAlertModal';
import { walletService } from '../services/walletService';
import Toast from 'react-native-toast-message';
import * as LocalAuthentication from 'expo-local-authentication';
import { Vibration } from 'react-native';

export default function GlobalPOSAlert() {
  const [posAlert, setPosAlert] = useState<{ order_id: string; amount: number } | null>(null);
  const [isPayingPos, setIsPayingPos] = useState(false);

  useEffect(() => {
    // Listen for incoming notifications while the app is foregrounded
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data;
      if (data?.type === 'debit_request' && data?.order_id) {
        setPosAlert({
          order_id: data.order_id as string,
          amount: Number(data.amount) || 0,
        });
      }
    });

    // Listen for manual triggers (e.g. from Notifications screen)
    let triggerSub: any;
    import('react-native').then(({ DeviceEventEmitter }) => {
      triggerSub = DeviceEventEmitter.addListener('trigger_pos_payment', (data) => {
        setPosAlert({
          order_id: data.order_id,
          amount: Number(data.amount) || 0,
        });
      });
    });

    return () => {
      notificationListener.remove();
      if (triggerSub) triggerSub.remove();
    };
  }, []);

  useEffect(() => {
    if (posAlert) {
      // Vibrate pattern: 0ms delay, 500ms vibrate, 200ms pause, 500ms vibrate
      Vibration.vibrate([0, 500, 200, 500]);
    }
  }, [posAlert]);

  const handlePayPosBill = async () => {
    if (!posAlert) return;
    setIsPayingPos(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage: `Authenticate to pay ₹${posAlert.amount}`,
          fallbackLabel: 'Use PIN',
        });

        if (!authResult.success) {
          Toast.show({
            type: 'clubError',
            text1: 'Authentication Failed',
            text2: 'Could not verify your identity. Payment cancelled.',
          });
          return;
        }
      }

      await walletService.approveOrder(posAlert.order_id);
      Toast.show({
        type: 'clubSuccess',
        text1: 'Payment Successful',
        text2: `You paid ₹${posAlert.amount} for catering.`,
      });
      setPosAlert(null);
      
      // Tell other screens to refresh their data
      import('react-native').then(({ DeviceEventEmitter }) => {
          DeviceEventEmitter.emit('refresh_wallet');
      });
    } catch (error: any) {
      setTimeout(() => {
        const errorMessage = error?.response?.data?.error || error?.response?.data?.message || 'Insufficient balance or network error.';
        Toast.show({
          type: 'clubError',
          text1: 'Payment Failed',
          text2: errorMessage,
        });
      }, 500);
    } finally {
      setIsPayingPos(false);
    }
  };

  const handleCancelPosBill = async () => {
    if (!posAlert) return;
    setIsPayingPos(true);
    try {
      await walletService.cancelOrder(posAlert.order_id);
      Toast.show({
        type: 'clubSuccess',
        text1: 'Order Cancelled',
        text2: `Order #${posAlert.order_id} has been cancelled.`,
      });
      setPosAlert(null);
      
      import('react-native').then(({ DeviceEventEmitter }) => {
          DeviceEventEmitter.emit('refresh_wallet');
      });
    } catch (error: any) {
      setTimeout(() => {
        const errorMessage = error?.response?.data?.error || error?.response?.data?.message || 'Could not cancel the order.';
        Toast.show({
          type: 'clubError',
          text1: 'Cancellation Failed',
          text2: errorMessage,
        });
      }, 500);
    } finally {
      setIsPayingPos(false);
    }
  };

  if (!posAlert) return null;

  return (
    <POSAlertModal
      visible={true}
      amount={posAlert.amount}
      isLoading={isPayingPos}
      onPay={handlePayPosBill}
      onCancel={handleCancelPosBill}
      onDismiss={() => setPosAlert(null)}
    />
  );
}
