import { walletService } from '../services/walletService';
import api from '../services/api';

jest.mock('../services/api');

describe('walletService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('history', () => {
    it('should successfully fetch history', async () => {
      const mockResponse = { data: [{ id: 1, amount: 100, type: 'credit' }] };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await walletService.history();

      expect(api.get).toHaveBeenCalledWith('/wallet/history');
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw an error on API failure', async () => {
      const errorMessage = 'Network Error';
      (api.get as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(walletService.history()).rejects.toThrow(errorMessage);
    });
  });

  describe('pay', () => {
    it('should successfully process payment', async () => {
      const mockResponse = { data: { message: 'Payment successful!' } };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await walletService.pay(500, 'Table 1', { prefix: 'ASC', data: {}, signature: 'xyz' });

      expect(api.post).toHaveBeenCalledWith('/wallet/pay', {
        amount: 500,
        description: 'Table 1',
        qr_payload: { prefix: 'ASC', data: {}, signature: 'xyz' }
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('topUp', () => {
    it('should successfully process top up', async () => {
      const mockResponse = { data: { message: 'Top up successful!' } };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await walletService.topUp(1000, 'razorpay', 'pay_123');

      expect(api.post).toHaveBeenCalledWith('/wallet/top-up', {
        amount: 1000,
        payment_method: 'razorpay',
        reference_id: 'pay_123'
      });
      expect(result).toEqual(mockResponse.data);
    });
  });
});
