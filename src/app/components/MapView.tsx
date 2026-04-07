import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@maplibre/maplibre-gl-leaflet';

const OPEN_FREE_MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

interface MapViewProps {
  mechanicLocation: [number, number];
  customerLocation: [number, number];
  mechanicName?: string;
}

export function MapView({ mechanicLocation, customerLocation, mechanicName }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mechanicMarkerRef = useRef<L.Marker | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const center: [number, number] = [
      (mechanicLocation[0] + customerLocation[0]) / 2,
      (mechanicLocation[1] + customerLocation[1]) / 2,
    ];

    const map = L.map(mapContainerRef.current, {
      center,
      zoom: 13,
      scrollWheelZoom: false,
    });

    try {
      L.maplibreGL({ style: OPEN_FREE_MAP_STYLE_URL }).addTo(map);
    } catch {
      // Keep a raster fallback so tracking still works if vector layer setup fails.
      L.tileLayer(OSM_TILE_URL, {
        attribution: OSM_ATTRIBUTION,
        maxZoom: 19,
      }).addTo(map);
    }

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

    const customerIcon = L.divIcon({
      html: `<div style="background: #2563eb; width: 40px; height: 40px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
        <div style="background: white; width: 10px; height: 10px; border-radius: 50%;"></div>
      </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      className: 'customer-marker',
    });

    mechanicMarkerRef.current = L.marker(mechanicLocation, { icon: mechanicIcon })
      .addTo(map)
      .bindPopup(
        `<div style="text-align: center;"><strong>${mechanicName || 'Mechanic'}</strong><br/><span style="color: #666; font-size: 12px;">Live location</span></div>`,
      );

    customerMarkerRef.current = L.marker(customerLocation, { icon: customerIcon })
      .addTo(map)
      .bindPopup('<div style="text-align: center;"><strong>Your Location</strong><br/><span style="color: #666; font-size: 12px;">Service destination</span></div>');

    routeLineRef.current = L.polyline([mechanicLocation, customerLocation], {
      color: '#b91717',
      weight: 3,
      dashArray: '10, 10',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [customerLocation, mechanicLocation, mechanicName]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    mechanicMarkerRef.current?.setLatLng(mechanicLocation);
    mechanicMarkerRef.current?.bindPopup(
      `<div style="text-align: center;"><strong>${mechanicName || 'Mechanic'}</strong><br/><span style="color: #666; font-size: 12px;">Live location</span></div>`,
    );
    customerMarkerRef.current?.setLatLng(customerLocation);
    routeLineRef.current?.setLatLngs([mechanicLocation, customerLocation]);

    const bounds = L.latLngBounds([mechanicLocation, customerLocation]).pad(0.2);
    mapRef.current.fitBounds(bounds, { animate: true, maxZoom: 15 });
  }, [customerLocation, mechanicLocation, mechanicName]);

  return <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />;
}
