import { ArrowLeft, Droplet, Battery, Target, Car, Wrench, Wind, Zap, Settings } from 'lucide-react';

interface ServicesProps {
  onBack: () => void;
  onRequestService: (service: string) => void;
}

export function Services({ onBack, onRequestService }: ServicesProps) {
  const services = [
    {
      id: 'oil-change',
      name: 'Oil Change',
      description: 'Professional oil change service with quality oil',
      price: 'From $49.99',
      duration: '30-45 min',
      icon: Droplet,
      popular: true,
    },
    {
      id: 'battery',
      name: 'Battery Service',
      description: 'Battery testing, replacement, and diagnostics',
      price: 'From $89.99',
      duration: '20-30 min',
      icon: Battery,
      popular: true,
    },
    {
      id: 'tires',
      name: 'Tire Service',
      description: 'Tire rotation, balancing, and replacement',
      price: 'From $79.99',
      duration: '45-60 min',
      icon: Target,
      popular: false,
    },
    {
      id: 'brakes',
      name: 'Brake Repair',
      description: 'Brake pad replacement and brake system check',
      price: 'From $149.99',
      duration: '60-90 min',
      icon: Car,
      popular: false,
    },
    {
      id: 'diagnostics',
      name: 'Engine Diagnostics',
      description: 'Complete engine diagnostic scan and report',
      price: 'From $69.99',
      duration: '30-45 min',
      icon: Zap,
      popular: true,
    },
    {
      id: 'ac',
      name: 'AC Service',
      description: 'Air conditioning repair and recharge',
      price: 'From $99.99',
      duration: '45-60 min',
      icon: Wind,
      popular: false,
    },
    {
      id: 'transmission',
      name: 'Transmission Service',
      description: 'Transmission fluid change and inspection',
      price: 'From $129.99',
      duration: '60-75 min',
      icon: Settings,
      popular: false,
    },
    {
      id: 'full-service',
      name: 'Full Service',
      description: 'Comprehensive vehicle inspection and maintenance',
      price: 'From $249.99',
      duration: '120-150 min',
      icon: Wrench,
      popular: true,
    },
  ];

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-6">
        <button onClick={onBack} className="flex items-center gap-2 mb-6">
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold">Our Services</h1>
        <p className="text-red-100 mt-2">Professional care for your vehicle</p>
      </div>

      <div className="px-6 py-6">
        {/* Popular Services */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Popular Services</h2>
          <div className="space-y-4">
            {services
              .filter((service) => service.popular)
              .map((service) => {
                const Icon = service.icon;
                return (
                  <div
                    key={service.id}
                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-4">
                      <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-7 h-7 text-red-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{service.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">{service.duration}</p>
                            <p className="font-semibold text-red-700">{service.price}</p>
                          </div>
                          <button
                            onClick={() => onRequestService(service.name)}
                            className="bg-red-700 text-white px-6 py-2 rounded-lg hover:bg-red-800 transition-colors"
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* All Services */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Services</h2>
          <div className="space-y-4">
            {services
              .filter((service) => !service.popular)
              .map((service) => {
                const Icon = service.icon;
                return (
                  <div
                    key={service.id}
                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-4">
                      <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-7 h-7 text-red-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{service.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">{service.duration}</p>
                            <p className="font-semibold text-red-700">{service.price}</p>
                          </div>
                          <button
                            onClick={() => onRequestService(service.name)}
                            className="bg-red-700 text-white px-6 py-2 rounded-lg hover:bg-red-800 transition-colors"
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 bg-gradient-to-r from-red-700 to-red-600 text-white rounded-2xl p-6">
          <h3 className="font-semibold mb-2">All services include:</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="mt-1">✓</span>
              <span>Certified and experienced mechanics</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">✓</span>
              <span>Mobile service at your location</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">✓</span>
              <span>Quality parts and materials</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">✓</span>
              <span>90-day service guarantee</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
