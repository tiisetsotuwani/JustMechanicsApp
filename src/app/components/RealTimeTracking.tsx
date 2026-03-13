import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, MapPin, Phone, MessageCircle, Star, Clock, Navigation } from 'lucide-react';
import { motion } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Booking } from '../App';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface RealTimeTrackingProps {
  booking: Booking | null;
  onBack: () => void;
  onMessage: () => void;
  accessToken: string;
}

interface LocationUpdate {
  lat: number;
  lng: number;
  timestamp: number;
  speed?: number;
  heading?: number;
}

// Custom map component to recenter when location changes
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function RealTimeTracking({ booking, onBack, onMessage, accessToken }: RealTimeTrackingProps) {
  const [mechanicLocation, setMechanicLocation] = useState<LocationUpdate>({
    lat: -26.2041, // Johannesburg default
    lng: 28.0473,
    timestamp: Date.now(),
  });
  const [customerLocation] = useState<LocationUpdate>({
    lat: -26.1952,
    lng: 28.0348,
    timestamp: Date.now(),
  });
  const [eta, setEta] = useState<string>('Calculating...');
  const [distance, setDistance] = useState<string>('--');
  const [routePath, setRoutePath] = useState<[number, number][]>([]);

  // Create custom icons
  const mechanicIcon = L.divIcon({
    className: 'custom-icon',
    html: `<div style="background: #b91c1c; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });

  const customerIcon = L.divIcon({
    className: 'custom-icon',
    html: `<div style="background: #059669; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Calculate ETA based on distance and average speed
  const calculateETA = useCallback((distanceKm: number, speedKmh: number = 40): string => {
    const hours = distanceKm / speedKmh;
    const minutes = Math.ceil(hours * 60);
    
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${minutes} min`;
    
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  }, []);

  // Simulate real-time location updates (replace with actual WebSocket/API calls)
  useEffect(() => {
    if (!booking) return;

    const updateLocation = async () => {
      try {
        // In production, this would be a WebSocket connection or polling endpoint
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-dd7ceef7/tracking/${booking.id}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.location) {
            setMechanicLocation({
              lat: data.location.lat,
              lng: data.location.lng,
              timestamp: Date.now(),
              speed: data.location.speed,
              heading: data.location.heading,
            });
          }
        }
      } catch (error) {
        console.log('Using simulated location updates');
        // Simulate movement towards customer
        setMechanicLocation(prev => ({
          lat: prev.lat + (customerLocation.lat - prev.lat) * 0.05,
          lng: prev.lng + (customerLocation.lng - prev.lng) * 0.05,
          timestamp: Date.now(),
          speed: 35 + Math.random() * 20,
        }));
      }
    };

    // Update location every 5 seconds
    const interval = setInterval(updateLocation, 5000);
    updateLocation(); // Initial update

    return () => clearInterval(interval);
  }, [booking, accessToken, customerLocation]);

  // Update distance and ETA when location changes
  useEffect(() => {
    const dist = calculateDistance(
      mechanicLocation.lat,
      mechanicLocation.lng,
      customerLocation.lat,
      customerLocation.lng
    );
    
    setDistance(dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`);
    setEta(calculateETA(dist, mechanicLocation.speed || 40));

    // Create route path (simplified - in production use routing API)
    setRoutePath([
      [mechanicLocation.lat, mechanicLocation.lng],
      [customerLocation.lat, customerLocation.lng],
    ]);
  }, [mechanicLocation, customerLocation, calculateDistance, calculateETA]);

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

  const mapCenter: [number, number] = [
    (mechanicLocation.lat + customerLocation.lat) / 2,
    (mechanicLocation.lng + customerLocation.lng) / 2,
  ];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-4 relative z-10">
        <button onClick={onBack} className="flex items-center gap-2 mb-4">
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold">Live Tracking</h1>
      </div>

      {/* Real-Time Map */}
      <div className="relative flex-1 min-h-[400px]">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <RecenterMap center={mapCenter} />
          
          {/* Mechanic Marker */}
          <Marker position={[mechanicLocation.lat, mechanicLocation.lng]} icon={mechanicIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold">{booking.mechanicName}</p>
                <p className="text-sm text-gray-600">Your Mechanic</p>
                {mechanicLocation.speed && (
                  <p className="text-xs text-gray-500">{Math.round(mechanicLocation.speed)} km/h</p>
                )}
              </div>
            </Popup>
          </Marker>

          {/* Customer Marker */}
          <Marker position={[customerLocation.lat, customerLocation.lng]} icon={customerIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold">Your Location</p>
                <p className="text-sm text-gray-600">{booking.location}</p>
              </div>
            </Popup>
          </Marker>

          {/* Route Line */}
          <Polyline
            positions={routePath}
            color="#b91c1c"
            weight={4}
            opacity={0.7}
            dashArray="10, 10"
          />
        </MapContainer>

        {/* Live Status Overlay */}
        <div className="absolute top-4 left-4 right-4 z-[1000]">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <div>
                  <p className="font-semibold text-gray-900">On the way</p>
                  <p className="text-sm text-gray-600">{distance} away</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-red-700">
                  <Clock className="w-5 h-5" />
                  <span className="text-2xl font-bold">{eta}</span>
                </div>
                <p className="text-xs text-gray-500">Estimated arrival</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Sheet */}
      <div className="bg-white rounded-t-3xl px-6 py-6 shadow-2xl">
        {/* Mechanic Info */}
        <div className="flex items-start gap-4 mb-6">
          <img
            src={booking.mechanicImage}
            alt={booking.mechanicName}
            className="w-20 h-20 rounded-full object-cover border-4 border-gray-100"
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{booking.mechanicName}</h3>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-gray-600">4.9 (230 reviews)</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">{booking.service}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-red-700">R{booking.price}</p>
            <p className="text-xs text-gray-500">Estimated</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button className="flex items-center justify-center gap-2 py-4 bg-red-700 text-white rounded-xl font-semibold hover:bg-red-800 transition-colors shadow-md">
            <Phone className="w-5 h-5" />
            Call
          </button>
          <button 
            onClick={onMessage}
            className="flex items-center justify-center gap-2 py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-md"
          >
            <MessageCircle className="w-5 h-5" />
            Message
          </button>
        </div>

        {/* Share Location */}
        <button className="w-full flex items-center justify-center gap-2 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
          <Navigation className="w-5 h-5" />
          Share My Location
        </button>
      </div>
    </div>
  );
}
