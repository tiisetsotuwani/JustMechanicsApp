import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockOnLogin = vi.fn();

const mockApi = vi.hoisted(() => ({
  auth: {
    getSession: vi.fn(),
    ensureProfile: vi.fn(),
    signin: vi.fn(),
    signup: vi.fn(),
  },
  setAuthToken: vi.fn(),
}));

const mockSupabaseAuth = vi.hoisted(() => ({
  getSession: vi.fn(),
  getUser: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  signInWithOAuth: vi.fn(),
}));

vi.mock('../../utils/api', () => ({
  api: mockApi,
}));

vi.mock('/utils/supabase/client', () => ({
  supabase: {
    auth: mockSupabaseAuth,
  },
}));

import { LoginScreen } from '../../app/components/LoginScreen';

describe('LoginScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    mockSupabaseAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    mockSupabaseAuth.exchangeCodeForSession.mockResolvedValue({ data: { session: null }, error: null });
    mockSupabaseAuth.signInWithOAuth.mockResolvedValue({ data: null, error: null });
    mockApi.auth.getSession.mockResolvedValue({ user: null, profile: null });
    mockApi.auth.ensureProfile.mockResolvedValue({ profile: null });
    mockApi.auth.signin.mockResolvedValue({ session: { access_token: 'token' }, profile: { userType: 'customer' } });
    mockApi.auth.signup.mockResolvedValue({ message: 'ok' });
  });

  it('renders login form', () => {
    render(<LoginScreen onLogin={mockOnLogin} />);

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('shows signup fields when toggled', async () => {
    render(<LoginScreen onLogin={mockOnLogin} />);

    await userEvent.click(screen.getByText(/sign up/i));

    expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your phone number/i)).toBeInTheDocument();
  });

  it('shows invalid credentials errors without falling back to demo mode', async () => {
    mockApi.auth.signin.mockRejectedValueOnce(new Error('Invalid login credentials'));

    render(<LoginScreen onLogin={mockOnLogin} />);

    await userEvent.type(screen.getByLabelText(/email address/i), 'missing-user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: /sign in as customer/i }));

    expect(await screen.findByText(/invalid login credentials/i)).toBeInTheDocument();
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('includes a name attribute on remember-me checkbox', () => {
    render(<LoginScreen onLogin={mockOnLogin} />);

    const rememberMe = screen.getByLabelText(/remember me/i);
    expect(rememberMe).toHaveAttribute('name', 'rememberMe');
  });

  it('signs in when signup reports an already-registered email and password matches', async () => {
    mockApi.auth.signup.mockRejectedValueOnce(
      new Error('Failed to create user: A user with this email address has already been registered'),
    );
    mockApi.auth.signin.mockResolvedValueOnce({
      session: { access_token: 'existing-user-token' },
      profile: { userType: 'customer', email: 'existing@example.com' },
    });

    render(<LoginScreen onLogin={mockOnLogin} />);

    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    await userEvent.type(screen.getByLabelText(/email address/i), 'existing@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'existing-pass');
    await userEvent.type(screen.getByLabelText(/^name$/i), 'Existing User');
    await userEvent.type(screen.getByLabelText(/phone number/i), '0123456789');
    await userEvent.click(screen.getByRole('button', { name: /sign up as customer/i }));

    await waitFor(() => {
      expect(mockApi.auth.signin).toHaveBeenCalledWith('existing@example.com', 'existing-pass');
    });
    expect(mockOnLogin).toHaveBeenCalledWith(
      'customer',
      'existing-user-token',
      expect.objectContaining({ email: 'existing@example.com' }),
      true,
    );
  });

  it('shows sign-in guidance for already-registered email when fallback sign-in fails', async () => {
    mockApi.auth.signup.mockRejectedValueOnce(
      new Error('Failed to create user: A user with this email address has already been registered'),
    );
    mockApi.auth.signin.mockRejectedValueOnce(new Error('Sign in failed: Invalid login credentials'));

    render(<LoginScreen onLogin={mockOnLogin} />);

    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    await userEvent.type(screen.getByLabelText(/email address/i), 'existing@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'new-pass');
    await userEvent.type(screen.getByLabelText(/^name$/i), 'Existing User');
    await userEvent.type(screen.getByLabelText(/phone number/i), '0123456789');
    await userEvent.click(screen.getByRole('button', { name: /sign up as customer/i }));

    expect(
      await screen.findByText(
        /already exists\. please sign in with your existing password or reset it\./i,
      ),
    ).toBeInTheDocument();
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('does not log expected auth failures to console error', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mockApi.auth.signin.mockRejectedValueOnce(new Error('Sign in failed: Invalid login credentials'));

    render(<LoginScreen onLogin={mockOnLogin} />);

    await userEvent.type(screen.getByLabelText(/email address/i), 'missing-user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: /sign in as customer/i }));

    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('creates a missing profile after OAuth callback and logs the user in', async () => {
    window.localStorage.setItem('oauth_userType', 'provider');
    window.history.replaceState({}, '', '/?code=oauth-code');

    mockSupabaseAuth.exchangeCodeForSession.mockResolvedValue({
      data: { session: { access_token: 'oauth-token' } },
      error: null,
    });
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: {
        user: {
          email: 'mechanic@example.com',
          user_metadata: {
            full_name: 'Mechanic Mike',
            phone: '0123456789',
          },
        },
      },
      error: null,
    });
    mockApi.auth.getSession.mockResolvedValue({
      user: { id: 'user-1' },
      profile: null,
    });
    mockApi.auth.ensureProfile.mockResolvedValue({
      profile: {
        name: 'Mechanic Mike',
        email: 'mechanic@example.com',
        phone: '0123456789',
        userType: 'provider',
      },
    });

    render(<LoginScreen onLogin={mockOnLogin} />);

    await waitFor(() => {
      expect(mockApi.auth.ensureProfile).toHaveBeenCalledWith({
        name: 'Mechanic Mike',
        userType: 'provider',
        phone: '0123456789',
      });
    });

    expect(mockApi.setAuthToken).toHaveBeenCalledWith('oauth-token');
    expect(mockOnLogin).toHaveBeenCalledWith(
      'provider',
      'oauth-token',
      expect.objectContaining({
        email: 'mechanic@example.com',
        userType: 'provider',
      }),
      true,
    );
    expect(window.localStorage.getItem('oauth_userType')).toBeNull();
  });

  it('does not show social login and forgot password links for production', async () => {
    render(<LoginScreen onLogin={mockOnLogin} />);

    expect(screen.queryByText(/forgot password/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Google')).not.toBeInTheDocument();
    expect(screen.queryByText('Facebook')).not.toBeInTheDocument();
  });
});
