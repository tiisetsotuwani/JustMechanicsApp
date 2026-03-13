import { ArrowLeft, User, MapPin, Car, Bell, CreditCard, Shield, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import type { UserProfile } from '../App';

interface ProfileProps {
  userProfile: UserProfile;
  onBack: () => void;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

export function Profile({ userProfile, onBack, onNavigate, onLogout }: ProfileProps) {
  const profileSections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Personal Information', action: () => onNavigate('edit-info') },
        { icon: MapPin, label: 'Saved Addresses', action: () => onNavigate('addresses') },
        { icon: Car, label: 'My Vehicles', action: () => onNavigate('vehicles') },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Notifications', action: () => onNavigate('notifications') },
        { icon: CreditCard, label: 'Payment Methods', action: () => onNavigate('payment-methods') },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: Shield, label: 'Privacy & Security', action: () => onNavigate('privacy') },
        { icon: HelpCircle, label: 'Help Center', action: () => onNavigate('help') },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-20">
        <button onClick={onBack} className="flex items-center gap-2 mb-8">
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </button>
      </div>

      <div className="px-6 -mt-12">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-red-700 to-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {userProfile.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{userProfile.name}</h2>
              <p className="text-gray-600">{userProfile.email}</p>
            </div>
            <button 
              onClick={() => onNavigate('edit-info')}
              className="text-red-700 font-medium"
            >
              Edit
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">12</p>
              <p className="text-sm text-gray-600">Services</p>
            </div>
            <div className="text-center border-x border-gray-200">
              <p className="text-2xl font-bold text-gray-900">4.9</p>
              <p className="text-sm text-gray-600">Rating</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">3</p>
              <p className="text-sm text-gray-600">Vehicles</p>
            </div>
          </div>
        </div>

        {/* Menu Sections */}
        <div className="space-y-6">
          {profileSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                {section.title}
              </h3>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {section.items.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className={`w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
                        index !== section.items.length - 1 ? 'border-b border-gray-100' : ''
                      }`}
                    >
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <Icon className="w-5 h-5 text-red-700" />
                      </div>
                      <span className="flex-1 text-left font-medium text-gray-900">{item.label}</span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Logout Button */}
          <button 
            onClick={onLogout}
            className="w-full bg-white rounded-2xl p-4 shadow-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-3 text-red-700 font-semibold"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>

        {/* App Info */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>JustMechanic v1.0.0</p>
          <p className="mt-1">© 2026 JustMechanic. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}