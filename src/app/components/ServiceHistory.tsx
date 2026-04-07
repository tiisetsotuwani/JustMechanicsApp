import { useEffect, useState } from 'react';
import { ArrowLeft, Camera, FileText, ShieldAlert } from 'lucide-react';
import { api } from '../../utils/api';
import type { Booking } from '../../shared/types';

interface ServiceHistoryProps {
  onBack: () => void;
  onOpenInvoice: (booking: Booking) => void;
  onOpenDocumentation: (booking: Booking) => void;
  onOpenDisputes: (booking: Booking) => void;
}

export function ServiceHistory({
  onBack,
  onOpenInvoice,
  onOpenDocumentation,
  onOpenDisputes,
}: ServiceHistoryProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.bookings.getMyBookings();
        setBookings((response.bookings || []).filter((booking: Booking) => booking.status === 'completed'));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load service history');
      }
    };

    void load();
  }, []);

  const groups = bookings.reduce<Record<string, Booking[]>>((accumulator, booking) => {
    const key = booking.vehicle || 'Unknown vehicle';
    accumulator[key] = accumulator[key] || [];
    accumulator[key].push(booking);
    return accumulator;
  }, {});

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-6">
        <button onClick={onBack} className="flex items-center gap-2 mb-6">
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold">Service History</h1>
      </div>

      <div className="px-6 py-6 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{error}</div>}
        {Object.entries(groups).map(([vehicle, vehicleBookings]) => (
          <div key={vehicle} className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">{vehicle}</h2>
            <div className="space-y-4">
              {vehicleBookings.map((booking) => (
                <div key={booking.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">{booking.service}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(booking.completedAt || booking.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">R{(booking.price || 0).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Rating: {booking.rating || 'Not rated'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <button
                      onClick={() => onOpenInvoice(booking)}
                      className="flex items-center justify-center gap-2 bg-red-50 text-red-700 py-2 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Invoice
                    </button>
                    <button
                      onClick={() => onOpenDocumentation(booking)}
                      className="flex items-center justify-center gap-2 bg-stone-100 text-stone-700 py-2 rounded-xl text-sm font-medium hover:bg-stone-200 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      Photos
                    </button>
                    <button
                      onClick={() => onOpenDisputes(booking)}
                      className="flex items-center justify-center gap-2 bg-amber-50 text-amber-700 py-2 rounded-xl text-sm font-medium hover:bg-amber-100 transition-colors"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      Dispute
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {bookings.length === 0 && !error && (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-gray-500">
            No completed services yet.
          </div>
        )}
      </div>
    </div>
  );
}
