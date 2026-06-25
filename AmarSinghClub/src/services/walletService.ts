import api from './api';

export const walletService = {
  // Method to handle adding funds
  topUp: async (amount: number, paymentMethod: 'razorpay' | 'cash', referenceId?: string) => {
    const response = await api.post('/wallet/top-up', {
      amount: amount,
      payment_method: paymentMethod,
      reference_id: referenceId,
    });
    return response.data;
  },

  // NEW: Method to fetch the transaction ledger
  history: async () => {
    const response = await api.get('/wallet/history');
    return response.data;
  },

  pay: async (amount: number, description: string, qrPayload?: any) => {
    const response = await api.post('/wallet/pay', {
      amount: amount,
      description: description,
      qr_payload: qrPayload,
    });
    return response.data;
  },

  approveOrder: async (orderId: string) => {
    const response = await api.post(`/member/orders/${orderId}/approve`);
    return response.data;
  },

  cancelOrder: async (orderId: string) => {
    const response = await api.post(`/member/orders/${orderId}/cancel`);
    return response.data;
  }
};