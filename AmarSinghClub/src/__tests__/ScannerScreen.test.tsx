import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ScannerScreen from '../screens/ScannerScreen';
import { walletService } from '../services/walletService';
import Toast from 'react-native-toast-message';

jest.mock('../services/walletService');
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));
jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    CameraView: ({ onBarcodeScanned, children }: any) => {
      return (
        <View testID="camera-view" {...{ onBarcodeScanned } as any}>
          {children}
        </View>
      );
    },
    useCameraPermissions: () => [{ granted: true }, jest.fn()],
  };
});
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  MaterialIcons: 'MaterialIcons',
}));

describe('ScannerScreen', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    replace: jest.fn(),
  };

  const mockRoute = {
    params: {
      action: 'pay',
    },
  };

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.clearAllMocks();
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    AsyncStorage.getItem = jest.fn().mockResolvedValue(JSON.stringify({ 
      member_id: '1234', 
      name: 'John Doe',
      wallet_balance: 1000 
    }));
  });

  it('renders correctly', async () => {
    const { getByText } = render(<ScannerScreen navigation={mockNavigation as any} route={mockRoute as any} />);
    
    // Wait for the useEffect to fetch user data
    await waitFor(() => {});
    
    expect(getByText('Scan to Pay')).toBeTruthy();
  });

  it('handles valid secure QR code matching user identity', async () => {
    const { getByTestId, getByText, getByPlaceholderText } = render(
      <ScannerScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Wait for the useEffect to fetch user data
    await waitFor(() => {});

    // Simulate scan
    const camera = getByTestId('camera-view');
    const validQrData = JSON.stringify({
      prefix: 'AMARSINGHCLUB',
      signature: 'valid_signature',
      data: { 
        table: 'Table 5',
        member_id: '1234',
        member_name: 'John Doe'
      }
    });
    
    fireEvent(camera, 'onBarcodeScanned', { type: 'qr', data: validQrData });
    
    // Wait for the amount input screen to appear (Identity Matched)
    await waitFor(() => {
      expect(getByText('Settle Bill')).toBeTruthy();
      expect(getByText('Enter Bill Amount')).toBeTruthy();
    });

    // Enter amount
    const amountInput = getByPlaceholderText('0.00');
    fireEvent.changeText(amountInput, '500');

    // Submit payment
    (walletService.pay as jest.Mock).mockResolvedValue({ message: 'Payment successful!' });
    
    const payButton = getByText('AUTHORIZE PAYMENT');
    fireEvent.press(payButton);

    await waitFor(() => {
      expect(walletService.pay).toHaveBeenCalledWith(500, 'Payment for Table 5', JSON.parse(validQrData));
      expect(mockNavigation.replace).toHaveBeenCalledWith('PaymentSuccess', expect.anything());
    });
  });

  it('rejects secure QR code with mismatched identity (member_id mismatch)', async () => {
    const { getByTestId } = render(
      <ScannerScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Wait for the useEffect to fetch user data
    await waitFor(() => {});

    const camera = getByTestId('camera-view');
    
    // QR Code belongs to member 9999, but logged in user is 1234
    const mismatchedQrData = JSON.stringify({
      prefix: 'AMARSINGHCLUB',
      signature: 'valid_signature',
      data: { 
        table: 'Table 5',
        member_id: '9999',
        member_name: 'Alice Smith'
      }
    });
    
    fireEvent(camera, 'onBarcodeScanned', { type: 'qr', data: mismatchedQrData });
    
    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({
        type: 'clubError',
        text1: 'Identity Mismatch',
        text2: 'This QR code is assigned to a different member.',
      }));
    });
  });

  it('handles generic fallback KOT string as valid table payload', async () => {
    const { getByTestId, getByText } = render(
      <ScannerScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Wait for the useEffect to fetch user data
    await waitFor(() => {});

    const camera = getByTestId('camera-view');
    const genericQrData = 'Table 10';
    
    fireEvent(camera, 'onBarcodeScanned', { type: 'qr', data: genericQrData });
    
    await waitFor(() => {
      // It should fallback and open the modal instead of throwing an error
      expect(getByText('Settle Bill')).toBeTruthy();
    });
  });
});
