import { useState } from 'react';
import { ArrowLeft, MapPin, Car, Wrench } from 'lucide-react';
import type { Booking } from '../App';

interface RequestMechanicProps {
  onBack: () => void;
  onSubmit: (booking: Booking) => void;
}

export function RequestMechanic({ onBack, onSubmit }: RequestMechanicProps) {
  const [selectedService, setSelectedService] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const services = [
    'Oil Change',
    'Battery Replacement',
    'Tire Service',
    'Brake Repair',
    'Engine Diagnostics',
    'Full Service',
    'Transmission',
    'Air Conditioning',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedService && vehicle && location) {
      onSubmit({
        id: '',
        service: selectedService,
        vehicle,
        location,
        status: 'pending',
        date: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-6">
        <button onClick={onBack} className="flex items-center gap-2 mb-6">
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold">Request a Mechanic</h1>
        <p className="text-red-100 mt-2">We'll find the best mechanic near you</p>
      </div>

      <div className="px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Selection */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <label className="flex items-center gap-2 text-gray-900 font-semibold mb-4">
              <Wrench className="w-5 h-5 text-red-700" />
              Select Service
            </label>
            <div className="grid grid-cols-2 gap-3">
              {services.map((service) => (
                <button
                  key={service}
                  type="button"
                  onClick={() => setSelectedService(service)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedService === service
                      ? 'border-red-700 bg-red-50 text-red-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium">{service}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <label className="flex items-center gap-2 text-gray-900 font-semibold mb-4">
              <Car className="w-5 h-5 text-red-700" />
              Vehicle Information
            </label>
            <input
              type="text"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              placeholder="e.g., Toyota Camry 2020"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
              required
            />
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <label className="flex items-center gap-2 text-gray-900 font-semibold mb-4">
              <MapPin className="w-5 h-5 text-red-700" />
              Service Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter your address"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent mb-3"
              required
            />
            <button
              type="button"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      setLocation(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
                    },
                    () => {
                      setLocation('Location access denied - please enter manually');
                    }
                  );
                } else {
                  setLocation('Geolocation not supported - please enter manually');
                }
              }}
              className="text-red-700 text-sm font-medium flex items-center gap-2 hover:text-red-800"
            >
              <MapPin className="w-4 h-4" />
              Use current location
            </button>
          </div>

          {/* Additional Details */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <label className="text-gray-900 font-semibold mb-4 block">
              Additional Details (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue or any specific requirements..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!selectedService || !vehicle || !location}
            className="w-full bg-red-700 text-white py-4 rounded-xl font-semibold hover:bg-red-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Request Mechanic
          </button>
        </form>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>We'll match you with a qualified mechanic nearby</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Track your mechanic in real-time</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Pay securely after service completion</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
