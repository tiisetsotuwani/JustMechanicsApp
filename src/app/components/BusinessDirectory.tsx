import { ArrowLeft, Search, Star, MapPin, Phone, Clock, Filter, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface BusinessDirectoryProps {
  onBack: () => void;
}

export function BusinessDirectory({ onBack }: BusinessDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'repair', name: 'Repair Shops' },
    { id: 'tires', name: 'Tire Services' },
    { id: 'detailing', name: 'Detailing' },
    { id: 'body', name: 'Body Shops' },
    { id: 'oil', name: 'Oil Change' },
  ];

  const businesses = [
    {
      id: '1',
      name: 'Premium Auto Repair',
      category: 'repair',
      rating: 4.8,
      reviews: 234,
      distance: '1.2 miles',
      address: '123 Main St, City, State',
      phone: '(555) 123-4567',
      hours: 'Open until 6:00 PM',
      image: 'https://images.unsplash.com/photo-1763846403160-8fc2719f7985?w=400&h=300&fit=crop',
      services: ['Engine Repair', 'Transmission', 'Brakes'],
      isOpen: true,
    },
    {
      id: '2',
      name: 'QuickFix Tire Center',
      category: 'tires',
      rating: 4.9,
      reviews: 456,
      distance: '0.8 miles',
      address: '456 Oak Ave, City, State',
      phone: '(555) 234-5678',
      hours: 'Open 24/7',
      image: 'https://images.unsplash.com/photo-1763377278900-0ce8242c5005?w=400&h=300&fit=crop',
      services: ['Tire Replacement', 'Alignment', 'Balancing'],
      isOpen: true,
    },
    {
      id: '3',
      name: 'Shine & Detail Pro',
      category: 'detailing',
      rating: 4.7,
      reviews: 189,
      distance: '2.3 miles',
      address: '789 Pine Rd, City, State',
      phone: '(555) 345-6789',
      hours: 'Closed - Opens 8:00 AM',
      image: 'https://images.unsplash.com/photo-1761934657948-708146148588?w=400&h=300&fit=crop',
      services: ['Full Detail', 'Ceramic Coating', 'Paint Correction'],
      isOpen: false,
    },
    {
      id: '4',
      name: 'Express Oil & Lube',
      category: 'oil',
      rating: 4.6,
      reviews: 312,
      distance: '1.5 miles',
      address: '321 Elm St, City, State',
      phone: '(555) 456-7890',
      hours: 'Open until 8:00 PM',
      image: 'https://images.unsplash.com/photo-1763846403160-8fc2719f7985?w=400&h=300&fit=crop',
      services: ['Oil Change', 'Filter Replacement', 'Fluid Check'],
      isOpen: true,
    },
    {
      id: '5',
      name: 'Precision Body Works',
      category: 'body',
      rating: 4.9,
      reviews: 278,
      distance: '3.1 miles',
      address: '654 Maple Dr, City, State',
      phone: '(555) 567-8901',
      hours: 'Open until 5:00 PM',
      image: 'https://images.unsplash.com/photo-1763846403160-8fc2719f7985?w=400&h=300&fit=crop',
      services: ['Collision Repair', 'Painting', 'Dent Removal'],
      isOpen: true,
    },
  ];

  const filteredBusinesses = businesses.filter((business) => {
    const matchesSearch = business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.services.some(service => service.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || business.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-6">
        <button onClick={onBack} className="flex items-center gap-2 mb-6">
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold">Business Directory</h1>
        <p className="text-red-100 mt-2">Find auto services near you</p>
      </div>

      <div className="px-6 py-6">
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services, shops..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent bg-white"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2">
            <Filter className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Categories */}
        <div className="flex gap-3 overflow-x-auto mb-6 pb-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                selectedCategory === category.id
                  ? 'bg-red-700 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <p className="text-sm text-gray-600 mb-4">
          {filteredBusinesses.length} {filteredBusinesses.length === 1 ? 'business' : 'businesses'} found
        </p>

        {/* Business Listings */}
        <div className="space-y-4">
          {filteredBusinesses.map((business) => (
            <div key={business.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Image */}
              <div className="relative h-40">
                <img
                  src={business.image}
                  alt={business.name}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${
                  business.isOpen 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-500 text-white'
                }`}>
                  {business.isOpen ? 'Open' : 'Closed'}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{business.name}</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium text-gray-900">{business.rating}</span>
                      </div>
                      <span className="text-sm text-gray-500">({business.reviews} reviews)</span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 whitespace-nowrap">{business.distance}</span>
                </div>

                {/* Services */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {business.services.map((service) => (
                    <span key={service} className="px-3 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full">
                      {service}
                    </span>
                  ))}
                </div>

                {/* Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{business.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>{business.hours}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <a
                    href={`tel:${business.phone}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-700 text-white py-3 rounded-xl font-semibold hover:bg-red-800 transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    Call
                  </a>
                  <button className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-900 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                    View Details
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredBusinesses.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No businesses found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
