import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '../../app/components/ErrorBoundary';

function ProblemChild() {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  it('renders fallback UI and reload action', async () => {
    const reload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload },
      writable: true,
    });

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /reload/i }));
    expect(reload).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
