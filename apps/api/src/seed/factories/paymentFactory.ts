/**
 * Payment Factory for Demo Data Generation
 * Creates realistic payment patterns with proper success/failure ratios
 */

export interface PaymentData {
  memberId: string;
  paidMxnCents: number;
  status: 'succeeded' | 'failed' | 'refunded';
  provider: 'stripe' | 'mercadopago';
  providerRef: string;
  createdAt: Date;
  failureReason?: string;
}

export function createPaymentFactory() {
  // Payment amounts in MXN cents (realistic gym membership prices)
  const membershipPrices = [
    89900,  // $899 Basic monthly
    129900, // $1,299 Pro monthly
    189900, // $1,899 VIP monthly
    249900, // $2,499 Pro quarterly
    359900, // $3,599 VIP quarterly
    899900, // $8,999 Basic annual
    1299900, // $12,999 Pro annual
    1899900, // $18,999 VIP annual
  ];

  // Payment providers distribution: 60% MercadoPago, 40% Stripe
  const providers = [
    ...Array(60).fill('mercadopago'),
    ...Array(40).fill('stripe'),
  ];

  // Status distribution: 92% succeeded, 6% failed, 2% refunded
  const statusDistribution = [
    ...Array(92).fill('succeeded'),
    ...Array(6).fill('failed'),
    ...Array(2).fill('refunded'),
  ];

  const failureReasons = [
    'insufficient_funds',
    'card_declined',
    'expired_card',
    'processing_error',
    'fraud_detected',
    'network_error',
  ];

  return {
    create(memberId: string, dateOffset?: number): PaymentData {
      // Generate payment date (within last 30 days if no offset provided)
      const maxDaysBack = dateOffset || 30;
      const daysBack = Math.floor(Math.random() * maxDaysBack);
      const createdAt = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

      // Select amount, provider, and status
      const amount = membershipPrices[Math.floor(Math.random() * membershipPrices.length)];
      const provider = providers[Math.floor(Math.random() * providers.length)] as 'stripe' | 'mercadopago';
      const status = statusDistribution[Math.floor(Math.random() * statusDistribution.length)] as PaymentData['status'];

      // Generate provider reference
      const providerRef = this.generateProviderRef(provider, createdAt);

      // Add failure reason for failed payments
      const failureReason = status === 'failed' 
        ? failureReasons[Math.floor(Math.random() * failureReasons.length)]
        : undefined;

      return {
        memberId,
        paidMxnCents: amount,
        status,
        provider,
        providerRef,
        createdAt,
        failureReason,
      };
    },

    /**
     * Generate realistic provider reference IDs
     */
    generateProviderRef(provider: 'stripe' | 'mercadopago', date: Date): string {
      const timestamp = date.getTime().toString();
      const random = Math.random().toString(36).substring(2, 8);

      if (provider === 'stripe') {
        return `pi_${timestamp.slice(-8)}${random}`;
      } else {
        return `mp_${timestamp.slice(-8)}${random}`;
      }
    },

    /**
     * Create payment history for a member
     */
    createMemberPaymentHistory(
      memberId: string, 
      monthsBack: number = 6,
      paymentsPerMonth: number = 1
    ): PaymentData[] {
      const payments: PaymentData[] = [];

      for (let month = 0; month < monthsBack; month++) {
        for (let payment = 0; payment < paymentsPerMonth; payment++) {
          const daysBack = month * 30 + Math.floor(Math.random() * 30);
          const paymentData = this.create(memberId, daysBack);
          payments.push(paymentData);
        }
      }

      return payments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },

    /**
     * Create payments with specific success rate
     */
    createWithSuccessRate(
      memberId: string,
      count: number,
      successRate: number = 0.92
    ): PaymentData[] {
      const payments: PaymentData[] = [];
      
      for (let i = 0; i < count; i++) {
        const payment = this.create(memberId);
        
        // Override status based on desired success rate
        if (Math.random() < successRate) {
          payment.status = 'succeeded';
          payment.failureReason = undefined;
        } else {
          // Split failures between failed and refunded (80/20)
          payment.status = Math.random() < 0.8 ? 'failed' : 'refunded';
          if (payment.status === 'failed') {
            payment.failureReason = failureReasons[Math.floor(Math.random() * failureReasons.length)];
          }
        }
        
        payments.push(payment);
      }

      return payments;
    },

    /**
     * Generate revenue trend with weekend uplift
     */
    createRevenueTrend(
      memberIds: string[],
      days: number = 7
    ): PaymentData[] {
      const payments: PaymentData[] = [];

      for (let day = 0; day < days; day++) {
        const date = new Date(Date.now() - day * 24 * 60 * 60 * 1000);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        
        // Weekend uplift: 30% more payments on weekends
        const basePayments = isWeekend ? 13 : 10;
        const dailyPayments = Math.floor(basePayments + Math.random() * 5);

        for (let p = 0; p < dailyPayments; p++) {
          const memberId = memberIds[Math.floor(Math.random() * memberIds.length)];
          const payment = this.create(memberId, day);
          
          // Adjust creation time to specific day
          payment.createdAt = new Date(date);
          payment.createdAt.setHours(
            Math.floor(Math.random() * 24),
            Math.floor(Math.random() * 60)
          );

          payments.push(payment);
        }
      }

      return payments.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    },

    /**
     * Get payment statistics for validation
     */
    getPaymentStats(payments: PaymentData[]) {
      const total = payments.length;
      const succeeded = payments.filter(p => p.status === 'succeeded').length;
      const failed = payments.filter(p => p.status === 'failed').length;
      const refunded = payments.filter(p => p.status === 'refunded').length;

      const totalRevenue = payments
        .filter(p => p.status === 'succeeded')
        .reduce((sum, p) => sum + p.paidMxnCents, 0);

      return {
        total,
        succeeded,
        failed,
        refunded,
        successRate: succeeded / total,
        failureRate: failed / total,
        refundRate: refunded / total,
        totalRevenueMxnCents: totalRevenue,
        totalRevenueMxn: totalRevenue / 100,
      };
    },
  };
}

/**
 * Utility function to validate payment data
 */
export function validatePaymentData(payment: PaymentData): boolean {
  return !!(
    payment.memberId &&
    payment.paidMxnCents > 0 &&
    ['succeeded', 'failed', 'refunded'].includes(payment.status) &&
    ['stripe', 'mercadopago'].includes(payment.provider) &&
    payment.providerRef &&
    payment.createdAt instanceof Date
  );
}
