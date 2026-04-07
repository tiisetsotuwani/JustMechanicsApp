import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProviderDashboard } from '../../app/components/ProviderDashboard';

const mockApi = vi.hoisted(() => ({
  provider: {
    getStats: vi.fn(),
    updateAvailability: vi.fn(),
  },
  bookings: {
    getPending: vi.fn(),
    accept: vi.fn(),
    getOffers: vi.fn(),
    respondToOffer: vi.fn(),
  },
  profile: {
    get: vi.fn(),
  },
  dispatch: {
    tick: vi.fn(),
  },
}));

vi.mock('../../utils/api', () => ({
  api: mockApi,
}));

describe('ProviderDashboard', () => {
  beforeEach(() => {
    mockApi.provider.getStats.mockResolvedValue({
      stats: {
        totalJobs: 8,
        completedJobs: 4,
        rating: 4.8,
        totalEarnings: '1200.00',
        pendingJobs: 2,
      },
    });
    mockApi.bookings.getPending.mockResolvedValue({
      bookings: [
        {
          id: 'booking:1',
          service: 'Oil Change',
          vehicle: 'Toyota Camry',
          location: '123 Main St',
          status: 'pending',
        },
      ],
    });
    mockApi.bookings.accept.mockResolvedValue({});
    mockApi.bookings.getOffers.mockResolvedValue({ offers: [] });
    mockApi.bookings.respondToOffer.mockResolvedValue({});
    mockApi.provider.updateAvailability.mockResolvedValue({});
    mockApi.dispatch.tick.mockResolvedValue({});
    mockApi.profile.get.mockResolvedValue({
      profile: {
        isOnline: false,
      },
    });
  });

  it('loads provider stats and pending jobs from the api', async () => {
    render(<ProviderDashboard providerName="Jane Mechanic" onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Oil Change')).toBeInTheDocument();
    });

    expect(mockApi.provider.getStats).toHaveBeenCalled();
    expect(mockApi.bookings.getPending).toHaveBeenCalled();
  });

  it('accepts a booking from the pending list', async () => {
    render(<ProviderDashboard providerName="Jane Mechanic" onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Oil Change')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /^accept$/i }));
    expect(mockApi.bookings.accept).toHaveBeenCalledWith('booking:1');
  });

  it('navigates from notification and settings icons', async () => {
    const onNavigate = vi.fn();
    render(<ProviderDashboard providerName="Jane Mechanic" onNavigate={onNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Oil Change')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByLabelText(/open notifications/i));
    await userEvent.click(screen.getByLabelText(/open settings/i));

    expect(onNavigate).toHaveBeenCalledWith('notifications');
    expect(onNavigate).toHaveBeenCalledWith('profile');
  });
});
