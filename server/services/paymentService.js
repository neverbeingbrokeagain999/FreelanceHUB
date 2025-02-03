import PaymentGateway from '../models/PaymentGateway.js';
import logger from '../config/logger.js';

const initializePaymentGateways = async () => {
  try {
    const gateways = [
      {
        name: 'stripe',
        isActive: true,
        settings: {
          minimumAmount: 1,
          maximumAmount: 999999,
          supportedCurrencies: ['USD', 'EUR', 'GBP'],
          processingFee: 2.9
        }
      },
      {
        name: 'paypal',
        isActive: true,
        settings: {
          minimumAmount: 1,
          maximumAmount: 999999,
          supportedCurrencies: ['USD', 'EUR', 'GBP'],
          processingFee: 3.5
        }
      },
      {
        name: 'razorpay',
        isActive: true,
        settings: {
          minimumAmount: 1,
          maximumAmount: 999999,
          supportedCurrencies: ['INR', 'USD'],
          processingFee: 2
        }
      }
    ];

    for (const gateway of gateways) {
      await PaymentGateway.findOneAndUpdate(
        { name: gateway.name },
        gateway,
        { upsert: true, new: true }
      );
    }
    logger.info('Payment gateways initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize payment gateways:', error);
  }
};

export default initializePaymentGateways;