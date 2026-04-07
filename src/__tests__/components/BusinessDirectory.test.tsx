import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BusinessDirectory } from '../../app/components/BusinessDirectory';

describe('BusinessDirectory', () => {
  it('opens and closes details for a business', async () => {
    render(<BusinessDirectory onBack={vi.fn()} />);

    await userEvent.click(screen.getAllByRole('button', { name: /view details/i })[0]);

    expect(screen.getByRole('link', { name: /call now/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(screen.queryByRole('link', { name: /call now/i })).not.toBeInTheDocument();
  });
});
