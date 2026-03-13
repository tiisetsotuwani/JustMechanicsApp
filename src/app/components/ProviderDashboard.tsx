import { useState } from 'react';
import { Bell, Settings, CheckCircle, Clock, DollarSign, Star, TrendingUp, Users, Wrench, MessageCircle } from 'lucide-react';
import { api } from '../../utils/api';

interface ProviderDashboardProps {
  providerName: string;
  onNavigate: (screen: string) => void;
}

export function ProviderDashboard({ providerName, onNavigate }: ProviderDashboardProps) {
  const [isOnline, setIsOnline] = useState(false);
  const [acceptedJobs, setAcceptedJobs] = useState<string[]>([]);
  const [declinedJobs, setDeclinedJobs] = useState<string[]>([]);
  const stats = [
    { label: 'Today\'s Jobs', value: '8', icon: Wrench, color: 'bg-blue-100 text-blue-700' },
    { label: 'Completed', value: '156', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
    { label: 'Revenue', value: '$12,450', icon: DollarSign, color: 'bg-red-100 text-red-700' },
    { label: 'Rating', value: '4.9', icon: Star, color: 'bg-yellow-100 text-yellow-700' },
  ];

  const pendingJobs = [
    {
      id: '1',
      customer: 'Sarah Miller',
      service: 'Oil Change',
      vehicle: 'Honda Accord 2021',
      location: '123 Main St, 2.3 miles away',
      time: '10:30 AM',
      price: 89.99,
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    },
    {
      id: '2',
      customer: 'John Smith',
      service: 'Battery Replacement',
      vehicle: 'Toyota Camry 2020',
      location: '456 Oak Ave, 1.8 miles away',
      time: '11:45 AM',
      price: 149.99,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    },
    {
      id: '3',
      customer: 'Emily Johnson',
      service: 'Tire Service',
      vehicle: 'Ford F-150 2022',
      location: '789 Pine Rd, 3.5 miles away',
      time: '1:00 PM',
      price: 199.99,
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    },
  ];

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      {/* Header */}
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
            <button className="w-10 h-10 flex items-center justify-center relative">
              <Bell className="w-6 h-6" />
              <span className="absolute top-0 right-0 w-3 h-3 bg-yellow-400 rounded-full border-2 border-red-700"></span>
            </button>
            <button className="w-10 h-10 flex items-center justify-center">
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-4">
        {/* Greeting */}
        <div className="mb-6">
          <h2 className="text-2xl text-gray-900 mb-2">Welcome back, {providerName.split(' ')[0]}</h2>
          <p className="text-gray-600">You have 3 pending service requests</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center mb-3`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={async () => {
                try {
                  const newStatus = !isOnline;
                  await api.provider.updateAvailability(newStatus, 15);
                  setIsOnline(newStatus);
                } catch {
                  setIsOnline(!isOnline);
                }
              }}
              className={`flex items-center justify-center gap-2 py-3 px-4 border-2 rounded-xl transition-colors ${
                isOnline
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-red-700 text-red-700 hover:bg-red-50'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className="font-medium">{isOnline ? 'Online' : 'Go Online'}</span>
            </button>
            <button 
              onClick={() => onNavigate('directory')}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-red-700 text-white rounded-xl hover:bg-red-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="font-medium">Directory</span>
            </button>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Pending Requests</h3>
            <span className="text-sm text-red-700 font-medium">3 New</span>
          </div>

          <div className="space-y-4">
            {pendingJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={job.image}
                    alt={job.customer}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{job.customer}</h4>
                    <p className="text-sm text-gray-600">{job.service}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-700">${job.price}</p>
                    <p className="text-xs text-gray-500">{job.time}</p>
                  </div>
                </div>

                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{job.vehicle}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{job.location}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  {acceptedJobs.includes(job.id) ? (
                    <div className="flex-1 bg-green-100 text-green-700 py-3 rounded-xl font-semibold text-center">
                      Accepted
                    </div>
                  ) : declinedJobs.includes(job.id) ? (
                    <div className="flex-1 bg-gray-200 text-gray-500 py-3 rounded-xl font-semibold text-center">
                      Declined
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={async () => {
                          try {
                            await api.bookings.accept(job.id);
                          } catch {
                            // Accept locally even if API fails
                          }
                          setAcceptedJobs((prev) => [...prev, job.id]);
                        }}
                        className="flex-1 bg-red-700 text-white py-3 rounded-xl font-semibold hover:bg-red-800 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => {
                          setDeclinedJobs((prev) => [...prev, job.id]);
                        }}
                        className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Decline
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">This Week's Performance</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Jobs Completed</span>
                <span className="font-semibold text-gray-900">28/30</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-red-700 rounded-full" style={{ width: '93%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Customer Satisfaction</span>
                <span className="font-semibold text-gray-900">4.9/5.0</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-600 rounded-full" style={{ width: '98%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Revenue Target</span>
                <span className="font-semibold text-gray-900">$12,450/$15,000</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '83%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating AI Chat Button */}
      <button
        onClick={() => onNavigate('ai-chat')}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group animate-bounce"
        style={{ animationDuration: '3s' }}
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></span>
      </button>
    </div>
  );
}
