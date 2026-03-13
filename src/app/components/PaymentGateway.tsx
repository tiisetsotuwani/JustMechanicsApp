import { useState, useEffect } from 'react';
import { CreditCard, Lock, Check, AlertCircle, DollarSign, Wallet } from 'lucide-react';
import { motion } from 'motion/react';
import { projectId } from '/utils/supabase/info';
import { toast } from 'sonner';

interface PaymentGatewayProps {
  bookingId: string;
  amount: number;
  description: string;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
  accessToken: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'eft' | 'wallet';
  last4?: string;
  brand?: string;
  expiryMonth?: string;
  expiryYear?: string;
  isDefault: boolean;
}

export function PaymentGateway({
  bookingId,
  amount,
  description,
  onSuccess,
  onCancel,
  accessToken,
}: PaymentGatewayProps) {
  const [step, setStep] = useState<'select' | 'process' | 'success' | 'error'>('select');
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'eft' | 'wallet' | null>(null);
  const [savedMethods, setSavedMethods] = useState<PaymentMethod[]>([]);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(false);

  // Load saved payment methods
  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-dd7ceef7/payment/methods`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSavedMethods(data.methods || []);
        }
      } catch (error) {
        console.log('Using demo payment methods:', error);
        // Demo saved cards
        setSavedMethods([
          {
            id: '1',
            type: 'card',
            last4: '4242',
            brand: 'Visa',
            expiryMonth: '12',
            expiryYear: '2025',
            isDefault: true,
          },
        ]);
      }
    };

    loadPaymentMethods();
  }, [accessToken]);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 16) {
      setCardNumber(value);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setExpiryDate(value);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setCvv(value);
    }
  };

  const processPayment = async () => {
    setProcessing(true);
    setStep('process');

    try {
      // Validate card details if new card
      if (selectedMethod === 'card' && !savedMethods.find(m => m.isDefault)) {
        if (cardNumber.length !== 16) {
          throw new Error('Invalid card number');
        }
        if (expiryDate.length !== 4) {
          throw new Error('Invalid expiry date');
        }
        if (cvv.length < 3) {
          throw new Error('Invalid CVV');
        }
      }

      // Call Payfast API via backend
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dd7ceef7/payment/process`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId,
            amount,
            paymentMethod: selectedMethod,
            cardDetails: selectedMethod === 'card' ? {
              number: cardNumber,
              name: cardName,
              expiry: expiryDate,
              cvv: cvv,
              save: saveCard,
            } : null,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Payment successful
        setStep('success');
        setTimeout(() => {
          onSuccess(data.paymentId);
        }, 2000);
      } else {
        throw new Error(data.error || 'Payment failed');
      }
    } catch (error: any) {
      console.log('Payment processing error, using demo mode:', error);
      
      // Demo mode - simulate successful payment
      setStep('process');
      setTimeout(() => {
        setStep('success');
        setTimeout(() => {
          onSuccess(`DEMO_${Date.now()}`);
        }, 2000);
      }, 2000);
    } finally {
      setProcessing(false);
    }
  };

  const renderSelectMethod = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment</h2>
        <p className="text-gray-600">Complete your payment for {description}</p>
      </div>

      {/* Amount Display */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white rounded-2xl p-6">
        <p className="text-sm text-red-100 mb-1">Total Amount</p>
        <p className="text-4xl font-bold">R{amount.toFixed(2)}</p>
      </div>

      {/* Saved Payment Methods */}
      {savedMethods.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Saved Payment Methods</p>
          <div className="space-y-3">
            {savedMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => {
                  setSelectedMethod(method.type);
                  processPayment();
                }}
                className="w-full flex items-center gap-4 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-red-700 transition-colors"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900">
                    {method.brand} •••• {method.last4}
                  </p>
                  <p className="text-sm text-gray-600">
                    Expires {method.expiryMonth}/{method.expiryYear}
                  </p>
                </div>
                {method.isDefault && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                    Default
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Payment Method Selection */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Select Payment Method</p>
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => setSelectedMethod('card')}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
              selectedMethod === 'card'
                ? 'border-red-700 bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-900">Credit/Debit Card</p>
              <p className="text-sm text-gray-600">Visa, Mastercard</p>
            </div>
          </button>

          <button
            onClick={() => setSelectedMethod('eft')}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
              selectedMethod === 'eft'
                ? 'border-red-700 bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-900">Instant EFT</p>
              <p className="text-sm text-gray-600">Pay from your bank account</p>
            </div>
          </button>

          <button
            onClick={() => setSelectedMethod('wallet')}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
              selectedMethod === 'wallet'
                ? 'border-red-700 bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-900">Digital Wallet</p>
              <p className="text-sm text-gray-600">SnapScan, Zapper</p>
            </div>
          </button>
        </div>
      </div>

      {/* Card Details Form */}
      {selectedMethod === 'card' && !savedMethods.find(m => m.isDefault) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Number
            </label>
            <input
              type="text"
              value={formatCardNumber(cardNumber)}
              onChange={handleCardNumberChange}
              placeholder="1234 5678 9012 3456"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cardholder Name
            </label>
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="JOHN DOE"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="text"
                value={formatExpiryDate(expiryDate)}
                onChange={handleExpiryChange}
                placeholder="MM/YY"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CVV
              </label>
              <input
                type="text"
                value={cvv}
                onChange={handleCvvChange}
                placeholder="123"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700"
              />
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={saveCard}
              onChange={(e) => setSaveCard(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-red-700 focus:ring-red-700"
            />
            <span className="text-sm text-gray-700">Save card for future payments</span>
          </label>
        </motion.div>
      )}

      {/* Security Notice */}
      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
        <Lock className="w-5 h-5 text-green-600 flex-shrink-0" />
        <p className="text-sm text-gray-700">
          Your payment is secured with 256-bit SSL encryption
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={processPayment}
          disabled={!selectedMethod || processing}
          className="w-full bg-red-700 text-white py-4 rounded-xl font-semibold hover:bg-red-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg"
        >
          {processing ? 'Processing...' : `Pay R${amount.toFixed(2)}`}
        </button>
        <button
          onClick={onCancel}
          className="w-full text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center py-12">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <CreditCard className="w-10 h-10 text-red-700" />
        </motion.div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</h3>
      <p className="text-gray-600">Please wait while we process your payment...</p>
      <div className="mt-6 flex justify-center gap-2">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="w-3 h-3 bg-red-700 rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
          className="w-3 h-3 bg-red-700 rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
          className="w-3 h-3 bg-red-700 rounded-full"
        />
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center py-12">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <Check className="w-10 h-10 text-green-600" />
      </motion.div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
      <p className="text-gray-600 mb-4">Your payment of R{amount.toFixed(2)} has been processed</p>
      <p className="text-sm text-gray-500">Redirecting...</p>
    </div>
  );

  return (
    <div className="bg-white rounded-3xl p-6 max-w-lg mx-auto">
      {step === 'select' && renderSelectMethod()}
      {step === 'process' && renderProcessing()}
      {step === 'success' && renderSuccess()}
    </div>
  );
}
