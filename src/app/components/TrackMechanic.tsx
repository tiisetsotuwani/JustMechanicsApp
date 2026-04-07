import { ArrowLeft, Phone, MessageCircle, Star, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { MapView } from './MapView';
import { api } from '../../utils/api';
import type { Booking } from '../../shared/types';

const DEFAULT_MECHANIC_LOCATION: [number, number] = [-26.2041, 28.0473];
const DEFAULT_CUSTOMER_LOCATION: [number, number] = [-26.1952, 28.0348];

interface TrackMechanicProps {
  booking: Booking | null;
  onBack: () => void;
  onOpenChat?: () => void;
}

export function TrackMechanic({ booking, onBack, onOpenChat }: TrackMechanicProps) {
  const [mechanicLocation, setMechanicLocation] = useState<[number, number]>(DEFAULT_MECHANIC_LOCATION);
  const [customerLocation, setCustomerLocation] = useState<[number, number]>(DEFAULT_CUSTOMER_LOCATION);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);

  useEffect(() => {
    if (!booking) {
      return;
    }

    let isMounted = true;

    const resolveCustomerLocation = async (): Promise<[number, number]> => {
      if (booking.coordinates?.lat && booking.coordinates?.lng) {
        return [booking.coordinates.lat, booking.coordinates.lng];
      }

      try {
        const geocode = await api.maps.geocode(booking.location);
        const firstMatch = Array.isArray(geocode.results) ? geocode.results[0] : null;
        if (firstMatch && typeof firstMatch.lat === 'number' && typeof firstMatch.lng === 'number') {
          return [firstMatch.lat, firstMatch.lng];
        }
      } catch {
        // Fall back below.
      }

      return DEFAULT_CUSTOMER_LOCATION;
    };

    const loadTracking = async () => {
      try {
        const resolvedCustomerLocation = await resolveCustomerLocation();
        if (isMounted) {
          setCustomerLocation(resolvedCustomerLocation);
        }

        const response = await api.tracking.get(booking.id);
        const location = response.location as { lat?: number; lng?: number } | undefined;
        const nextMechanicLocation: [number, number] =
          typeof location?.lat === 'number' && typeof location?.lng === 'number'
            ? [location.lat, location.lng]
            : DEFAULT_MECHANIC_LOCATION;

        if (isMounted) {
          setMechanicLocation(nextMechanicLocation);
        }

        const eta = await api.maps.eta(
          { lat: nextMechanicLocation[0], lng: nextMechanicLocation[1] },
          { lat: resolvedCustomerLocation[0], lng: resolvedCustomerLocation[1] },
        );

        if (isMounted && typeof eta.durationMin === 'number') {
          setEtaMinutes(eta.durationMin);
        }
      } catch {
        if (isMounted) {
          setMechanicLocation(DEFAULT_MECHANIC_LOCATION);
          setEtaMinutes(null);
        }
      }
    };

    void loadTracking();
    const interval = window.setInterval(() => {
      void loadTracking();
    }, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [booking]);

  if (!booking) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No active booking</p>
          <button
            onClick={onBack}
            className="bg-red-700 text-white px-6 py-3 rounded-xl font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const formatTimelineTime = (value?: string) => (value ? new Date(value).toLocaleTimeString() : 'Pending');
  const handleCall = () => {
    if (booking.mechanicPhone) {
      window.open(`tel:${booking.mechanicPhone}`, '_self');
      return;
    }

    window.alert('Mechanic phone number is not available yet.');
  };

  const handleMessage = () => {
    if (onOpenChat) {
      onOpenChat();
      return;
    }

    window.alert('Chat coming soon.');
  };

  const timeline = [
    { label: 'Request Received', time: formatTimelineTime(booking.createdAt || booking.date), done: true, active: false },
    { label: 'Mechanic Assigned', time: formatTimelineTime(booking.acceptedAt), done: Boolean(booking.acceptedAt), active: booking.status === 'assigned' },
    { label: 'Mechanic Arrived', time: formatTimelineTime(booking.arrivedAt), done: Boolean(booking.arrivedAt), active: booking.status === 'arrived' },
    { label: 'Work In Progress', time: formatTimelineTime(booking.startedAt), done: Boolean(booking.startedAt), active: booking.status === 'in_progress' },
    { label: 'Service Complete', time: formatTimelineTime(booking.completedAt), done: Boolean(booking.completedAt), active: booking.status === 'completed' },
  ];

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-6">
        <button onClick={onBack} className="flex items-center gap-2 mb-6">
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold">Track Mechanic</h1>
      </div>

      <div className="relative h-80 bg-gray-300">
        <MapView
          mechanicLocation={mechanicLocation}
          customerLocation={customerLocation}
          mechanicName={booking.mechanicName}
        />
      </div>

      <div className="px-6 py-6 space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="font-semibold text-gray-900 capitalize">{booking.status.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{etaMinutes ? `${etaMinutes} min` : booking.estimatedArrival}</span>
            </div>
          </div>

          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-red-700"
              initial={{ width: '0%' }}
              animate={{ width: '60%' }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-4 mb-6">
            <img
              src={booking.mechanicImage}
              alt={booking.mechanicName}
              className="w-20 h-20 rounded-full object-cover"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{booking.mechanicName}</h3>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-gray-600">{booking.rating ? `${booking.rating.toFixed(1)} rating` : 'Verified mechanic'}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{booking.service}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCall}
              className="flex-1 bg-red-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-800 transition-colors"
            >
              <Phone className="w-5 h-5" />
              Call
            </button>
            <button
              onClick={handleMessage}
              className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Message
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900">Service Details</h3>

          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-gray-600">Service</span>
              <span className="font-medium text-gray-900">{booking.service}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-gray-600">Vehicle</span>
              <span className="font-medium text-gray-900">{booking.vehicle}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-gray-600">Location</span>
              <span className="font-medium text-gray-900 text-right">{booking.location}</span>
            </div>
            {booking.price && (
              <>
                <div className="border-t border-gray-200 pt-3" />
                <div className="flex justify-between items-start">
                  <span className="text-gray-900 font-semibold">Estimated Total</span>
                  <span className="text-xl font-bold text-red-700">R{booking.price}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Service Timeline</h3>
          <div className="space-y-4">
            {timeline.map((item, index) => {
              const isLast = index === timeline.length - 1;
              const dotClass = item.done
                ? item.active
                  ? 'bg-red-700 animate-pulse'
                  : 'bg-red-700'
                : 'bg-gray-300';
              const lineClass = item.done ? 'bg-red-700' : 'bg-gray-300';
              return (
                <div key={item.label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${dotClass}`} />
                    {!isLast && <div className={`w-0.5 h-12 ${lineClass}`} />}
                  </div>
                  <div className="flex-1 -mt-1">
                    <p className={`font-medium ${item.done ? 'text-gray-900' : 'text-gray-500'}`}>{item.label}</p>
                    <p className="text-sm text-gray-500">
                      {item.label === 'Mechanic Assigned' && etaMinutes
                        ? `ETA ${etaMinutes} min`
                        : item.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
