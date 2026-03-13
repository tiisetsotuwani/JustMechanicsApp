import { useState, useEffect } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { LoginScreen } from './components/LoginScreen';
import { api } from '../utils/api';
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

type Screen = 'splash' | 'login' | 'customer-dashboard' | 'provider-dashboard' | 'request' | 'track' | 'services' | 'payments' | 'bookings' | 'profile' | 'directory' | 'edit-info' | 'addresses' | 'vehicles' | 'ai-chat';
type UserType = null | 'customer' | 'provider';

export interface Booking {
  id: string;
  service: string;
  vehicle: string;
  status: 'pending' | 'accepted' | 'on-the-way' | 'in-progress' | 'completed';
  mechanicName?: string;
  mechanicImage?: string;
  estimatedArrival?: string;
  price?: number;
  location?: string;
  date: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface Address {
  id: string;
  label: string;
  address: string;
  isDefault: boolean;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: string;
  plateNumber: string;
  isDefault: boolean;
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [userType, setUserType] = useState<UserType>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main St, City, State 12345',
  });
  const [addresses, setAddresses] = useState<Address[]>([
    { id: '1', label: 'Home', address: '123 Main St, City, State 12345', isDefault: true },
    { id: '2', label: 'Work', address: '456 Office Blvd, City, State 12345', isDefault: false },
  ]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { id: '1', make: 'Toyota', model: 'Camry', year: '2020', plateNumber: 'ABC123', isDefault: true },
    { id: '2', make: 'Honda', model: 'Civic', year: '2019', plateNumber: 'XYZ789', isDefault: false },
  ]);

  useEffect(() => {
    // Show splash screen for 2.5 seconds
    const timer = setTimeout(() => {
      setCurrentScreen('login');
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Load mock booking data
    const mockBookings: Booking[] = [
      {
        id: '1',
        service: 'Oil Change',
        vehicle: 'Toyota',
        status: 'on-the-way',
        mechanicName: 'Mike Johnson',
        mechanicImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
        estimatedArrival: '15 mins',
        price: 89.99,
        location: 'Your Location',
        date: new Date().toISOString(),
      },
    ];
    setBookings(mockBookings);
    setActiveBooking(mockBookings[0]);
  }, []);

  const handleLogin = (type: 'customer' | 'provider', profile?: { name: string; email: string; phone: string }) => {
    setUserType(type);
    if (profile) {
      setUserProfile((prev) => ({
        ...prev,
        name: profile.name || prev.name,
        email: profile.email || prev.email,
        phone: profile.phone || prev.phone,
      }));
    }
    if (type === 'customer') {
      setCurrentScreen('customer-dashboard');
    } else {
      setCurrentScreen('provider-dashboard');
    }
  };

  const handleLogout = async () => {
    try {
      await api.auth.signout();
    } catch {
      // Ignore signout errors
    }
    api.setAuthToken(null);
    setUserType(null);
    setCurrentScreen('splash');
    // Reset to login after splash animation
    setTimeout(() => {
      setCurrentScreen('login');
    }, 2500);
  };

  const handleCreateBooking = async (booking: Booking) => {
    try {
      const result = await api.bookings.create({
        service: booking.service,
        vehicle: booking.vehicle,
        location: booking.location || '',
        description: '',
      });
      const newBooking = {
        ...booking,
        id: result.booking?.id || Date.now().toString(),
        date: new Date().toISOString(),
      };
      setBookings([newBooking, ...bookings]);
      setActiveBooking(newBooking);
    } catch {
      // Fallback to local booking if API fails
      const newBooking = { ...booking, id: Date.now().toString(), date: new Date().toISOString() };
      setBookings([newBooking, ...bookings]);
      setActiveBooking(newBooking);
    }
    setCurrentScreen('customer-dashboard');
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
            userName={userProfile.name.split(' ')[0]}
            activeBooking={activeBooking}
            onNavigate={setCurrentScreen}
          />
        );
      case 'provider-dashboard':
        return (
          <ProviderDashboard
            providerName={userProfile.name}
            onNavigate={setCurrentScreen}
          />
        );
      case 'request':
        return (
          <RequestMechanic
            onBack={() => setCurrentScreen('customer-dashboard')}
            onSubmit={handleCreateBooking}
          />
        );
      case 'track':
        return (
          <TrackMechanic
            booking={activeBooking}
            onBack={() => setCurrentScreen('customer-dashboard')}
          />
        );
      case 'services':
        return (
          <Services
            onBack={() => setCurrentScreen('customer-dashboard')}
            onRequestService={(service) => {
              setCurrentScreen('request');
            }}
          />
        );
      case 'payments':
        return (
          <Payments
            bookings={bookings}
            onBack={() => setCurrentScreen('customer-dashboard')}
          />
        );
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
      case 'directory':
        return (
          <BusinessDirectory
            onBack={() => userType === 'customer' ? setCurrentScreen('customer-dashboard') : setCurrentScreen('provider-dashboard')}
          />
        );
      case 'profile':
        return (
          <Profile
            userProfile={userProfile}
            onBack={() => userType === 'customer' ? setCurrentScreen('customer-dashboard') : setCurrentScreen('provider-dashboard')}
            onNavigate={setCurrentScreen}
            onLogout={handleLogout}
          />
        );
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
        return (
          <ManageAddresses
            addresses={addresses}
            onSave={setAddresses}
            onBack={() => setCurrentScreen('profile')}
          />
        );
      case 'vehicles':
        return (
          <ManageVehicles
            vehicles={vehicles}
            onSave={setVehicles}
            onBack={() => setCurrentScreen('profile')}
          />
        );
      case 'ai-chat':
        return (
          <AIChatBot
            onBack={() => userType === 'customer' ? setCurrentScreen('customer-dashboard') : setCurrentScreen('provider-dashboard')}
            userType={userType || 'customer'}
          />
        );
      default:
        return userType === 'customer' ? (
          <CustomerDashboard userName={userProfile.name.split(' ')[0]} activeBooking={activeBooking} onNavigate={setCurrentScreen} />
        ) : (
          <ProviderDashboard providerName={userProfile.name} onNavigate={setCurrentScreen} />
        );
    }
  };

  const dashboardScreen = userType === 'customer' ? 'customer-dashboard' : 'provider-dashboard';

  return (
    <div className="min-h-screen bg-stone-100">
      {renderScreen()}
      
      {/* Bottom Navigation - Show on all screens except splash and login */}
      {currentScreen !== 'splash' && currentScreen !== 'login' && userType && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-4 py-3 flex justify-around items-center max-w-md mx-auto">
          <button
            onClick={() => setCurrentScreen(dashboardScreen)}
            className={`flex flex-col items-center gap-1 ${
              currentScreen === dashboardScreen ? 'text-red-700' : 'text-stone-500'
            }`}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span className="text-xs">Home</span>
          </button>
          
          {userType === 'customer' && (
            <button
              onClick={() => setCurrentScreen('bookings')}
              className={`flex flex-col items-center gap-1 ${
                currentScreen === 'bookings' ? 'text-red-700' : 'text-stone-500'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs">Bookings</span>
            </button>
          )}
          
          <button
            onClick={() => setCurrentScreen('directory')}
            className={`flex flex-col items-center gap-1 ${
              currentScreen === 'directory' ? 'text-red-700' : 'text-stone-500'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-xs">Directory</span>
          </button>
          
          {userType === 'customer' && (
            <button
              onClick={() => setCurrentScreen('payments')}
              className={`flex flex-col items-center gap-1 ${
                currentScreen === 'payments' ? 'text-red-700' : 'text-stone-500'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="text-xs">Payments</span>
            </button>
          )}
          
          <button
            onClick={() => setCurrentScreen('profile')}
            className={`flex flex-col items-center gap-1 ${
              currentScreen === 'profile' || currentScreen === 'edit-info' || currentScreen === 'addresses' || currentScreen === 'vehicles' || currentScreen === 'ai-chat' ? 'text-red-700' : 'text-stone-500'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs">Profile</span>
          </button>
        </nav>
      )}
    </div>
  );
}

export default App;
