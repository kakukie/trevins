interface PaymentRequest {
  bookingId?: string;
  accommodationBookingId?: string;
  amount: number;
  paymentMethod: string;
  userId: string;
}

interface PaymentResponse {
  success: boolean;
  transactionCode?: string;
  paymentUrl?: string;
  status?: string;
  error?: string;
  mockData?: any;
}

/**
 * Mock Payment Gateway Service
 * This simulates a real payment gateway for testing purposes
 */
export class MockPaymentGateway {
  private static generateTransactionCode(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PAY${timestamp}${random}`;
  }

  private static generatePaymentUrl(transactionCode: string): string {
    // In a real scenario, this would be the actual payment gateway URL
    return `${process.env.NEXT_PUBLIC_APP_URL}/payment/checkout/${transactionCode}`;
  }

  /**
   * Create a payment intent/initiate payment
   */
  static async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const transactionCode = this.generateTransactionCode();
      const paymentUrl = this.generatePaymentUrl(transactionCode);

      // Log the payment initiation for debugging
      console.log('[Mock Payment] Payment initiated:', {
        transactionCode,
        amount: request.amount,
        paymentMethod: request.paymentMethod,
      });

      return {
        success: true,
        transactionCode,
        paymentUrl,
        status: 'PENDING',
        mockData: {
          gateway: 'Mock Payment Gateway',
          initiatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        },
      };
    } catch (error) {
      console.error('[Mock Payment] Error initiating payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate payment',
      };
    }
  }

  /**
   * Simulate payment completion
   * In a real scenario, this would be called by the payment gateway webhook
   */
  static async completePayment(transactionCode: string): Promise<PaymentResponse> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Simulate success rate (95% success)
      const isSuccess = Math.random() < 0.95;

      if (!isSuccess) {
        console.log('[Mock Payment] Payment failed:', { transactionCode });
        return {
          success: false,
          status: 'FAILED',
          transactionCode,
          error: 'Payment processing failed by mock gateway',
        };
      }

      console.log('[Mock Payment] Payment completed:', { transactionCode });

      return {
        success: true,
        transactionCode,
        status: 'SUCCESS',
        mockData: {
          gateway: 'Mock Payment Gateway',
          completedAt: new Date().toISOString(),
          paymentMethod: 'MOCK_CARD',
        },
      };
    } catch (error) {
      console.error('[Mock Payment] Error completing payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete payment',
      };
    }
  }

  /**
   * Get payment status
   */
  static async getPaymentStatus(transactionCode: string): Promise<PaymentResponse> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // In a real scenario, this would query the payment gateway
      const statuses = ['PENDING', 'SUCCESS', 'FAILED', 'EXPIRED'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

      return {
        success: true,
        transactionCode,
        status: randomStatus,
        mockData: {
          gateway: 'Mock Payment Gateway',
          checkedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('[Mock Payment] Error getting payment status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get payment status',
      };
    }
  }

  /**
   * Simulate refund
   */
  static async refundPayment(transactionCode: string, amount?: number): Promise<PaymentResponse> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const refundCode = `REF${Date.now()}`;

      console.log('[Mock Payment] Refund initiated:', {
        transactionCode,
        refundCode,
        amount,
      });

      return {
        success: true,
        transactionCode: refundCode,
        status: 'REFUNDED',
        mockData: {
          gateway: 'Mock Payment Gateway',
          originalTransaction: transactionCode,
          refundAmount: amount,
          refundedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('[Mock Payment] Error processing refund:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process refund',
      };
    }
  }

  /**
   * Validate webhook signature
   * In a real scenario, this would validate the webhook signature from the payment gateway
   */
  static validateWebhookSignature(
    payload: any,
    signature: string,
    secret: string
  ): boolean {
    // In a real scenario, this would use HMAC or similar to verify the signature
    console.log('[Mock Payment] Webhook signature validated (mock)');
    return true;
  }

  /**
   * Get available payment methods
   */
  static getAvailablePaymentMethods(): Array<{
    id: string;
    name: string;
    icon: string;
    fee: number;
  }> {
    return [
      {
        id: 'CREDIT_CARD',
        name: 'Credit Card',
        icon: 'credit-card',
        fee: 0,
      },
      {
        id: 'DEBIT_CARD',
        name: 'Debit Card',
        icon: 'credit-card',
        fee: 0,
      },
      {
        id: 'BANK_TRANSFER',
        name: 'Bank Transfer',
        icon: 'building-2',
        fee: 5000,
      },
      {
        id: 'E_WALLET',
        name: 'E-Wallet (GoPay, OVO, Dana)',
        icon: 'wallet',
        fee: 2000,
      },
      {
        id: 'QRIS',
        name: 'QRIS',
        icon: 'qr-code',
        fee: 1500,
      },
    ];
  }
}

// Export convenience functions
export const initiatePayment = MockPaymentGateway.initiatePayment;
export const completePayment = MockPaymentGateway.completePayment;
export const getPaymentStatus = MockPaymentGateway.getPaymentStatus;
export const refundPayment = MockPaymentGateway.refundPayment;
export const validateWebhookSignature = MockPaymentGateway.validateWebhookSignature;
export const getAvailablePaymentMethods = MockPaymentGateway.getAvailablePaymentMethods;