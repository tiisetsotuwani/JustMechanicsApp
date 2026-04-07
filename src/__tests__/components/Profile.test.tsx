import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Profile } from '../../app/components/Profile';

const mockApi = vi.hoisted(() => ({
  bookings: {
    getMyBookings: vi.fn(),
  },
  profile: {
    getVehicles: vi.fn(),
  },
}));

vi.mock('../../utils/api', () => ({
  api: mockApi,
}));

describe('Profile', () => {
  beforeEach(() => {
    mockApi.bookings.getMyBookings.mockResolvedValue({ bookings: [] });
    mockApi.profile.getVehicles.mockResolvedValue({ vehicles: [] });
  });

  it('does not show rating card for customers', async () => {
    render(
      <Profile
        userProfile={{
          name: 'Customer One',
          email: 'customer@example.com',
          phone: '000',
          address: 'Address',
          userType: 'customer',
        }}
        onBack={vi.fn()}
        onNavigate={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockApi.bookings.getMyBookings).toHaveBeenCalled();
    });
    expect(screen.queryByText('Rating')).not.toBeInTheDocument();
  });

  it('shows rating card for providers', async () => {
    render(
      <Profile
        userProfile={{
          name: 'Provider One',
          email: 'provider@example.com',
          phone: '000',
          address: 'Address',
          userType: 'provider',
          rating: 4.7,
        }}
        onBack={vi.fn()}
        onNavigate={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockApi.bookings.getMyBookings).toHaveBeenCalled();
    });
    expect(screen.getByText('Rating')).toBeInTheDocument();
  });
});
