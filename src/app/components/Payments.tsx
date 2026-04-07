import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle, DollarSign } from 'lucide-react';
import { api } from '../../utils/api';
import type { Booking, PaymentMethod, PaymentRecord, UserType } from '../../shared/types';

interface PaymentsProps {
  bookings: Booking[];
  userType: UserType;
  onBack: () => void;
}

export function Payments({ bookings, userType, onBack }: PaymentsProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [error, setError] = useState('');
  const [recordingFor, setRecordingFor] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');

  const loadPayments = async () => {
    try {
      const response = await api.payments.getMyPayments();
      setPayments(response.payments || []);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load payments');
    }
  };

  useEffect(() => {
    void loadPayments();
  }, []);

  const completedBookingsWithoutPayment = bookings.filter(
    (booking) => booking.status === 'completed' && !booking.paymentId,
  );

  const totals = useMemo(
    () =>
      payments.reduce(
        (accumulator, payment) => ({
          spent: accumulator.spent + payment.amount,
          platformFees: accumulator.platformFees + payment.platformFee,
          providerEarnings: accumulator.providerEarnings + payment.providerEarning,
        }),
        { spent: 0, platformFees: 0, providerEarnings: 0 },
      ),
    [payments],
  );

  const handleRecordPayment = async () => {
    if (!recordingFor || !amount) {
      setError('Select a booking and amount before recording payment.');
      return;
    }

    try {
      await api.payments.record(recordingFor, method, Number(amount));
      setRecordingFor('');
      setAmount('');
      await loadPayments();
    } catch (recordError) {
      setError(recordError instanceof Error ? recordError.message : 'Failed to record payment');
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-6">
        <button onClick={onBack} className="flex items-center gap-2 mb-6">
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-red-100 mt-2">Record and review real payment activity</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{error}</div>}

        <div className="bg-gradient-to-br from-red-700 to-red-600 text-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{userType === 'provider' ? 'Total Earnings' : 'Total Spent'}</h2>
            <DollarSign className="w-6 h-6" />
          </div>
          <p className="text-4xl font-bold">
            R{(userType === 'provider' ? totals.providerEarnings : totals.spent).toFixed(2)}
          </p>
          {userType === 'provider' && (
            <p className="text-red-100 mt-2">
              Platform fees: R{totals.platformFees.toFixed(2)} • Gross: R{totals.spent.toFixed(2)}
            </p>
          )}
        </div>

        {completedBookingsWithoutPayment.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-900">Record Payment</h2>
            <select
              value={recordingFor}
              onChange={(event) => {
                const selectedBooking = completedBookingsWithoutPayment.find((booking) => booking.id === event.target.value);
                setRecordingFor(event.target.value);
                setAmount(selectedBooking?.price ? String(selectedBooking.price) : '');
              }}
              className="w-full border border-gray-300 rounded-xl px-4 py-3"
            >
              <option value="">Select booking</option>
              {completedBookingsWithoutPayment.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {booking.service} • {booking.vehicle}
                </option>
              ))}
            </select>
            <select
              value={method}
              onChange={(event) => setMethod(event.target.value as PaymentMethod)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3"
            >
              <option value="cash">Cash</option>
              <option value="eft">EFT</option>
              <option value="card">Card</option>
            </select>
            <input
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Amount"
              className="w-full border border-gray-300 rounded-xl px-4 py-3"
            />
            <button
              onClick={() => void handleRecordPayment()}
              className="bg-red-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-800 transition-colors"
            >
              Record Payment
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Payment Activity</h2>
          <div className="space-y-4">
            {payments.map((payment) => {
              const booking = bookings.find((item) => item.id === payment.bookingId);
              return (
                <div key={payment.id} className="flex items-start justify-between pb-4 border-b border-gray-200 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{booking?.service || 'Booking payment'}</p>
                    <p className="text-sm text-gray-600">{new Date(payment.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500 mt-1 uppercase">{payment.method}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">R{payment.amount.toFixed(2)}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full mt-1">
                      <CheckCircle className="w-3 h-3" />
                      {payment.status}
                    </span>
                  </div>
                </div>
              );
            })}
            {payments.length === 0 && <p className="text-sm text-gray-500">No payments recorded yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
