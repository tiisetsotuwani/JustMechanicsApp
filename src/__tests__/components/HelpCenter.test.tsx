import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { HelpCenter } from '../../app/components/HelpCenter';

describe('HelpCenter', () => {
  it('starts live chat and opens privacy policy from quick links', async () => {
    const onNavigate = vi.fn();
    render(<HelpCenter onBack={vi.fn()} onNavigate={onNavigate} />);

    await userEvent.click(screen.getByRole('button', { name: /start chat/i }));
    await userEvent.click(screen.getByRole('button', { name: /privacy policy/i }));

    expect(onNavigate).toHaveBeenCalledWith('ai-chat');
    expect(onNavigate).toHaveBeenCalledWith('privacy');
  });

  it('filters faq items using search input', async () => {
    render(<HelpCenter onBack={vi.fn()} onNavigate={vi.fn()} />);

    await userEvent.type(screen.getByPlaceholderText(/search for help/i), 'cancel');

    expect(screen.getByText(/what if i need to cancel/i)).toBeInTheDocument();
    expect(screen.queryByText(/how do i create an account/i)).not.toBeInTheDocument();
  });
});

