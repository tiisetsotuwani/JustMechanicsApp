import { ArrowLeft, CreditCard, DollarSign, Clock, CheckCircle } from 'lucide-react';
import type { Booking } from '../App';

interface PaymentsProps {
  bookings: Booking[];
  onBack: () => void;
}

export function Payments({ bookings, onBack }: PaymentsProps) {
  const completedBookings = bookings.filter((b) => b.status === 'completed');
  const totalSpent = completedBookings.reduce((sum, b) => sum + (b.price || 0), 0);

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-6">
        <button onClick={onBack} className="flex items-center gap-2 mb-6">
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold">Support & Payments</h1>
        <p className="text-red-100 mt-2">Manage your payments and get help</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Payment Summary */}
        <div className="bg-gradient-to-br from-red-700 to-red-600 text-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Total Spent</h2>
            <DollarSign className="w-6 h-6" />
          </div>
          <p className="text-4xl font-bold">${totalSpent.toFixed(2)}</p>
          <p className="text-red-100 mt-2">{completedBookings.length} completed services</p>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Payment Methods</h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-4 border-2 border-red-700 rounded-xl bg-red-50">
              <CreditCard className="w-6 h-6 text-red-700" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">•••• •••• •••• 4242</p>
                <p className="text-sm text-gray-600">Expires 12/25</p>
              </div>
              <CheckCircle className="w-5 h-5 text-red-700" />
            </div>
            
            <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors">
              + Add Payment Method
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          
          {completedBookings.length > 0 ? (
            <div className="space-y-4">
              {completedBookings.map((booking) => (
                <div key={booking.id} className="flex items-start justify-between pb-4 border-b border-gray-200 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{booking.service}</p>
                    <p className="text-sm text-gray-600">{booking.vehicle}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(booking.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${booking.price?.toFixed(2)}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full mt-1">
                      <CheckCircle className="w-3 h-3" />
                      Paid
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No transactions yet</p>
          )}
        </div>

        {/* Support Options */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Need Help?</h3>
          
          <div className="space-y-3">
            <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors text-left">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <MessageIcon className="w-6 h-6 text-red-700" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Live Chat Support</p>
                <p className="text-sm text-gray-600">Available 24/7</p>
              </div>
            </button>
            
            <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors text-left">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <PhoneIcon className="w-6 h-6 text-red-700" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Call Support</p>
                <p className="text-sm text-gray-600">1-800-MECHANIC</p>
              </div>
            </button>
            
            <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors text-left">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <HelpIcon className="w-6 h-6 text-red-700" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Help Center</p>
                <p className="text-sm text-gray-600">FAQs and guides</p>
              </div>
            </button>
          </div>
        </div>

        {/* Promo Code */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Have a Promo Code?</h3>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter code"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
            />
            <button className="bg-red-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-800 transition-colors">
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
