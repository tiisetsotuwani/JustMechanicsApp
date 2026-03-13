import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Wrench, Mail, Lock } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { supabase } from '/utils/supabase/client';

interface LoginScreenProps {
  onLogin: (type: 'customer' | 'provider', token: string, profile: any) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [userType, setUserType] = useState<'customer' | 'provider'>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check for OAuth callback on mount
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Check if returning from OAuth provider
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      
      if (accessToken) {
        try {
          setLoading(true);
          
          // Get user data from Supabase
          const { data: { user }, error } = await supabase.auth.getUser(accessToken);
          
          if (error || !user) {
            throw new Error('Failed to get user data from OAuth');
          }
          
          console.log('OAuth successful, user:', user);
          
          // Create or get user profile from backend
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-dd7ceef7/auth/session`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              }
            }
          );
          
          let profile;
          if (response.ok) {
            const data = await response.json();
            profile = data.profile;
          } else {
            // Create profile if doesn't exist
            const createResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-dd7ceef7/auth/signup`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: user.email,
                  password: Math.random().toString(36), // Random password for OAuth users
                  name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
                  phone: user.user_metadata?.phone || '',
                  userType: userType,
                }),
              }
            );
            
            if (createResponse.ok) {
              const createData = await createResponse.json();
              profile = {
                name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
                email: user.email,
                phone: user.user_metadata?.phone || '',
                userType: userType,
              };
            }
          }
          
          // Clear hash from URL
          window.history.replaceState(null, '', window.location.pathname);
          
          // Login user
          onLogin(
            profile?.userType || userType,
            accessToken,
            profile || {
              name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
              email: user.email,
              phone: user.user_metadata?.phone || '',
              userType: userType,
            }
          );
        } catch (err: any) {
          console.error('OAuth callback error:', err);
          setError(err.message || 'OAuth login failed');
          setLoading(false);
        }
      }
    };
    
    handleOAuthCallback();
  }, [userType, onLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignup) {
        // Try backend first, fallback to demo mode if unavailable
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-dd7ceef7/auth/signup`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email,
                password,
                name,
                phone,
                userType,
              }),
            }
          );

          const data = await response.json();

          if (!response.ok) {
            console.error('Signup error response:', data);
            throw new Error(data.error || `Signup failed: ${response.status}`);
          }

          console.log('Signup successful, attempting auto-login...');

          // After signup, automatically sign in
          const signinResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-dd7ceef7/auth/signin`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, password }),
            }
          );

          const signinData = await signinResponse.json();

          if (!signinResponse.ok) {
            console.error('Auto-login error response:', signinData);
            throw new Error(signinData.error || 'Auto-login failed. Please sign in manually.');
          }

          console.log('Auto-login successful');
          onLogin(userType, signinData.session.access_token, signinData.profile);
        } catch (backendError: any) {
          console.warn('Backend unavailable, using demo mode:', backendError.message);
          
          // Demo mode - save to localStorage
          const demoUser = {
            email,
            name,
            phone,
            userType,
          };
          const demoToken = `demo_${Date.now()}_${Math.random().toString(36)}`;
          
          localStorage.setItem(`demo_user_${email}`, JSON.stringify({ ...demoUser, password }));
          
          onLogin(userType, demoToken, demoUser);
        }
      } else {
        // Try backend first, fallback to demo mode if unavailable
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-dd7ceef7/auth/signin`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, password }),
            }
          );

          const data = await response.json();

          if (!response.ok) {
            console.error('Signin error response:', data);
            throw new Error(data.error || `Sign in failed: ${response.status}`);
          }

          console.log('Sign in successful');
          const profileUserType = data.profile?.userType || userType;
          onLogin(profileUserType, data.session.access_token, data.profile);
        } catch (backendError: any) {
          console.warn('Backend unavailable, checking demo mode:', backendError.message);
          
          // Check demo mode - try to load from localStorage
          const savedUser = localStorage.getItem(`demo_user_${email}`);
          
          if (savedUser) {
            const user = JSON.parse(savedUser);
            
            if (user.password === password) {
              const demoToken = `demo_${Date.now()}_${Math.random().toString(36)}`;
              onLogin(user.userType, demoToken, user);
            } else {
              throw new Error('Invalid email or password');
            }
          } else {
            throw new Error('Backend is unavailable and no demo account found. Please try again later or create a new account.');
          }
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setLoading(true);
    setError('');
    
    try {
      // Save user type preference before OAuth redirect
      localStorage.setItem('oauth_userType', userType);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });
      
      if (error) {
        throw error;
      }
      
      // OAuth will redirect, so we don't need to set loading to false
    } catch (err: any) {
      console.error(`${provider} OAuth error:`, err);
      setError(
        `${provider.charAt(0).toUpperCase() + provider.slice(1)} login failed. ` +
        `Please ensure ${provider} OAuth is configured in your Supabase project settings. ` +
        `Visit: https://supabase.com/dashboard → Authentication → Providers → ${provider}`
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-700 via-red-600 to-red-700 flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-4">
            <Wrench className="w-16 h-16 text-red-700" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">JustMechanic</h1>
          <p className="text-white/90 text-lg">Your On-Demand Auto Care Solution</p>
        </div>

        {/* Login/Signup Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* User Type Selection */}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {isSignup && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                  <input type="checkbox" className="rounded border-gray-300" />
                  Remember me
                </label>
                <button type="button" className="text-red-700 hover:text-red-800 font-medium">
                  Forgot password?
                </button>
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

          {/* Toggle Login/Signup */}
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

          {/* Social Login */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-4">Or continue with</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin('facebook')}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-3">
              Note: Social login requires OAuth configuration in Supabase Dashboard
            </p>
          </div>
        </div>

        {/* Info Text */}
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