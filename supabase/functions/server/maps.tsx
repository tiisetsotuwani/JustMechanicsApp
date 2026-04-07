import { Context } from "npm:hono";
import { log } from "./logger.tsx";

type Coordinates = { lat: number; lng: number };

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const toRadians = (value: number) => (value * Math.PI) / 180;

const haversineKm = (a: Coordinates, b: Coordinates) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const startLat = toRadians(a.lat);
  const endLat = toRadians(b.lat);
  const inner =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(startLat) * Math.cos(endLat);
  const c = 2 * Math.atan2(Math.sqrt(inner), Math.sqrt(1 - inner));
  return earthRadiusKm * c;
};

export const mapRoutes = {
  geocode: async (c: Context) => {
    try {
      const query = (c.req.query('q') || '').trim();
      if (!query) {
        return c.json({ error: 'Missing query parameter q' }, 400);
      }

      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(
        query,
      )}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'JustMechanic/1.0',
        },
      });

      if (!response.ok) {
        return c.json({ results: [] });
      }

      const payload = (await response.json()) as Array<Record<string, unknown>>;
      const results = payload
        .map((item) => ({
          displayName: String(item.display_name || ''),
          lat: Number(item.lat),
          lng: Number(item.lon),
        }))
        .filter((item) => isNumber(item.lat) && isNumber(item.lng) && item.displayName);

      return c.json({ results });
    } catch (error) {
      log('error', 'Map geocode error', { error: String(error) });
      return c.json({ error: 'Internal server error geocoding address' }, 500);
    }
  },

  reverse: async (c: Context) => {
    try {
      const lat = Number(c.req.query('lat'));
      const lng = Number(c.req.query('lng'));
      if (!isNumber(lat) || !isNumber(lng)) {
        return c.json({ error: 'Invalid lat/lng query params' }, 400);
      }

      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'JustMechanic/1.0',
        },
      });

      if (!response.ok) {
        return c.json({ address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
      }

      const payload = (await response.json()) as Record<string, unknown>;
      return c.json({
        address: String(payload.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`),
      });
    } catch (error) {
      log('error', 'Map reverse geocode error', { error: String(error) });
      return c.json({ error: 'Internal server error reverse geocoding' }, 500);
    }
  },

  eta: async (c: Context) => {
    try {
      const body = (await c.req.json()) as {
        from?: Coordinates;
        to?: Coordinates;
      };
      const from = body.from;
      const to = body.to;
      if (!from || !to || !isNumber(from.lat) || !isNumber(from.lng) || !isNumber(to.lat) || !isNumber(to.lng)) {
        return c.json({ error: 'Invalid from/to coordinates' }, 400);
      }

      const fallbackDistanceKm = haversineKm(from, to);
      const fallbackDurationMin = Math.max(1, Math.round((fallbackDistanceKm / 35) * 60));

      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
        const osrmResponse = await fetch(osrmUrl);
        if (osrmResponse.ok) {
          const payload = (await osrmResponse.json()) as {
            routes?: Array<{ distance?: number; duration?: number }>;
          };
          const route = payload.routes?.[0];
          if (route && isNumber(route.distance) && isNumber(route.duration)) {
            return c.json({
              distanceKm: Number((route.distance / 1000).toFixed(2)),
              durationMin: Math.max(1, Math.round(route.duration / 60)),
              source: 'osrm',
            });
          }
        }
      } catch {
        // Fallback below.
      }

      return c.json({
        distanceKm: Number(fallbackDistanceKm.toFixed(2)),
        durationMin: fallbackDurationMin,
        source: 'haversine',
      });
    } catch (error) {
      log('error', 'Map ETA error', { error: String(error) });
      return c.json({ error: 'Internal server error calculating ETA' }, 500);
    }
  },
};
