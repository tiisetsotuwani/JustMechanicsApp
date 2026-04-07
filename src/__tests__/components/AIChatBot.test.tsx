import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { AIChatBot } from '../../app/components/AIChatBot';

describe('AIChatBot', () => {
  it('sends a quick reply and shows the matching customer response', async () => {
    const user = userEvent.setup();

    render(<AIChatBot onBack={() => undefined} userType="customer" />);

    await user.click(screen.getByRole('button', { name: /how do i book a service\?/i }));

    expect(screen.getByText('How do I book a service?')).toBeInTheDocument();

    expect(await screen.findByText(/to book a service:/i)).toBeInTheDocument();
  }, 10000);

  it('uses the current typed message for provider replies', async () => {
    const user = userEvent.setup();

    render(<AIChatBot onBack={() => undefined} userType="provider" />);

    await user.type(screen.getByPlaceholderText(/ask me anything/i), 'What are the service fees?');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(screen.getByText('What are the service fees?')).toBeInTheDocument();

    expect(await screen.findByText(/our service fee structure:/i)).toBeInTheDocument();
    expect(screen.getByText(/platform fee: 15% of the service cost/i)).toBeInTheDocument();
  }, 10000);
});
