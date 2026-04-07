import { useEffect, useState } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { LoginScreen } from './components/LoginScreen';
import { CustomerDashboard } from './components/CustomerDashboard';
import { ProviderDashboard } from './components/ProviderDashboard';
import { RequestMechanic } from './components/RequestMechanic';
import { TrackMechanic } from './components/TrackMechanic';
import { Services } from './components/Services';
import { Payments } from './components/Payments';
import { Bookings } from './components/Bookings';
import { Profile } from './components/Profile';
import { BusinessDirectory } from './components/BusinessDirectory';
import { EditPersonalInfo } from './components/EditPersonalInfo';
import { ManageAddresses } from './components/ManageAddresses';
import { ManageVehicles } from './components/ManageVehicles';
import { AIChatBot } from './components/AIChatBot';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { HelpCenter } from './components/HelpCenter';
import { NotificationSettings } from './components/NotificationSettings';
import { PaymentMethods } from './components/PaymentMethods';
import { AdminDashboard } from './components/AdminDashboard';
import { Chat } from './components/Chat';
import { RatingModal } from './components/RatingModal';
import { ProviderOnboarding } from './components/onboarding/ProviderOnboarding';
import { JobDocumentation } from './components/JobDocumentation';
import { Invoice } from './components/Invoice';
import { ServiceHistory } from './components/ServiceHistory';
import { Disputes } from './components/Disputes';
import { ProviderCRM } from './components/ProviderCRM';
import { ProviderMarketing } from './components/ProviderMarketing';
import { api } from '../utils/api';
import type {
  Address,
  Booking,
  BookingCreateRequest,
  Invoice as InvoiceType,
  Screen,
  UserProfile,
  UserType,
  Vehicle,
} from '../shared/types';

const EMPTY_PROFILE: UserProfile = {
  name: '',
  email: '',
  phone: '',
  address: '',
};

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [userType, setUserType] = useState<UserType>(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [pendingBooking, setPendingBooking] = useState<Booking | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceType | null>(null);
  const [showRatingForBooking, setShowRatingForBooking] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    const handleUnauthorized = () => {
      api.setAuthToken(null);
      setUserType(null);
      setCurrentUserId('');
      setCurrentScreen('login');
      setBookings([]);
      setActiveBooking(null);
      setPendingBooking(null);
      setUserProfile(EMPTY_PROFILE);
      setAddresses([]);
      setVehicles([]);
      setSelectedInvoice(null);
      setShowRatingForBooking(null);
    };

    window.addEventListener('justmechanic:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('justmechanic:unauthorized', handleUnauthorized);
    };
  }, []);

  const refreshBookings = async () => {
    try {
      const response = await api.bookings.getMyBookings();
      const nextBookings = response.bookings || [];
      setBookings(nextBookings);
      const active = nextBookings.find((booking: Booking) =>
        ['assigned', 'en_route', 'arrived', 'in_progress'].includes(booking.status),
      ) || null;
      const pending = nextBookings.find((booking: Booking) => booking.status === 'pending') || null;
      setActiveBooking(active);
      setPendingBooking(pending);
      const unratedCompleted = nextBookings.find((booking: Booking) => booking.status === 'completed' && !booking.rated);
      setShowRatingForBooking(unratedCompleted?.id || null);
    } catch {
      setBookings([]);
      setActiveBooking(null);
      setPendingBooking(null);
    }
  };

  const loadProfileCollections = async () => {
    try {
      const [addressResponse, vehicleResponse] = await Promise.all([
        api.profile.getAddresses(),
        api.profile.getVehicles(),
      ]);
      setAddresses(addressResponse.addresses || []);
      setVehicles(vehicleResponse.vehicles || []);
    } catch {
      setAddresses([]);
      setVehicles([]);
    }
  };

  const routeForProfile = async (profile: Partial<UserProfile> | null, fallbackType: UserType) => {
    const resolvedUserType = profile?.userType || fallbackType;
    if (resolvedUserType === 'admin') {
      setCurrentScreen('admin-dashboard');
      return;
    }
    if (resolvedUserType === 'provider') {
      try {
        const onboardingResponse = await api.onboarding.getStatus();
        if (onboardingResponse.onboarding?.status !== 'approved') {
          setCurrentScreen('provider-onboarding');
          return;
        }
      } catch {
        setCurrentScreen('provider-onboarding');
        return;
      }
      setCurrentScreen('provider-dashboard');
      return;
    }

    setCurrentScreen('customer-dashboard');
  };

  useEffect(() => {
    let timer: number | undefined;

    const restoreSession = async () => {
      const token = api.getAuthToken();
      if (!token) {
        timer = window.setTimeout(() => setCurrentScreen('login'), 1500);
        return;
      }

      try {
        const { user, profile } = await api.auth.getSession();
        setCurrentUserId(user?.id || '');
        setUserType((profile?.userType as UserType) || null);
        setUserProfile({
          ...EMPTY_PROFILE,
          ...profile,
        });
        await Promise.all([refreshBookings(), loadProfileCollections()]);
        await routeForProfile(profile, profile?.userType as UserType);
      } catch {
        api.setAuthToken(null);
        setCurrentScreen('login');
      }
    };

    void restoreSession();
    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  useEffect(() => {
    const loadInvoice = async () => {
      if (currentScreen !== 'invoice' || !activeBooking) {
        return;
      }

      try {
        const response = await api.invoices.getForBooking(activeBooking.id);
        setSelectedInvoice(response.invoice || null);
      } catch {
        setSelectedInvoice(null);
      }
    };

    void loadInvoice();
  }, [activeBooking, currentScreen]);

  const handleLogin = async (
    type: 'customer' | 'provider',
    token: string,
    profile: Partial<UserProfile> | null,
    rememberMe = true,
  ) => {
    api.setAuthToken(token);
    setUserType(type);
    setUserProfile({
      ...EMPTY_PROFILE,
      ...profile,
    });

    try {
      const session = await api.auth.getSession();
      setCurrentUserId(session.user?.id || '');
      setUserProfile({
        ...EMPTY_PROFILE,
        ...session.profile,
      });
      setUserType((session.profile?.userType as UserType) || type);
      await Promise.all([refreshBookings(), loadProfileCollections()]);
      if (!rememberMe) {
        window.localStorage.removeItem('access_token');
      }
      await routeForProfile(session.profile, (session.profile?.userType as UserType) || type);
    } catch {
      const isDemoLogin = token.startsWith('demo_');
      if (!isDemoLogin) {
        api.setAuthToken(null);
        if (!rememberMe) {
          window.localStorage.removeItem('access_token');
        }
        setUserType(null);
        setCurrentUserId('');
        setCurrentScreen('login');
        setBookings([]);
        setActiveBooking(null);
        setPendingBooking(null);
        setUserProfile(EMPTY_PROFILE);
        setAddresses([]);
        setVehicles([]);
        setSelectedInvoice(null);
        setShowRatingForBooking(null);
        return;
      }

      if (!rememberMe) {
        window.localStorage.removeItem('access_token');
      }
      await routeForProfile(profile, type);
    }
  };

  const handleLogout = async () => {
    try {
      await api.auth.signout();
    } catch {
      api.setAuthToken(null);
    }

    setUserType(null);
    setCurrentUserId('');
    setCurrentScreen('login');
    setBookings([]);
    setActiveBooking(null);
    setPendingBooking(null);
    setUserProfile(EMPTY_PROFILE);
    setAddresses([]);
    setVehicles([]);
    setSelectedInvoice(null);
    setShowRatingForBooking(null);
  };

  const handleCreateBooking = async (bookingRequest: BookingCreateRequest) => {
    try {
      const response = await api.bookings.create(bookingRequest);
      await refreshBookings();
      setPendingBooking(response.booking);
      setActiveBooking(null);
      setCurrentScreen('customer-dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Create booking failed';
      throw new Error(message);
    }
  };

  const dashboardScreen =
    userType === 'admin'
      ? 'admin-dashboard'
      : userType === 'customer'
        ? 'customer-dashboard'
        : 'provider-dashboard';

  const openChatForBooking = (booking: Booking) => {
    setActiveBooking(booking);
    setCurrentScreen('chat');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen />;
      case 'login':
        return <LoginScreen onLogin={handleLogin} />;
      case 'customer-dashboard':
        return (
          <CustomerDashboard
            userName={userProfile.name.split(' ')[0] || 'Customer'}
            activeBooking={activeBooking}
            pendingBooking={pendingBooking}
            onNavigate={setCurrentScreen}
          />
        );
      case 'provider-dashboard':
        return <ProviderDashboard providerName={userProfile.name || 'Provider'} onNavigate={setCurrentScreen} onOpenChat={openChatForBooking} />;
      case 'provider-crm':
        return <ProviderCRM onBack={() => setCurrentScreen('provider-dashboard')} />;
      case 'provider-marketing':
        return <ProviderMarketing onBack={() => setCurrentScreen('provider-dashboard')} />;
      case 'admin-dashboard':
        return <AdminDashboard onBack={() => setCurrentScreen('profile')} />;
      case 'provider-onboarding':
        return <ProviderOnboarding onBack={handleLogout} onComplete={() => setCurrentScreen('provider-dashboard')} />;
      case 'request':
        return <RequestMechanic onBack={() => setCurrentScreen('customer-dashboard')} onSubmit={handleCreateBooking} />;
      case 'track':
        return <TrackMechanic booking={activeBooking} onBack={() => setCurrentScreen('customer-dashboard')} onOpenChat={() => setCurrentScreen('chat')} />;
      case 'chat':
        return activeBooking ? (
          <Chat bookingId={activeBooking.id} currentUserId={currentUserId} onBack={() => setCurrentScreen(dashboardScreen)} />
        ) : null;
      case 'services':
        return <Services onBack={() => setCurrentScreen('customer-dashboard')} onRequestService={() => setCurrentScreen('request')} />;
      case 'payments':
        return <Payments bookings={bookings} userType={userType} onBack={() => setCurrentScreen(dashboardScreen)} />;
      case 'bookings':
        return (
          <Bookings
            bookings={bookings}
            onBack={() => setCurrentScreen('customer-dashboard')}
            onViewBooking={(booking) => {
              setActiveBooking(booking);
              setCurrentScreen('track');
            }}
          />
        );
      case 'service-history':
        return (
          <ServiceHistory
            onBack={() => setCurrentScreen('profile')}
            onOpenInvoice={(booking) => {
              setActiveBooking(booking);
              setCurrentScreen('invoice');
            }}
            onOpenDocumentation={(booking) => {
              setActiveBooking(booking);
              setCurrentScreen('job-documentation');
            }}
            onOpenDisputes={(booking) => {
              setActiveBooking(booking);
              setCurrentScreen('disputes');
            }}
          />
        );
      case 'invoice':
        return <Invoice invoice={selectedInvoice} onBack={() => setCurrentScreen('service-history')} />;
      case 'job-documentation':
        return activeBooking ? <JobDocumentation bookingId={activeBooking.id} onBack={() => setCurrentScreen(dashboardScreen)} /> : null;
      case 'disputes':
        return <Disputes booking={activeBooking} onBack={() => setCurrentScreen('profile')} />;
      case 'directory':
        return <BusinessDirectory onBack={() => setCurrentScreen(dashboardScreen)} />;
      case 'profile':
        return <Profile userProfile={userProfile} onBack={() => setCurrentScreen(dashboardScreen)} onNavigate={setCurrentScreen} onLogout={handleLogout} />;
      case 'edit-info':
        return (
          <EditPersonalInfo
            userProfile={userProfile}
            onSave={(profile) => {
              setUserProfile(profile);
              setCurrentScreen('profile');
            }}
            onBack={() => setCurrentScreen('profile')}
          />
        );
      case 'addresses':
        return <ManageAddresses addresses={addresses} onSave={setAddresses} onBack={() => setCurrentScreen('profile')} />;
      case 'vehicles':
        return <ManageVehicles vehicles={vehicles} onSave={setVehicles} onBack={() => setCurrentScreen('profile')} />;
      case 'ai-chat':
        return <AIChatBot onBack={() => setCurrentScreen(dashboardScreen)} userType={userType || 'customer'} />;
      case 'privacy':
        return <PrivacyPolicy onBack={() => setCurrentScreen('profile')} />;
      case 'help':
        return <HelpCenter onBack={() => setCurrentScreen('profile')} onNavigate={setCurrentScreen} />;
      case 'notifications':
        return <NotificationSettings onBack={() => setCurrentScreen('profile')} />;
      case 'payment-methods':
        return <PaymentMethods onBack={() => setCurrentScreen('profile')} />;
      default:
        return (
          <CustomerDashboard
            userName={userProfile.name.split(' ')[0] || 'Customer'}
            activeBooking={activeBooking}
            pendingBooking={pendingBooking}
            onNavigate={setCurrentScreen}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-stone-100">
      {renderScreen()}

      {showRatingForBooking && (
        <RatingModal
          bookingId={showRatingForBooking}
          onClose={() => setShowRatingForBooking(null)}
          onSubmitted={() => {
            setShowRatingForBooking(null);
            void refreshBookings();
          }}
        />
      )}

      {currentScreen !== 'splash' && currentScreen !== 'login' && currentScreen !== 'provider-onboarding' && userType && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-4 py-3 flex justify-around items-center max-w-md mx-auto">
          <button
            onClick={() => setCurrentScreen(dashboardScreen)}
            className={`flex flex-col items-center gap-1 ${currentScreen === dashboardScreen ? 'text-red-700' : 'text-stone-500'}`}
          >
            <span className="text-xs">Home</span>
          </button>

          {userType === 'customer' && (
            <button
              onClick={() => setCurrentScreen('bookings')}
              className={`flex flex-col items-center gap-1 ${currentScreen === 'bookings' ? 'text-red-700' : 'text-stone-500'}`}
            >
              <span className="text-xs">Bookings</span>
            </button>
          )}

          <button
            onClick={() => setCurrentScreen('directory')}
            className={`flex flex-col items-center gap-1 ${currentScreen === 'directory' ? 'text-red-700' : 'text-stone-500'}`}
          >
            <span className="text-xs">Directory</span>
          </button>

          <button
            onClick={() => setCurrentScreen('payments')}
            className={`flex flex-col items-center gap-1 ${currentScreen === 'payments' ? 'text-red-700' : 'text-stone-500'}`}
          >
            <span className="text-xs">Payments</span>
          </button>

          <button
            onClick={() => setCurrentScreen('profile')}
            className={`flex flex-col items-center gap-1 ${
              ['profile', 'edit-info', 'addresses', 'vehicles', 'ai-chat', 'privacy', 'help', 'notifications', 'payment-methods', 'service-history', 'disputes'].includes(currentScreen)
                || ['provider-crm', 'provider-marketing'].includes(currentScreen)
                ? 'text-red-700'
                : 'text-stone-500'
            }`}
          >
            <span className="text-xs">Profile</span>
          </button>
        </nav>
      )}
    </div>
  );
}

export default App;
