import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-dd7ceef7`;

// Store auth token
let authToken: string | null = null;

export const api = {
  // Set authentication token
  setAuthToken: (token: string | null) => {
    authToken = token;
  },

  // Get authentication token
  getAuthToken: () => authToken,

  // Helper to make authenticated requests
  request: async (endpoint: string, options: RequestInit = {}) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken || publicAnonKey}`,
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`API Error (${endpoint}):`, data);
      throw new Error(data.error || 'API request failed');
    }

    return data;
  },

  // ========== AUTH APIs ==========
  auth: {
    signup: async (email: string, password: string, name: string, userType: 'customer' | 'provider', phone?: string) => {
      return api.request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, userType, phone }),
      });
    },

    signin: async (email: string, password: string) => {
      const data = await api.request('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      // Store token
      if (data.session?.access_token) {
        api.setAuthToken(data.session.access_token);
      }
      
      return data;
    },

    getSession: async () => {
      return api.request('/auth/session', { method: 'GET' });
    },

    signout: async () => {
      const data = await api.request('/auth/signout', { method: 'POST' });
      api.setAuthToken(null);
      return data;
    },
  },

  // ========== PROFILE APIs ==========
  profile: {
    get: async () => {
      return api.request('/profile', { method: 'GET' });
    },

    update: async (updates: { name?: string; phone?: string; profileImage?: string }) => {
      return api.request('/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    // Addresses
    getAddresses: async () => {
      return api.request('/profile/addresses', { method: 'GET' });
    },

    addAddress: async (address: { label: string; street: string; city: string; state: string; zip: string; isDefault?: boolean }) => {
      return api.request('/profile/addresses', {
        method: 'POST',
        body: JSON.stringify(address),
      });
    },

    updateAddress: async (address: { id: string; label?: string; street?: string; city?: string; state?: string; zip?: string; isDefault?: boolean }) => {
      return api.request('/profile/addresses', {
        method: 'PUT',
        body: JSON.stringify(address),
      });
    },

    deleteAddress: async (id: string) => {
      return api.request('/profile/addresses', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
    },

    // Vehicles
    getVehicles: async () => {
      return api.request('/profile/vehicles', { method: 'GET' });
    },

    addVehicle: async (vehicle: { year: string; make: string; model: string; color?: string; licensePlate?: string; vin?: string; isDefault?: boolean }) => {
      return api.request('/profile/vehicles', {
        method: 'POST',
        body: JSON.stringify(vehicle),
      });
    },

    updateVehicle: async (vehicle: { id: string; year?: string; make?: string; model?: string; color?: string; licensePlate?: string; vin?: string; isDefault?: boolean }) => {
      return api.request('/profile/vehicles', {
        method: 'PUT',
        body: JSON.stringify(vehicle),
      });
    },

    deleteVehicle: async (id: string) => {
      return api.request('/profile/vehicles', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
    },
  },

  // ========== BOOKING APIs ==========
  bookings: {
    create: async (booking: { service: string; vehicle: string; location: string; description?: string; coordinates?: any }) => {
      return api.request('/bookings', {
        method: 'POST',
        body: JSON.stringify(booking),
      });
    },

    getMyBookings: async () => {
      return api.request('/bookings', { method: 'GET' });
    },

    getPending: async () => {
      return api.request('/bookings/pending', { method: 'GET' });
    },

    getById: async (id: string) => {
      return api.request(`/bookings/${id}`, { method: 'GET' });
    },

    accept: async (bookingId: string) => {
      return api.request('/bookings/accept', {
        method: 'POST',
        body: JSON.stringify({ bookingId }),
      });
    },

    updateStatus: async (bookingId: string, status: string, price?: number) => {
      return api.request('/bookings/status', {
        method: 'PUT',
        body: JSON.stringify({ bookingId, status, price }),
      });
    },

    cancel: async (bookingId: string) => {
      return api.request('/bookings/cancel', {
        method: 'POST',
        body: JSON.stringify({ bookingId }),
      });
    },
  },

  // ========== PROVIDER APIs ==========
  provider: {
    updateAvailability: async (isOnline: boolean, serviceRadius?: number) => {
      return api.request('/provider/availability', {
        method: 'PUT',
        body: JSON.stringify({ isOnline, serviceRadius }),
      });
    },

    getStats: async () => {
      return api.request('/provider/stats', { method: 'GET' });
    },

    getEarnings: async () => {
      return api.request('/provider/earnings', { method: 'GET' });
    },

    updateServices: async (services: string[]) => {
      return api.request('/provider/services', {
        method: 'PUT',
        body: JSON.stringify({ services }),
      });
    },

    getOnlineProviders: async () => {
      return api.request('/providers/online', { method: 'GET' });
    },
  },

  // ========== STORAGE APIs ==========
  storage: {
    upload: async (file: File, folder: string = 'general') => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const headers: HeadersInit = {
        'Authorization': `Bearer ${authToken || publicAnonKey}`,
      };

      const response = await fetch(`${API_BASE_URL}/storage/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Storage upload error:', data);
        throw new Error(data.error || 'Upload failed');
      }

      return data;
    },

    getSignedUrl: async (path: string) => {
      return api.request('/storage/url', {
        method: 'POST',
        body: JSON.stringify({ path }),
      });
    },

    delete: async (path: string) => {
      return api.request('/storage/delete', {
        method: 'DELETE',
        body: JSON.stringify({ path }),
      });
    },

    list: async (folder?: string) => {
      const query = folder ? `?folder=${folder}` : '';
      return api.request(`/storage/list${query}`, { method: 'GET' });
    },
  },

  // ========== TRACKING API ==========
  tracking: {
    get: async (bookingId: string) => {
      return api.request(`/tracking/${bookingId}`, { method: 'GET' });
    },
  },

  // ========== ANALYTICS API ==========
  analytics: {
    getOverview: async () => {
      return api.request('/analytics/overview', { method: 'GET' });
    },
  },
};
