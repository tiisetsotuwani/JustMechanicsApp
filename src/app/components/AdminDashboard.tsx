import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ClipboardList, Search, Settings2, ShieldAlert, Users, Wrench } from 'lucide-react';
import { api } from '../../utils/api';
import type { AdminOverviewStats, AuditLogEntry, Booking, UserProfile } from '../../shared/types';

interface AdminDashboardProps {
  onBack: () => void;
}

interface DebugResult {
  booking?: Booking | null;
  payment?: Record<string, unknown> | null;
  invoice?: Record<string, unknown> | null;
  disputes?: Array<Record<string, unknown>>;
  chatCount?: number;
  audits?: Array<Record<string, unknown>>;
  user?: UserProfile | null;
}

interface PlatformConfig {
  promoEnabled: boolean;
  referralEnabled: boolean;
  priorityMultiplier: number;
  serviceFeePercent: number;
}

export function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>({
    promoEnabled: false,
    referralEnabled: false,
    priorityMultiplier: 1,
    serviceFeePercent: 15,
  });
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null);
  const [onboardingQueue, setOnboardingQueue] = useState<Array<Record<string, unknown>>>([]);
  const [userAuditEntries, setUserAuditEntries] = useState<AuditLogEntry[]>([]);
  const [selectedAuditUser, setSelectedAuditUser] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [bookingFilter, setBookingFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debugBookingId, setDebugBookingId] = useState('');
  const [debugUserId, setDebugUserId] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const [overviewResponse, usersResponse, bookingsResponse, configResponse, onboardingQueueResponse] = await Promise.all([
        api.admin.overview(),
        api.admin.listUsers(userFilter || undefined),
        api.admin.listBookings(bookingFilter || undefined),
        api.admin.getPlatformConfig(),
        api.onboarding.getQueue().catch(() => ({ applications: [] })),
      ]);
      setStats(overviewResponse.stats);
      setUsers(usersResponse.users || []);
      setBookings(bookingsResponse.bookings || []);
      setPlatformConfig({
        promoEnabled: Boolean(configResponse.config?.promoEnabled),
        referralEnabled: Boolean(configResponse.config?.referralEnabled),
        priorityMultiplier: Number(configResponse.config?.priorityMultiplier || 1),
        serviceFeePercent: Number(configResponse.config?.serviceFeePercent || 15),
      });
      setOnboardingQueue((onboardingQueueResponse.applications || []) as Array<Record<string, unknown>>);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [bookingFilter, userFilter]);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        [user.name, user.email, user.phone].join(' ').toLowerCase().includes(search.toLowerCase()),
      ),
    [search, users],
  );

  const handleSuspendToggle = async (user: UserProfile) => {
    try {
      await api.admin.suspendUser(user.id || '', !user.suspended, user.suspended ? '' : 'Admin action');
      await load();
    } catch (suspendError) {
      setError(suspendError instanceof Error ? suspendError.message : 'Failed to update user');
    }
  };

  const handleDebugLookup = async () => {
    try {
      const response = await api.admin.debugLookup({
        bookingId: debugBookingId || undefined,
        userId: debugUserId || undefined,
      });
      setDebugResult(response);
      setError('');
    } catch (debugError) {
      setError(debugError instanceof Error ? debugError.message : 'Failed to load debug data');
    }
  };

  const handleViewUserAudit = async (userId: string) => {
    try {
      const response = await api.admin.getUserAudit(userId);
      setSelectedAuditUser(userId);
      setUserAuditEntries(response.entries || []);
      setError('');
    } catch (auditError) {
      setError(auditError instanceof Error ? auditError.message : 'Failed to load audit trail');
    }
  };

  const handleSaveConfig = async () => {
    try {
      const response = await api.admin.updatePlatformConfig(platformConfig);
      setPlatformConfig({
        promoEnabled: Boolean(response.config?.promoEnabled),
        referralEnabled: Boolean(response.config?.referralEnabled),
        priorityMultiplier: Number(response.config?.priorityMultiplier || 1),
        serviceFeePercent: Number(response.config?.serviceFeePercent || 15),
      });
      setError('');
    } catch (configError) {
      setError(configError instanceof Error ? configError.message : 'Failed to save platform config');
    }
  };

  const handleOnboardingDecision = async (providerId: string, decision: 'approved' | 'rejected') => {
    try {
      await api.onboarding.review(providerId, decision);
      await load();
      setError('');
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Failed to review onboarding application');
    }
  };

  const cards = [
    { label: 'Customers', value: stats?.totalCustomers ?? 0, icon: Users },
    { label: 'Providers', value: stats?.totalProviders ?? 0, icon: Wrench },
    { label: 'Pending Bookings', value: stats?.pendingBookings ?? 0, icon: ClipboardList },
    { label: 'Online Providers', value: stats?.onlineProviders ?? 0, icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-6">
        <button onClick={onBack} className="flex items-center gap-2 mb-6">
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-red-100 mt-2">Operations, debugging, and platform controls</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{error}</div>}

        <div className="grid grid-cols-2 gap-4">
          {cards.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                  <Icon className="w-6 h-6 text-red-700" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{loading ? '--' : item.value}</p>
                <p className="text-sm text-gray-600">{item.label}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users"
              className="flex-1 outline-none text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <select
              value={userFilter}
              onChange={(event) => setUserFilter(event.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            >
              <option value="">All users</option>
              <option value="customer">Customers</option>
              <option value="provider">Providers</option>
            </select>
            <select
              value={bookingFilter}
              onChange={(event) => setBookingFilter(event.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            >
              <option value="">All bookings</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="w-5 h-5 text-red-700" />
            <h2 className="font-semibold text-gray-900">Platform Config</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center justify-between bg-stone-50 rounded-xl px-4 py-3">
              <span className="text-sm text-gray-700">Promos enabled</span>
              <input
                type="checkbox"
                checked={platformConfig.promoEnabled}
                onChange={(event) => setPlatformConfig((current) => ({ ...current, promoEnabled: event.target.checked }))}
              />
            </label>
            <label className="flex items-center justify-between bg-stone-50 rounded-xl px-4 py-3">
              <span className="text-sm text-gray-700">Referrals enabled</span>
              <input
                type="checkbox"
                checked={platformConfig.referralEnabled}
                onChange={(event) => setPlatformConfig((current) => ({ ...current, referralEnabled: event.target.checked }))}
              />
            </label>
            <input
              type="number"
              value={platformConfig.priorityMultiplier}
              onChange={(event) =>
                setPlatformConfig((current) => ({ ...current, priorityMultiplier: Number(event.target.value) }))
              }
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm"
              placeholder="Priority multiplier"
            />
            <input
              type="number"
              value={platformConfig.serviceFeePercent}
              onChange={(event) =>
                setPlatformConfig((current) => ({ ...current, serviceFeePercent: Number(event.target.value) }))
              }
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm"
              placeholder="Service fee %"
            />
          </div>
          <button
            onClick={() => void handleSaveConfig()}
            className="mt-4 bg-red-700 text-white px-5 py-3 rounded-xl font-semibold hover:bg-red-800 transition-colors"
          >
            Save Config
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Onboarding Queue</h2>
          <div className="space-y-4">
            {onboardingQueue.map((item) => {
              const profile = (item.profile as Record<string, unknown>) || {};
              const onboarding = (item.onboarding as Record<string, unknown>) || {};
              const providerId = String(item.userId || profile.id || '');
              return (
                <div key={providerId} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">{String(profile.name || 'Provider')}</p>
                      <p className="text-sm text-gray-600">{String(profile.email || '')}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Qualification: {String((onboarding.steps as Record<string, unknown> | undefined)?.qualification_path ? ((onboarding.steps as Record<string, unknown>).qualification_path as Record<string, unknown>).path || 'unknown' : 'unknown')}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                      {String(onboarding.status || 'pending_review')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button
                      onClick={() => void handleOnboardingDecision(providerId, 'approved')}
                      className="bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => void handleOnboardingDecision(providerId, 'rejected')}
                      className="bg-red-700 text-white py-2 rounded-lg font-semibold hover:bg-red-800 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
            {onboardingQueue.length === 0 && <p className="text-sm text-gray-500">No providers waiting for review.</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Users</h2>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id || user.email} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">{user.userType}</p>
                    {user.suspended && user.suspendReason && (
                      <p className="text-xs text-red-600 mt-1">Reason: {user.suspendReason}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => void handleViewUserAudit(user.id || '')}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-stone-100 text-stone-700"
                    >
                      View Audit
                    </button>
                    <button
                      onClick={() => void handleSuspendToggle(user)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                        user.suspended ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {user.suspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!loading && filteredUsers.length === 0 && <p className="text-sm text-gray-500">No users found.</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Audit Trail</h2>
          {selectedAuditUser ? (
            <p className="text-sm text-gray-600 mb-4">Showing the latest audit events for user {selectedAuditUser}</p>
          ) : (
            <p className="text-sm text-gray-500 mb-4">Select a user to inspect their audit trail.</p>
          )}
          <div className="space-y-3">
            {userAuditEntries.map((entry) => (
              <div key={entry.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{entry.action}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(entry.timestamp).toLocaleString()}</p>
                  </div>
                  {entry.targetId && (
                    <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-medium">
                      {entry.targetId}
                    </span>
                  )}
                </div>
                {Object.keys(entry.details || {}).length > 0 && (
                  <pre className="mt-3 whitespace-pre-wrap overflow-auto text-xs text-gray-600">
                    {JSON.stringify(entry.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
            {selectedAuditUser && userAuditEntries.length === 0 && (
              <p className="text-sm text-gray-500">No audit events found for this user yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Bookings</h2>
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{booking.service}</p>
                    <p className="text-sm text-gray-600">{booking.location}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-medium">
                    {booking.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
            {!loading && bookings.length === 0 && <p className="text-sm text-gray-500">No bookings found.</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Debug Lookup</h2>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={debugBookingId}
              onChange={(event) => setDebugBookingId(event.target.value)}
              placeholder="Booking ID"
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm"
            />
            <input
              value={debugUserId}
              onChange={(event) => setDebugUserId(event.target.value)}
              placeholder="User ID"
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm"
            />
          </div>
          <button
            onClick={() => void handleDebugLookup()}
            className="mt-4 bg-red-700 text-white px-5 py-3 rounded-xl font-semibold hover:bg-red-800 transition-colors"
          >
            Inspect
          </button>

          {debugResult && (
            <div className="mt-4 bg-stone-100 rounded-2xl p-4 space-y-3 text-sm">
              <p><span className="font-semibold">Chat messages:</span> {debugResult.chatCount || 0}</p>
              <p><span className="font-semibold">Disputes:</span> {debugResult.disputes?.length || 0}</p>
              <p><span className="font-semibold">Audits:</span> {debugResult.audits?.length || 0}</p>
              {debugResult.user && <pre className="whitespace-pre-wrap overflow-auto">{JSON.stringify(debugResult.user, null, 2)}</pre>}
              {debugResult.booking && <pre className="whitespace-pre-wrap overflow-auto">{JSON.stringify(debugResult.booking, null, 2)}</pre>}
              {debugResult.payment && <pre className="whitespace-pre-wrap overflow-auto">{JSON.stringify(debugResult.payment, null, 2)}</pre>}
              {debugResult.invoice && <pre className="whitespace-pre-wrap overflow-auto">{JSON.stringify(debugResult.invoice, null, 2)}</pre>}
              {!!debugResult.audits?.length && (
                <pre className="whitespace-pre-wrap overflow-auto">{JSON.stringify(debugResult.audits, null, 2)}</pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
