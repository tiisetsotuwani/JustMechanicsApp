import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  mechanicLocation: [number, number];
  customerLocation: [number, number];
  mechanicName?: string;
}

export function MapView({ mechanicLocation, customerLocation, mechanicName }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mechanicMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const [currentMechanicPosition, setCurrentMechanicPosition] = useState(mechanicLocation);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const center: [number, number] = [
      (mechanicLocation[0] + customerLocation[0]) / 2,
      (mechanicLocation[1] + customerLocation[1]) / 2,
    ];

    // Create map
    const map = L.map(mapContainerRef.current, {
      center,
      zoom: 13,
      scrollWheelZoom: false,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Custom mechanic icon
    const mechanicIcon = L.divIcon({
      html: `<div style="background: #b91717; width: 40px; height: 40px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
          <path d="M6 8l4-4 4 4M6 12l4 4 4-4"/>
        </svg>
      </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      className: 'mechanic-marker',
    });

    // Custom customer icon
    const customerIcon = L.divIcon({
      html: `<div style="background: #2563eb; width: 40px; height: 40px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
        <div style="background: white; width: 10px; height: 10px; border-radius: 50%;"></div>
      </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      className: 'customer-marker',
    });

    // Add mechanic marker
    const mechanicMarker = L.marker(mechanicLocation, { icon: mechanicIcon })
      .addTo(map)
      .bindPopup(`<div style="text-align: center;"><strong>${mechanicName || 'Mechanic'}</strong><br/><span style="color: #666; font-size: 12px;">On the way</span></div>`);

    mechanicMarkerRef.current = mechanicMarker;

    // Add customer marker
    L.marker(customerLocation, { icon: customerIcon })
      .addTo(map)
      .bindPopup('<div style="text-align: center;"><strong>Your Location</strong><br/><span style="color: #666; font-size: 12px;">Service destination</span></div>');

    // Add route line
    const routeLine = L.polyline([mechanicLocation, customerLocation], {
      color: '#b91717',
      weight: 3,
      dashArray: '10, 10',
    }).addTo(map);

    routeLineRef.current = routeLine;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Animate mechanic movement
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMechanicPosition((prev) => {
        const latDiff = customerLocation[0] - prev[0];
        const lngDiff = customerLocation[1] - prev[1];
        const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

        // If close enough, stop moving
        if (distance < 0.001) {
          return prev;
        }

        // Move 2% closer each update
        const newPosition: [number, number] = [
          prev[0] + latDiff * 0.02,
          prev[1] + lngDiff * 0.02,
        ];

        // Update marker position
        if (mechanicMarkerRef.current) {
          mechanicMarkerRef.current.setLatLng(newPosition);
        }

        // Update route line
        if (routeLineRef.current) {
          routeLineRef.current.setLatLngs([newPosition, customerLocation]);
        }

        return newPosition;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [customerLocation]);

  return <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />;
}