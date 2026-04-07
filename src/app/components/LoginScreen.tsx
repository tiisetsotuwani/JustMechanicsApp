import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Wrench, Mail, Lock } from 'lucide-react';
import { supabase } from '/utils/supabase/client';
import { api } from '../../utils/api';
import type { UserProfile } from '../../shared/types';

interface LoginScreenProps {
  onLogin: (
    type: 'customer' | 'provider',
    token: string,
    profile: Partial<UserProfile>,
    rememberMe?: boolean,
  ) => void;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

const normalizeAuthErrorMessage = (message: string): string =>
  message
    .replace(/^sign in failed:\s*/i, '')
    .replace(/^failed to create user:\s*/i, '')
    .trim();

const shouldUseDemoFallback = (error: unknown): boolean => {
  const message = getErrorMessage(error, '').toLowerCase();
  if (!message) {
    return false;
  }

  return (
    message.includes('backend is unavailable') ||
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('api request failed') ||
    message.includes('service unavailable')
  );
};

const isExistingAccountError = (error: unknown): boolean => {
  const message = getErrorMessage(error, '').toLowerCase();
  return message.includes('already been registered') || message.includes('already exists');
};

const isExpectedAuthError = (error: unknown): boolean => {
  const message = getErrorMessage(error, '').toLowerCase();
  return (
    message.includes('invalid login credentials') ||
    message.includes('missing email or password') ||
    message.includes('already been registered') ||
    message.includes('already exists') ||
    message.includes('sign in failed') ||
    message.includes('failed to create user')
  );
};

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [userType, setUserType] = useState<'customer' | 'provider'>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const buildDemoUserId = (userEmail: string) =>
    `demo-user-${userEmail.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  const persistDemoSession = (
    userEmail: string,
    profile: Partial<UserProfile> & { userType: 'customer' | 'provider' },
  ) => {
    const demoUserId = buildDemoUserId(userEmail);
    localStorage.setItem(
      'demo_session',
      JSON.stringify({
        user: {
          id: demoUserId,
          email: userEmail,
        },
        profile: {
          id: demoUserId,
          address: '',
          ...profile,
          email: userEmail,
        },
      }),
    );
  };

  const clearOAuthState = () => {
    localStorage.removeItem('oauth_userType');
    window.history.replaceState(null, '', window.location.pathname);
  };

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const preferredUserType =
        localStorage.getItem('oauth_userType') === 'provider' ? 'provider' : 'customer';
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessTokenFromHash = hashParams.get('access_token');
      const code = new URLSearchParams(window.location.search).get('code');

      if (!accessTokenFromHash && !code) {
        return;
      }

      try {
        setLoading(true);

        let accessToken = accessTokenFromHash;

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            throw error;
          }
          accessToken = data.session?.access_token || null;
        }

        if (!accessToken) {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            throw error;
          }
          accessToken = data.session?.access_token || null;
        }

        if (!accessToken) {
          throw new Error('OAuth session was not created');
        }

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser(accessToken);

        if (error || !user) {
          throw new Error('Failed to get user data from OAuth');
        }

        api.setAuthToken(accessToken);
        const sessionData = await api.auth.getSession();
        let profile = sessionData.profile as Partial<UserProfile> | undefined;

        if (!profile) {
          const ensured = await api.auth.ensureProfile({
            name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split('@')[0] ||
              'User',
            userType: preferredUserType,
            phone: user.user_metadata?.phone || '',
          });
          profile = ensured.profile;
        }

        clearOAuthState();

        onLogin(
          profile?.userType || preferredUserType,
          accessToken,
          profile || {
            name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split('@')[0] ||
              'User',
            email: user.email || '',
            phone: user.user_metadata?.phone || '',
            userType: preferredUserType,
          },
          rememberMe,
        );
      } catch (err: unknown) {
        console.error('OAuth callback error:', err);
        clearOAuthState();
        api.setAuthToken(null);
        setError(getErrorMessage(err, 'OAuth login failed'));
        setLoading(false);
      }
    };

    void handleOAuthCallback();
  }, [onLogin, rememberMe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignup) {
        try {
          await api.auth.signup(email, password, name, userType, phone);
          const signinData = await api.auth.signin(email, password);
          onLogin(userType, signinData.session.access_token, signinData.profile, rememberMe);
        } catch (backendError: unknown) {
          if (isExistingAccountError(backendError)) {
            try {
              const signinData = await api.auth.signin(email, password);
              onLogin(userType, signinData.session.access_token, signinData.profile, rememberMe);
              return;
            } catch {
              throw new Error(
                'Account already exists. Please sign in with your existing password or reset it.',
              );
            }
          }

          throw backendError;
        }
      } else {
        try {
          const data = (await api.auth.signin(email, password)) as {
            profile?: Partial<UserProfile> & { userType?: 'customer' | 'provider' };
            session: { access_token: string };
          };

          const profileUserType = data.profile?.userType || userType;
          onLogin(profileUserType, data.session.access_token, data.profile, rememberMe);
        } catch (backendError: unknown) {
          // Remove demo fallback for production
          throw backendError;
        }
      }
    } catch (err: unknown) {
      const userMessage = normalizeAuthErrorMessage(getErrorMessage(err, 'An error occurred'));
      if (!isExpectedAuthError(err)) {
        console.error('Auth error:', err);
      }
      setError(userMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'facebook') => {
    window.alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login coming soon.`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-700 via-red-600 to-red-700 flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-4">
            <Wrench className="w-16 h-16 text-red-700" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">JustMechanic</h1>
          <p className="text-white/90 text-lg">Your On-Demand Auto Care Solution</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-6 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setUserType('customer')}
              className={`py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                userType === 'customer'
                  ? 'bg-white text-red-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="w-5 h-5" />
              Customer
            </button>
            <button
              type="button"
              onClick={() => setUserType('provider')}
              className={`py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                userType === 'provider'
                  ? 'bg-white text-red-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Wrench className="w-5 h-5" />
              Provider
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  placeholder="********"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {isSignup && (
              <>
                <div>
                  <label htmlFor="signup-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    id="signup-name"
                    name="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    placeholder="Your Name"
                    className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="signup-phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    id="signup-phone"
                    name="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    placeholder="Your Phone Number"
                    className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
                    required
                  />
                </div>
              </>
            )}

            {!isSignup && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-600">
                  <input
                    id="remember-me"
                    name="rememberMe"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Remember me
                </label>
                {/* Forgot password link hidden for production - reset flow not implemented */}
                {/*
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-red-700 hover:text-red-800 font-medium"
                >
                  Forgot password?
                </button>
                */}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-700 text-white py-3 rounded-xl font-semibold hover:bg-red-800 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : `${isSignup ? 'Sign Up' : 'Sign In'} as ${userType === 'customer' ? 'Customer' : 'Provider'}`}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => setIsSignup(!isSignup)}
                className="text-red-700 font-semibold hover:text-red-800"
              >
                {isSignup ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>

          {/* Social login buttons hidden for production - OAuth not fully implemented */}
          {/*
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-4">Or continue with</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin('facebook')}
                className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-3">
              Social login buttons are placeholder actions for now.
            </p>
          </div>
          */}
        </div>

        <p className="text-white/80 text-sm text-center mt-6">
          By continuing, you agree to our{' '}
          <button className="underline hover:text-white" onClick={() => window.alert('Terms of Service page')}>
            Terms of Service
          </button>
          {' '}and{' '}
          <button className="underline hover:text-white" onClick={() => window.alert('Privacy Policy page')}>
            Privacy Policy
          </button>
        </p>
      </motion.div>
    </div>
  );
}
