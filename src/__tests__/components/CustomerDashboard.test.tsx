import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CustomerDashboard } from '../../app/components/CustomerDashboard';

describe('CustomerDashboard', () => {
  it('navigates from notification and settings icons', async () => {
    const onNavigate = vi.fn();
    render(
      <CustomerDashboard
        userName="Alex"
        activeBooking={null}
        onNavigate={onNavigate}
      />,
    );

    await userEvent.click(screen.getByLabelText(/open notifications/i));
    await userEvent.click(screen.getByLabelText(/open settings/i));

    expect(onNavigate).toHaveBeenCalledWith('notifications');
    expect(onNavigate).toHaveBeenCalledWith('profile');
  });
});
