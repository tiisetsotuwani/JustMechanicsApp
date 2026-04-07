import { projectId, publicAnonKey } from '/utils/supabase/info';
import type {
  BookingCreateRequest,
  BookingStatus,
  BookingUpdateStatusRequest,
  InvoiceLineItem,
  OnboardingApplication,
  PaymentMethod,
  UserProfile,
} from '../shared/types';

// Support both local and cloud deployment
const isLocalDevelopment = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE_URL = isLocalDevelopment 
  ? 'http://localhost:54321/functions/v1/make-server-dd7ceef7'
  : `https://${projectId}.supabase.co/functions/v1/make-server-dd7ceef7`;
const AUTH_TOKEN_STORAGE_KEY = 'access_token';
const DEMO_TOKEN_PREFIX = 'demo_';
const DEMO_SESSION_STORAGE_KEY = 'demo_session';
const DEMO_ONBOARDING_STORAGE_KEY = 'demo_onboarding';

interface DemoSessionData {
  user: {
    id: string;
    email: string;
  };
  profile: Partial<UserProfile>;
}

const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
};

let authToken: string | null = getStoredToken();

const isDemoToken = (token: string | null): boolean => Boolean(token?.startsWith(DEMO_TOKEN_PREFIX));

const readStorageJson = <T>(key: string): T | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = window.localStorage.getItem(key);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return null;
  }
};

const writeStorageJson = <T>(key: string, value: T) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

const getDemoSession = (): DemoSessionData | null => readStorageJson<DemoSessionData>(DEMO_SESSION_STORAGE_KEY);

const getDemoOnboarding = (): OnboardingApplication | null =>
  readStorageJson<OnboardingApplication>(DEMO_ONBOARDING_STORAGE_KEY);

const setDemoOnboarding = (onboarding: OnboardingApplication) => {
  writeStorageJson(DEMO_ONBOARDING_STORAGE_KEY, onboarding);
};

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const headers: HeadersInit = {
    Authorization: `Bearer ${authToken || publicAnonKey}`,
    ...options.headers,
  };

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const shouldHandleUnauthorized =
      response.status === 401 &&
      !endpoint.startsWith('/auth/signin') &&
      !endpoint.startsWith('/auth/signup') &&
      !endpoint.startsWith('/auth/session');

    if (shouldHandleUnauthorized) {
      api.setAuthToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('justmechanic:unauthorized'));
      }
    }

    const errorMessage =
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof (data as { error?: unknown }).error === 'string'
        ? (data as { error: string }).error
        : null;

    throw new Error(errorMessage || (response.status === 401 ? 'Session expired. Please sign in again.' : 'API request failed'));
  }

  return data;
};

export const api = {
  setAuthToken: (token: string | null) => {
    authToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
      } else {
        window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      }
    }
  },

  getAuthToken: () => authToken,

  request: apiRequest,

  auth: {
    signup: async (
      email: string,
      password: string,
      name: string,
      userType: 'customer' | 'provider',
      phone?: string,
    ) =>
      apiRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, userType, phone }),
      }),

    signin: async (email: string, password: string) => {
      const data = await apiRequest('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (data.session?.access_token) {
        api.setAuthToken(data.session.access_token);
      }
      return data;
    },

    getSession: async () => {
      if (isDemoToken(authToken)) {
        const demoSession = getDemoSession();
        if (demoSession) {
          return demoSession;
        }
      }

      return apiRequest('/auth/session', { method: 'GET' });
    },

    ensureProfile: async (payload: {
      name?: string;
      userType?: 'customer' | 'provider';
      phone?: string;
    }) =>
      apiRequest('/auth/ensure-profile', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    signout: async () => {
      if (isDemoToken(authToken)) {
        api.setAuthToken(null);
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(DEMO_SESSION_STORAGE_KEY);
          window.localStorage.removeItem(DEMO_ONBOARDING_STORAGE_KEY);
        }
        return { message: 'Signed out' };
      }

      const data = await apiRequest('/auth/signout', { method: 'POST' });
      api.setAuthToken(null);
      return data;
    },
  },

  profile: {
    get: async () => apiRequest('/profile', { method: 'GET' }),
    update: async (updates: { name?: string; phone?: string; profileImage?: string }) =>
      apiRequest('/profile', { method: 'PUT', body: JSON.stringify(updates) }),
    getAddresses: async () => apiRequest('/profile/addresses', { method: 'GET' }),
    addAddress: async (address: Record<string, unknown>) =>
      apiRequest('/profile/addresses', { method: 'POST', body: JSON.stringify(address) }),
    updateAddress: async (address: Record<string, unknown>) =>
      apiRequest('/profile/addresses', { method: 'PUT', body: JSON.stringify(address) }),
    deleteAddress: async (id: string) =>
      apiRequest('/profile/addresses', { method: 'DELETE', body: JSON.stringify({ id }) }),
    getVehicles: async () => apiRequest('/profile/vehicles', { method: 'GET' }),
    addVehicle: async (vehicle: Record<string, unknown>) =>
      apiRequest('/profile/vehicles', { method: 'POST', body: JSON.stringify(vehicle) }),
    updateVehicle: async (vehicle: Record<string, unknown>) =>
      apiRequest('/profile/vehicles', { method: 'PUT', body: JSON.stringify(vehicle) }),
    deleteVehicle: async (id: string) =>
      apiRequest('/profile/vehicles', { method: 'DELETE', body: JSON.stringify({ id }) }),
  },

  bookings: {
    create: async (booking: BookingCreateRequest) =>
      apiRequest('/bookings', { method: 'POST', body: JSON.stringify(booking) }),
    getMyBookings: async () => apiRequest('/bookings', { method: 'GET' }),
    getPending: async () => apiRequest('/bookings/pending', { method: 'GET' }),
    getById: async (id: string) => apiRequest(`/bookings/${id}`, { method: 'GET' }),
    accept: async (bookingId: string) =>
      apiRequest('/bookings/accept', { method: 'POST', body: JSON.stringify({ bookingId }) }),
    decline: async (bookingId: string) =>
      apiRequest('/bookings/decline', { method: 'POST', body: JSON.stringify({ bookingId }) }),
    updateStatus: async (bookingId: string, status: BookingStatus, price?: number) => {
      const payload: BookingUpdateStatusRequest = { bookingId, status, price };
      return apiRequest('/bookings/status', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    cancel: async (bookingId: string, reason?: string) =>
      apiRequest('/bookings/cancel', {
        method: 'POST',
        body: JSON.stringify({ bookingId, reason }),
      }),
    rate: async (bookingId: string, rating: number, review?: string) =>
      apiRequest('/bookings/rate', {
        method: 'POST',
        body: JSON.stringify({ bookingId, rating, review }),
      }),
    addJobPhoto: async (bookingId: string, photoUrl: string, type: string, caption?: string) =>
      apiRequest(`/bookings/${bookingId}/photos`, {
        method: 'POST',
        body: JSON.stringify({ photoUrl, type, caption }),
      }),
    getJobPhotos: async (bookingId: string) =>
      apiRequest(`/bookings/${bookingId}/photos`, { method: 'GET' }),
    getOffers: async () => apiRequest('/bookings/offers', { method: 'GET' }),
    respondToOffer: async (offerId: string, decision: 'accept' | 'decline') =>
      apiRequest('/bookings/offers/respond', {
        method: 'POST',
        body: JSON.stringify({ offerId, decision }),
      }),
  },

  provider: {
    updateAvailability: async (
      isOnline: boolean,
      serviceRadius?: number,
      location?: { lat: number; lng: number },
      activeCapacity?: number,
    ) =>
      apiRequest('/provider/availability', {
        method: 'PUT',
        body: JSON.stringify({
          isOnline,
          serviceRadius,
          lat: location?.lat,
          lng: location?.lng,
          activeCapacity,
        }),
      }),
    getStats: async () => apiRequest('/provider/stats', { method: 'GET' }),
    getEarnings: async () => apiRequest('/provider/earnings', { method: 'GET' }),
    updateServices: async (services: string[]) =>
      apiRequest('/provider/services', {
        method: 'PUT',
        body: JSON.stringify({ services }),
      }),
    getOnlineProviders: async () => apiRequest('/providers/online', { method: 'GET' }),
  },

  chat: {
    send: async (bookingId: string, message: string) =>
      apiRequest('/chat/send', {
        method: 'POST',
        body: JSON.stringify({ bookingId, message }),
      }),
    getMessages: async (bookingId: string) => apiRequest(`/chat/${bookingId}`, { method: 'GET' }),
    markRead: async (bookingId: string) =>
      apiRequest('/chat/read', {
        method: 'POST',
        body: JSON.stringify({ bookingId }),
      }),
  },

  payments: {
    record: async (bookingId: string, method: PaymentMethod, amount: number) =>
      apiRequest('/payments', {
        method: 'POST',
        body: JSON.stringify({ bookingId, method, amount }),
      }),
    getForBooking: async (bookingId: string) =>
      apiRequest(`/payments/booking/${bookingId}`, { method: 'GET' }),
    getMyPayments: async () => apiRequest('/payments', { method: 'GET' }),
    confirm: async (bookingId: string) =>
      apiRequest('/payments/confirm', {
        method: 'POST',
        body: JSON.stringify({ bookingId }),
      }),
  },

  admin: {
    overview: async () => apiRequest('/admin/overview', { method: 'GET' }),
    listUsers: async (type?: string) =>
      apiRequest(`/admin/users${type ? `?type=${type}` : ''}`, { method: 'GET' }),
    getUser: async (id: string) => apiRequest(`/admin/users/${id}`, { method: 'GET' }),
    getUserAudit: async (id: string) => apiRequest(`/admin/users/${id}/audit`, { method: 'GET' }),
    suspendUser: async (userId: string, suspended: boolean, reason?: string) =>
      apiRequest('/admin/users/suspend', {
        method: 'POST',
        body: JSON.stringify({ userId, suspended, reason }),
      }),
    listBookings: async (status?: string) =>
      apiRequest(`/admin/bookings${status ? `?status=${status}` : ''}`, { method: 'GET' }),
    debugLookup: async (params: { bookingId?: string; userId?: string }) => {
      const query = new URLSearchParams();
      if (params.bookingId) {
        query.set('bookingId', params.bookingId);
      }
      if (params.userId) {
        query.set('userId', params.userId);
      }
      return apiRequest(`/admin/debug${query.toString() ? `?${query.toString()}` : ''}`, { method: 'GET' });
    },
    getPlatformConfig: async () => apiRequest('/admin/config/platform', { method: 'GET' }),
    updatePlatformConfig: async (config: Record<string, unknown>) =>
      apiRequest('/admin/config/platform', {
        method: 'PUT',
        body: JSON.stringify(config),
      }),
  },

  onboarding: {
    getStatus: async () => {
      if (isDemoToken(authToken)) {
        return {
          onboarding: getDemoOnboarding() || { status: 'not_started' },
        };
      }

      return apiRequest('/onboarding/status', { method: 'GET' });
    },
    getQueue: async () => apiRequest('/onboarding/queue', { method: 'GET' }),
    saveStep: async (step: string, data: Record<string, unknown>) => {
      if (isDemoToken(authToken)) {
        const currentOnboarding = getDemoOnboarding();
        const nextOnboarding: OnboardingApplication = {
          status: currentOnboarding?.status === 'pending_review' ? 'pending_review' : 'in_progress',
          currentStep: step,
          steps: {
            ...(currentOnboarding?.steps || {}),
            [step]: {
              ...(currentOnboarding?.steps?.[step] || {}),
              ...data,
            },
          },
          createdAt: currentOnboarding?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setDemoOnboarding(nextOnboarding);
        return { onboarding: nextOnboarding };
      }

      return apiRequest('/onboarding/step', {
        method: 'POST',
        body: JSON.stringify({ step, data }),
      });
    },
    submit: async () => {
      if (isDemoToken(authToken)) {
        const currentOnboarding = getDemoOnboarding();
        const nextOnboarding: OnboardingApplication = {
          status: 'pending_review',
          currentStep: currentOnboarding?.currentStep || 'review_submit',
          steps: currentOnboarding?.steps || {},
          createdAt: currentOnboarding?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          submittedAt: new Date().toISOString(),
        };
        setDemoOnboarding(nextOnboarding);
        return { onboarding: nextOnboarding };
      }

      return apiRequest('/onboarding/submit', { method: 'POST' });
    },
    review: async (providerId: string, decision: 'approved' | 'rejected', reason?: string) =>
      apiRequest('/admin/onboarding/review', {
        method: 'POST',
        body: JSON.stringify({ providerId, decision, reason }),
      }),
  },

  invoices: {
    generate: async (bookingId: string, lineItems: InvoiceLineItem[]) =>
      apiRequest('/invoices/generate', {
        method: 'POST',
        body: JSON.stringify({ bookingId, lineItems }),
      }),
    getForBooking: async (bookingId: string) =>
      apiRequest(`/invoices/booking/${bookingId}`, { method: 'GET' }),
    getMyInvoices: async () => apiRequest('/invoices', { method: 'GET' }),
  },

  disputes: {
    create: async (
      bookingId: string,
      type: string,
      description: string,
      photos: string[] = [],
    ) =>
      apiRequest('/disputes', {
        method: 'POST',
        body: JSON.stringify({ bookingId, type, description, photos }),
      }),
    getMyDisputes: async () => apiRequest('/disputes', { method: 'GET' }),
    getById: async (id: string) => apiRequest(`/disputes/${id}`, { method: 'GET' }),
    respond: async (id: string, response: string) =>
      apiRequest(`/disputes/${id}/respond`, {
        method: 'POST',
        body: JSON.stringify({ response }),
      }),
    resolve: async (disputeId: string, resolution: string, action: string) =>
      apiRequest(`/disputes/${disputeId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ disputeId, resolution, action }),
      }),
  },

  storage: {
    upload: async (file: File, folder = 'general') => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      return apiRequest('/storage/upload', {
        method: 'POST',
        body: formData,
      });
    },
    getSignedUrl: async (path: string) =>
      apiRequest('/storage/url', { method: 'POST', body: JSON.stringify({ path }) }),
    delete: async (path: string) =>
      apiRequest('/storage/delete', {
        method: 'DELETE',
        body: JSON.stringify({ path }),
      }),
    list: async (folder?: string) =>
      apiRequest(`/storage/list${folder ? `?folder=${folder}` : ''}`, { method: 'GET' }),
  },

  tracking: {
    get: async (bookingId: string) => apiRequest(`/tracking/${bookingId}`, { method: 'GET' }),
    update: async (payload: Record<string, unknown>) =>
      apiRequest('/tracking/update', { method: 'POST', body: JSON.stringify(payload) }),
  },

  maps: {
    geocode: async (query: string) =>
      apiRequest(`/maps/geocode?q=${encodeURIComponent(query)}`, { method: 'GET' }),
    reverse: async (lat: number, lng: number) =>
      apiRequest(`/maps/reverse?lat=${lat}&lng=${lng}`, { method: 'GET' }),
    eta: async (from: { lat: number; lng: number }, to: { lat: number; lng: number }) =>
      apiRequest('/maps/eta', { method: 'POST', body: JSON.stringify({ from, to }) }),
  },

  notifications: {
    subscribe: async (subscription: unknown) =>
      apiRequest('/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify({ subscription }),
      }),
    unsubscribe: async () => apiRequest('/notifications/unsubscribe', { method: 'POST' }),
    getPreferences: async () => apiRequest('/notifications/preferences', { method: 'GET' }),
    updatePreferences: async (preferences: Record<string, unknown>) =>
      apiRequest('/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      }),
  },

  dispatch: {
    tick: async () => apiRequest('/dispatch/tick', { method: 'POST' }),
    getStatus: async (bookingId: string) => apiRequest(`/dispatch/status/${bookingId}`, { method: 'GET' }),
  },

  crm: {
    getCustomers: async () => apiRequest('/crm/customers', { method: 'GET' }),
    getCustomerNotes: async (customerId: string) =>
      apiRequest(`/crm/customers/${customerId}/notes`, { method: 'GET' }),
    addCustomerNote: async (customerId: string, text: string, tag?: string) =>
      apiRequest(`/crm/customers/${customerId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ text, tag }),
      }),
    getReminders: async () => apiRequest('/crm/reminders', { method: 'GET' }),
    createReminder: async (payload: {
      customerId: string;
      title: string;
      dueAt: string;
      channel?: string;
    }) =>
      apiRequest('/crm/reminders', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  marketing: {
    getAccounts: async () => apiRequest('/marketing/accounts', { method: 'GET' }),
    connectAccount: async (platform: string, accountName: string, externalId?: string) =>
      apiRequest('/marketing/accounts/connect', {
        method: 'POST',
        body: JSON.stringify({ platform, accountName, externalId }),
      }),
    getPosts: async () => apiRequest('/marketing/posts', { method: 'GET' }),
    createPost: async (payload: {
      text: string;
      platforms?: string[];
      scheduledAt?: string | null;
      mediaUrls?: string[];
    }) =>
      apiRequest('/marketing/posts', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    publishPost: async (postId: string) =>
      apiRequest('/marketing/posts/publish', {
        method: 'POST',
        body: JSON.stringify({ postId }),
      }),
    getAnalytics: async () => apiRequest('/marketing/analytics', { method: 'GET' }),
  },

  analytics: {
    getOverview: async () => apiRequest('/analytics/overview', { method: 'GET' }),
  },
};
