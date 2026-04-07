import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProviderOnboarding } from '../../app/components/onboarding/ProviderOnboarding';

const mockApi = vi.hoisted(() => ({
  onboarding: {
    getStatus: vi.fn(),
    saveStep: vi.fn(),
    submit: vi.fn(),
  },
}));

vi.mock('../../utils/api', () => ({
  api: mockApi,
}));

describe('ProviderOnboarding', () => {
  beforeEach(() => {
    mockApi.onboarding.getStatus.mockResolvedValue({
      onboarding: { status: 'not_started' },
    });
    mockApi.onboarding.saveStep.mockResolvedValue({});
    mockApi.onboarding.submit.mockResolvedValue({
      onboarding: { status: 'pending_review' },
    });
  });

  it('shows previous, save draft, and next actions and advances steps', async () => {
    render(<ProviderOnboarding onBack={vi.fn()} onComplete={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/step 1 of 6/i)).toBeInTheDocument();
    });

    const previousButton = screen.getByRole('button', { name: /previous/i });
    const saveDraftButton = screen.getByRole('button', { name: /save draft/i });
    const nextButton = screen.getByRole('button', { name: /^next$/i });

    expect(previousButton).toBeDisabled();
    expect(saveDraftButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
    const navActions = screen.getByTestId('onboarding-nav-actions');
    expect(navActions).toContainElement(previousButton);
    expect(navActions).toContainElement(nextButton);
    expect(navActions).not.toContainElement(saveDraftButton);

    await userEvent.click(nextButton);

    await waitFor(() => {
      expect(mockApi.onboarding.saveStep).toHaveBeenCalled();
      expect(screen.getByText(/step 2 of 6/i)).toBeInTheDocument();
    });
  });
});
