import { ArrowLeft, MapPin, Phone, MessageCircle, Star, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { MapView } from './MapView';
import type { Booking } from '../App';

interface TrackMechanicProps {
  booking: Booking | null;
  onBack: () => void;
}

export function TrackMechanic({ booking, onBack }: TrackMechanicProps) {
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

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-6">
        <button onClick={onBack} className="flex items-center gap-2 mb-6">
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold">Track Mechanic</h1>
      </div>

      {/* Map Placeholder */}
      <div className="relative h-80 bg-gray-300">
        <MapView
          mechanicLocation={[40.7580, -73.9855]} // Example: Near Times Square, NYC
          customerLocation={[40.7489, -73.9680]} // Example: Near Empire State Building, NYC
          mechanicName={booking.mechanicName}
        />
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Status Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="font-semibold text-gray-900 capitalize">{booking.status.replace('-', ' ')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{booking.estimatedArrival}</span>
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

        {/* Mechanic Info */}
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
                <span className="text-sm text-gray-600">4.9 (230 reviews)</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{booking.service}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 bg-red-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-800 transition-colors">
              <Phone className="w-5 h-5" />
              Call
            </button>
            <button className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
              <MessageCircle className="w-5 h-5" />
              Message
            </button>
          </div>
        </div>

        {/* Service Details */}
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
                  <span className="text-xl font-bold text-red-700">${booking.price}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Service Timeline</h3>
          
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-red-700 rounded-full" />
                <div className="w-0.5 h-12 bg-red-700" />
              </div>
              <div className="flex-1 -mt-1">
                <p className="font-medium text-gray-900">Request Received</p>
                <p className="text-sm text-gray-500">2:45 PM</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-red-700 rounded-full" />
                <div className="w-0.5 h-12 bg-red-700" />
              </div>
              <div className="flex-1 -mt-1">
                <p className="font-medium text-gray-900">Mechanic Assigned</p>
                <p className="text-sm text-gray-500">2:47 PM</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-red-700 rounded-full animate-pulse" />
                <div className="w-0.5 h-12 bg-gray-300" />
              </div>
              <div className="flex-1 -mt-1">
                <p className="font-medium text-gray-900">On the Way</p>
                <p className="text-sm text-gray-500">Arriving in {booking.estimatedArrival}</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-gray-300 rounded-full" />
              </div>
              <div className="flex-1 -mt-1">
                <p className="font-medium text-gray-500">Service Complete</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Car({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
    </svg>
  );
}