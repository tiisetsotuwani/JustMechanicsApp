import { ArrowLeft, Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';
import type { Booking } from '../App';

interface BookingsProps {
  bookings: Booking[];
  onBack: () => void;
  onViewBooking: (booking: Booking) => void;
}

export function Bookings({ bookings, onBack, onViewBooking }: BookingsProps) {
  const activeBookings = bookings.filter(
    (b) => b.status !== 'completed' && b.status !== 'pending'
  );
  const pastBookings = bookings.filter((b) => b.status === 'completed');
  const upcomingBookings = bookings.filter((b) => b.status === 'pending');

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'on-the-way':
        return 'bg-blue-100 text-blue-700';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'accepted':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: Booking['status']) => {
    return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-6">
        <button onClick={onBack} className="flex items-center gap-2 mb-6">
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold">My Bookings</h1>
        <p className="text-red-100 mt-2">Track and manage your services</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Active Bookings */}
        {activeBookings.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Services</h2>
            <div className="space-y-4">
              {activeBookings.map((booking) => (
                <button
                  key={booking.id}
                  onClick={() => onViewBooking(booking)}
                  className="w-full bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-left"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{booking.service}</h3>
                      <p className="text-sm text-gray-600">{booking.vehicle}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                  </div>
                  
                  {booking.mechanicName && (
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={booking.mechanicImage}
                        alt={booking.mechanicName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{booking.mechanicName}</p>
                        {booking.estimatedArrival && (
                          <p className="text-xs text-gray-500">Arriving in {booking.estimatedArrival}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{booking.location}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Bookings */}
        {upcomingBookings.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming</h2>
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <button
                  key={booking.id}
                  onClick={() => onViewBooking(booking)}
                  className="w-full bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-left"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{booking.service}</h3>
                      <p className="text-sm text-gray-600">{booking.vehicle}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(booking.date).toLocaleDateString()}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Past Bookings */}
        {pastBookings.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Past Services</h2>
            <div className="space-y-4">
              {pastBookings.map((booking) => (
                <button
                  key={booking.id}
                  onClick={() => onViewBooking(booking)}
                  className="w-full bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-left"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{booking.service}</h3>
                      <p className="text-sm text-gray-600">{booking.vehicle}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(booking.date).toLocaleDateString()}</span>
                      </div>
                      {booking.price && (
                        <p className="text-sm font-semibold text-gray-900">R{booking.price.toFixed(2)}</p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {bookings.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-600 mb-6">Start by requesting a mechanic</p>
            <button
              onClick={onBack}
              className="bg-red-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-800 transition-colors"
            >
              Request Service
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
