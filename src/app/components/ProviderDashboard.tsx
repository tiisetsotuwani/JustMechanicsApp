import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle, Clock, DollarSign, MessageCircle, Settings, Star, Wrench } from 'lucide-react';
import { api } from '../../utils/api';
import type { Booking, ProviderStats, Screen } from '../../shared/types';

interface ProviderDashboardProps {
  providerName: string;
  onNavigate: (screen: Screen) => void;
  onOpenChat?: (booking: Booking) => void;
}

export function ProviderDashboard({ providerName, onNavigate, onOpenChat }: ProviderDashboardProps) {
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [pendingJobs, setPendingJobs] = useState<Booking[]>([]);
  const [offers, setOffers] = useState<Array<Record<string, unknown>>>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nowMs, setNowMs] = useState(Date.now());

  const getCurrentPosition = async (): Promise<{ lat: number; lng: number } | null> => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000 },
      );
    });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsResponse, pendingResponse, profileResponse, offerResponse] = await Promise.all([
        api.provider.getStats(),
        api.bookings.getPending(),
        api.profile.get(),
        api.bookings.getOffers().catch(() => ({ offers: [] })),
      ]);
      setStats(statsResponse.stats);
      setPendingJobs(pendingResponse.bookings || []);
      setIsOnline(Boolean(profileResponse.profile?.isOnline));
      setOffers((offerResponse.offers || []) as Array<Record<string, unknown>>);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load provider dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [isOnline]);

  useEffect(() => {
    if (!isOnline || typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }

    const pushLocation = async () => {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          await api.provider.updateAvailability(
            true,
            undefined,
            {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          );
        } catch {
          // Ignore location refresh failures to avoid interrupting dashboard flow.
        }
      });
    };

    void pushLocation();
    const interval = window.setInterval(() => {
      void pushLocation();
    }, 15000);
    return () => window.clearInterval(interval);
  }, [isOnline]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const refresh = window.setInterval(() => {
      void loadData();
    }, 5000);
    return () => window.clearInterval(refresh);
  }, []);

  const statCards = useMemo(
    () => [
      { label: 'Pending Jobs', value: stats?.pendingJobs ?? 0, icon: Wrench, color: 'bg-blue-100 text-blue-700' },
      { label: 'Completed', value: stats?.completedJobs ?? 0, icon: CheckCircle, color: 'bg-green-100 text-green-700' },
      { label: 'Revenue', value: `R${stats?.totalEarnings ?? '0.00'}`, icon: DollarSign, color: 'bg-red-100 text-red-700' },
      { label: 'Rating', value: stats?.rating?.toFixed(1) ?? '0.0', icon: Star, color: 'bg-yellow-100 text-yellow-700' },
    ],
    [stats],
  );

  const handleAvailabilityToggle = async () => {
    try {
      const nextValue = !isOnline;
      const location = nextValue ? await getCurrentPosition() : null;
      await api.provider.updateAvailability(nextValue, undefined, location || undefined);
      setIsOnline(nextValue);
      if (nextValue) {
        void api.dispatch.tick().catch(() => undefined);
      }
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Failed to update availability');
    }
  };

  const handleAccept = async (bookingId: string) => {
    try {
      await api.bookings.accept(bookingId);
      await loadData();
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : 'Failed to accept booking');
    }
  };

  const handleDecline = async (bookingId: string) => {
    try {
      await api.bookings.decline(bookingId);
      await loadData();
    } catch (declineError) {
      setError(declineError instanceof Error ? declineError.message : 'Failed to decline booking');
    }
  };

  const handleOfferResponse = async (offerId: string, decision: 'accept' | 'decline') => {
    try {
      await api.bookings.respondToOffer(offerId, decision);
      await loadData();
    } catch (offerError) {
      setError(offerError instanceof Error ? offerError.message : 'Failed to respond to offer');
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center">
              <Wrench className="w-8 h-8 text-red-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">JustMechanic</h1>
              <p className="text-sm text-red-100">Provider Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              aria-label="Open notifications"
              onClick={() => onNavigate('notifications')}
              className="w-10 h-10 flex items-center justify-center relative"
            >
              <Bell className="w-6 h-6" />
              {pendingJobs.length + offers.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 bg-yellow-400 text-red-900 rounded-full border border-red-700 text-[10px] font-bold flex items-center justify-center">
                  {pendingJobs.length + offers.length}
                </span>
              )}
            </button>
            <button
              aria-label="Open settings"
              onClick={() => onNavigate('profile')}
              className="w-10 h-10 flex items-center justify-center"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-4">
        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-6">{error}</div>}

        <div className="mb-6">
          <h2 className="text-2xl text-gray-900 mb-2">Welcome back, {providerName.split(' ')[0]}</h2>
          <p className="text-gray-600">
            {loading ? 'Loading jobs...' : `You have ${pendingJobs.length} pending service requests`}
          </p>
          <div className="mt-2 inline-flex items-center gap-2 text-sm">
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className={isOnline ? 'text-green-700 font-medium' : 'text-gray-600'}>
              {isOnline ? 'You are online and discoverable' : 'You are offline'}
            </span>
          </div>
        </div>

        {!loading && offers.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Incoming Offers</h3>
              <span className="text-sm text-red-700 font-medium">{offers.length} Live • Auto-refresh 5s</span>
            </div>
            <div className="space-y-3">
              {offers.map((offer) => (
                <div key={String(offer.id)} className="bg-white rounded-2xl p-5 shadow-sm border border-red-100">
                  <p className="font-semibold text-gray-900">{String((offer.booking as Record<string, unknown>)?.service || 'Service Request')}</p>
                  <p className="text-sm text-gray-600 mt-1">{String((offer.booking as Record<string, unknown>)?.location || '')}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Expires in {Math.max(0, Math.floor((new Date(String(offer.expiresAt)).getTime() - nowMs) / 1000))}s
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button
                      onClick={() => void handleOfferResponse(String(offer.id), 'accept')}
                      className="bg-red-700 text-white py-2.5 rounded-xl font-semibold hover:bg-red-800 transition-colors"
                    >
                      Accept Offer
                    </button>
                    <button
                      onClick={() => void handleOfferResponse(String(offer.id), 'decline')}
                      className="bg-gray-100 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center mb-3`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{loading ? '--' : stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => void handleAvailabilityToggle()}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-colors ${
                isOnline ? 'bg-green-50 text-green-700 border-2 border-green-600' : 'border-2 border-red-700 text-red-700 hover:bg-red-50'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className="font-medium">{isOnline ? 'Go Offline' : 'Go Online'}</span>
            </button>
            <button
              onClick={() => onNavigate('directory')}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-red-700 text-white rounded-xl hover:bg-red-800 transition-colors"
            >
              <span className="font-medium">Directory</span>
            </button>
            <button
              onClick={() => onNavigate('provider-crm')}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-white text-red-700 border-2 border-red-700 rounded-xl hover:bg-red-50 transition-colors"
            >
              <span className="font-medium">CRM</span>
            </button>
            <button
              onClick={() => onNavigate('provider-marketing')}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-white text-red-700 border-2 border-red-700 rounded-xl hover:bg-red-50 transition-colors"
            >
              <span className="font-medium">WhatsApp</span>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Pending Requests</h3>
            <span className="text-sm text-red-700 font-medium">{pendingJobs.length} New</span>
          </div>

          <div className="space-y-4">
            {pendingJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">{job.service}</h4>
                    <p className="text-sm text-gray-600">{job.vehicle}</p>
                    <p className="text-sm text-gray-500 mt-2">{job.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-700">
                      {job.price ? `R${job.price}` : 'Quote on arrival'}
                    </p>
                    <p className="text-xs text-gray-500">{job.createdAt ? new Date(job.createdAt).toLocaleTimeString() : ''}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => void handleAccept(job.id)}
                    className="flex-1 bg-red-700 text-white py-3 rounded-xl font-semibold hover:bg-red-800 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDecline(job.id)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Decline
                  </button>
                  {onOpenChat && (
                    <button
                      onClick={() => onOpenChat(job)}
                      className="bg-green-100 text-green-700 px-4 rounded-xl"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!loading && pendingJobs.length === 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-gray-500">
                No pending jobs right now.
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => onNavigate('ai-chat')}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
      >
        <MessageCircle className="w-7 h-7" />
      </button>
    </div>
  );
}
