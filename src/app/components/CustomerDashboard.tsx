import { Bell, Settings, Wrench, MapPin, Car, CreditCard, Droplet, Battery, Target, MoreHorizontal, MessageCircle } from 'lucide-react';
import type { Booking } from '../App';

interface CustomerDashboardProps {
  userName: string;
  activeBooking: Booking | null;
  onNavigate: (screen: string) => void;
}

export function CustomerDashboard({ userName, activeBooking, onNavigate }: CustomerDashboardProps) {
  const services = [
    { id: 'oil', name: 'OIL CHANGE', icon: Droplet },
    { id: 'battery', name: 'BATTERY', icon: Battery },
    { id: 'tires', name: 'TIRES', icon: Target },
    { id: 'diagnostics', name: 'DIAGNOSTICS', icon: Car },
    { id: 'full', name: 'FULL SERVICE', icon: Wrench },
    { id: 'more', name: 'MORE...', icon: MoreHorizontal },
  ];

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center">
              <Wrench className="w-8 h-8 text-red-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">JustMechanic</h1>
              <p className="text-sm text-red-100">Customer Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center">
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-4">
        {/* Greeting */}
        <div className="mb-6">
          <h2 className="text-3xl text-gray-900 mb-6">Hello, {userName}</h2>
          
          {/* Action Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => onNavigate('request')}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col items-start gap-3"
            >
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Wrench className="w-6 h-6 text-red-700" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Request</div>
                <div className="font-semibold text-gray-900">Mechanic</div>
              </div>
            </button>

            <button
              onClick={() => onNavigate('track')}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col items-start gap-3"
            >
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-red-700" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Track</div>
                <div className="font-semibold text-gray-900">Mechanic</div>
              </div>
            </button>

            <button
              onClick={() => onNavigate('services')}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col items-start gap-3"
            >
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Car className="w-6 h-6 text-red-700" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Services</div>
              </div>
            </button>

            <button
              onClick={() => onNavigate('directory')}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col items-start gap-3"
            >
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Directory</div>
              </div>
            </button>
          </div>
        </div>

        {/* Active Booking */}
        {activeBooking && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex items-start gap-4 mb-4">
              <img
                src={activeBooking.mechanicImage}
                alt={activeBooking.mechanicName}
                className="w-14 h-14 rounded-full object-cover"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{activeBooking.service}</h3>
                <p className="text-sm text-gray-600">{activeBooking.vehicle}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-900">On the way</div>
              <button
                onClick={() => onNavigate('track')}
                className="bg-red-700 text-white px-6 py-2 rounded-lg hover:bg-red-800 transition-colors"
              >
                Track in Real-Time
              </button>
            </div>
          </div>
        )}

        {/* Service Categories */}
        <div className="grid grid-cols-3 gap-4">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <button
                key={service.id}
                onClick={() => onNavigate('services')}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center gap-3"
              >
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Icon className="w-6 h-6 text-red-700" />
                </div>
                <div className="text-xs font-semibold text-gray-900 text-center leading-tight">
                  {service.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Promo Banner */}
        <div className="mt-6 bg-gradient-to-r from-red-700 to-red-600 text-white rounded-2xl p-6 text-center">
          <p className="text-lg font-semibold">Get 20% off on your first booking!</p>
        </div>
      </div>

      {/* Floating AI Chat Button */}
      <button
        onClick={() => onNavigate('ai-chat')}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group animate-bounce"
        style={{ animationDuration: '3s' }}
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></span>
      </button>
    </div>
  );
}