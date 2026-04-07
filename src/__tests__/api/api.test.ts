import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn();

vi.stubGlobal('fetch', mockFetch);

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    localStorage.clear();
    vi.resetModules();
  });

  it('should set and get auth token', async () => {
    const { api } = await import('../../utils/api');

    api.setAuthToken('test-token');

    expect(api.getAuthToken()).toBe('test-token');
    expect(localStorage.getItem('access_token')).toBe('test-token');
  });

  it('should include auth token in requests', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'test' }),
    });

    const { api } = await import('../../utils/api');

    api.setAuthToken('my-token');
    await api.request('/test');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer my-token',
        }),
      }),
    );
  });

  it('should throw on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Not found' }),
    });

    const { api } = await import('../../utils/api');

    await expect(api.request('/missing')).rejects.toThrow('Not found');
  });

  it('clears auth token and emits unauthorized event on 401 responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    });

    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    const { api } = await import('../../utils/api');

    api.setAuthToken('expired-token');
    await expect(api.request('/bookings')).rejects.toThrow('Unauthorized');

    expect(api.getAuthToken()).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(dispatchSpy).toHaveBeenCalled();
    expect(dispatchSpy.mock.calls[0]?.[0].type).toBe('justmechanic:unauthorized');
  });

  it('does not emit unauthorized event for failed sign in requests', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid login credentials' }),
    });

    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    const { api } = await import('../../utils/api');

    await expect(
      api.auth.signin('missing-user@example.com', 'wrong-password'),
    ).rejects.toThrow('Invalid login credentials');

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('restores a demo session from local storage without calling the backend', async () => {
    localStorage.setItem(
      'demo_session',
      JSON.stringify({
        user: {
          id: 'demo-user-mechanic-example-com',
          email: 'mechanic@example.com',
        },
        profile: {
          id: 'demo-user-mechanic-example-com',
          email: 'mechanic@example.com',
          name: 'Mechanic Mike',
          phone: '0123456789',
          address: '',
          userType: 'provider',
        },
      }),
    );

    const { api } = await import('../../utils/api');

    api.setAuthToken('demo_provider_token');
    const session = await api.auth.getSession();

    expect(session).toEqual({
      user: {
        id: 'demo-user-mechanic-example-com',
        email: 'mechanic@example.com',
      },
      profile: expect.objectContaining({
        name: 'Mechanic Mike',
        userType: 'provider',
      }),
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('stores onboarding progress locally for demo sessions without calling the backend', async () => {
    const { api } = await import('../../utils/api');

    api.setAuthToken('demo_provider_token');

    const initialStatus = await api.onboarding.getStatus();
    await api.onboarding.saveStep('professional_info', { yearsExperience: 5, bio: 'Mobile mechanic' });
    const updatedStatus = await api.onboarding.getStatus();
    const submission = await api.onboarding.submit();

    expect(initialStatus).toEqual({
      onboarding: {
        status: 'not_started',
      },
    });
    expect(updatedStatus).toEqual({
      onboarding: expect.objectContaining({
        status: 'in_progress',
        currentStep: 'professional_info',
        steps: expect.objectContaining({
          professional_info: expect.objectContaining({
            yearsExperience: 5,
            bio: 'Mobile mechanic',
          }),
        }),
      }),
    });
    expect(submission).toEqual({
      onboarding: expect.objectContaining({
        status: 'pending_review',
      }),
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should expose auth, booking, admin, crm, marketing, dispatch, notifications, and maps helpers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const { api } = await import('../../utils/api');

    await api.auth.ensureProfile({ userType: 'provider' });
    await api.bookings.getOffers();
    await api.bookings.respondToOffer('offer:1', 'accept');
    await api.bookings.decline('booking:1');
    await api.admin.overview();
    await api.crm.getCustomers();
    await api.crm.getReminders();
    await api.marketing.getAccounts();
    await api.marketing.getPosts();
    await api.dispatch.tick();
    await api.chat.getMessages('booking:1');
    await api.payments.getMyPayments();
    await api.onboarding.getStatus();
    await api.invoices.getMyInvoices();
    await api.disputes.getMyDisputes();
    await api.notifications.getPreferences();
    await api.maps.geocode('Johannesburg');
    await api.maps.reverse(-26.2, 28.04);
    await api.maps.eta({ lat: -26.2, lng: 28.04 }, { lat: -26.18, lng: 28.02 });

    expect(mockFetch).toHaveBeenCalledTimes(19);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/auth/ensure-profile'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/bookings/offers'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('/bookings/offers/respond'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining('/bookings/decline'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining('/admin/overview'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      11,
      expect.stringContaining('/chat/booking:1'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      16,
      expect.stringContaining('/notifications/preferences'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      17,
      expect.stringContaining('/maps/geocode'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      19,
      expect.stringContaining('/maps/eta'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
