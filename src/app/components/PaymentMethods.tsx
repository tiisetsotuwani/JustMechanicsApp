import { ArrowLeft, CreditCard, Plus, Trash2, Check } from 'lucide-react';
import { useState } from 'react';

interface PaymentMethodsProps {
  onBack: () => void;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  cardBrand?: 'visa' | 'mastercard' | 'amex';
  last4: string;
  expiry?: string;
  bankName?: string;
  isDefault: boolean;
}

export function PaymentMethods({ onBack }: PaymentMethodsProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      cardBrand: 'visa',
      last4: '4242',
      expiry: '12/25',
      isDefault: true
    },
    {
      id: '2',
      type: 'card',
      cardBrand: 'mastercard',
      last4: '5555',
      expiry: '09/26',
      isDefault: false
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);

  const handleSetDefault = (id: string) => {
    setPaymentMethods(prev =>
      prev.map(method => ({
        ...method,
        isDefault: method.id === id
      }))
    );
  };

  const handleDelete = (id: string) => {
    setPaymentMethods(prev => prev.filter(method => method.id !== id));
  };

  const getCardIcon = (brand?: string) => {
    const baseClasses = "w-12 h-8 rounded flex items-center justify-center text-white font-bold text-xs";
    switch (brand) {
      case 'visa':
        return <div className={`${baseClasses} bg-blue-600`}>VISA</div>;
      case 'mastercard':
        return <div className={`${baseClasses} bg-red-600`}>MC</div>;
      case 'amex':
        return <div className={`${baseClasses} bg-blue-800`}>AMEX</div>;
      default:
        return <CreditCard className="w-8 h-8 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-8">
        <button onClick={onBack} className="flex items-center gap-2 mb-4">
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-3">
          <CreditCard className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">Payment Methods</h1>
            <p className="text-red-100 mt-1">Manage your payment options</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Add New Payment Method */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-center gap-3 text-red-700 font-semibold mb-6"
        >
          <Plus className="w-5 h-5" />
          Add New Payment Method
        </button>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Add Card</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-red-700 text-white py-3 rounded-xl font-semibold hover:bg-red-800 transition-colors"
                >
                  Add Card
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Saved Payment Methods */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-2">
            Saved Cards
          </h2>
          {paymentMethods.map((method) => (
            <div key={method.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-4">
                {getCardIcon(method.cardBrand)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {method.cardBrand?.toUpperCase()} •••• {method.last4}
                    </h3>
                    {method.isDefault && (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        <Check className="w-3 h-3" />
                        Default
                      </span>
                    )}
                  </div>
                  {method.expiry && (
                    <p className="text-sm text-gray-600 mt-1">Expires {method.expiry}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!method.isDefault && (
                    <button
                      onClick={() => handleSetDefault(method.id)}
                      className="text-sm text-red-700 font-medium hover:text-red-800"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(method.id)}
                    className="p-2 text-gray-400 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-sm text-blue-800">
            <strong>Secure Payments:</strong> All payment information is encrypted and stored securely. 
            We use industry-standard security measures to protect your data.
          </p>
        </div>
      </div>
    </div>
  );
}
