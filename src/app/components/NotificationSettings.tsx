import { ArrowLeft, Bell, MessageSquare, Mail, Smartphone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../../utils/api';

interface NotificationSettingsProps {
  onBack: () => void;
}

export function NotificationSettings({ onBack }: NotificationSettingsProps) {
  const [settings, setSettings] = useState({
    // Push Notifications
    pushBookingUpdates: true,
    pushPromotions: true,
    pushNewMessages: true,
    pushServiceReminders: true,
    
    // Email Notifications
    emailBookingUpdates: true,
    emailPromotions: false,
    emailNewsletter: true,
    emailReceipts: true,
    
    // SMS Notifications
    smsBookingUpdates: true,
    smsPromotions: false,
    smsReminders: true,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Load settings from localStorage on mount
  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.notifications.getPreferences();
        setSettings((previous) => ({
          ...previous,
          ...(response.preferences || {}),
        }));
      } catch (error) {
        const savedSettings = localStorage.getItem('notification_settings');
        if (savedSettings) {
          try {
            setSettings(JSON.parse(savedSettings));
          } catch {
            // Ignore invalid local payload.
          }
        }
      }
    };

    void load();
  }, []);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      await api.notifications.updatePreferences(settings);
      localStorage.setItem('notification_settings', JSON.stringify(settings));
      setMessage('Preferences saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setMessage('Error saving preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const notificationSections = [
    {
      title: 'Push Notifications',
      icon: Smartphone,
      items: [
        { key: 'pushBookingUpdates' as keyof typeof settings, label: 'Booking Updates', description: 'Get notified about your service status' },
        { key: 'pushNewMessages' as keyof typeof settings, label: 'New Messages', description: 'Chat notifications from mechanics' },
        { key: 'pushServiceReminders' as keyof typeof settings, label: 'Service Reminders', description: 'Upcoming service appointments' },
        { key: 'pushPromotions' as keyof typeof settings, label: 'Promotions & Offers', description: 'Special deals and discounts' },
      ]
    },
    {
      title: 'Email Notifications',
      icon: Mail,
      items: [
        { key: 'emailBookingUpdates' as keyof typeof settings, label: 'Booking Confirmations', description: 'Email confirmations for bookings' },
        { key: 'emailReceipts' as keyof typeof settings, label: 'Payment Receipts', description: 'Transaction receipts via email' },
        { key: 'emailNewsletter' as keyof typeof settings, label: 'Newsletter', description: 'Monthly tips and updates' },
        { key: 'emailPromotions' as keyof typeof settings, label: 'Promotional Emails', description: 'Marketing and special offers' },
      ]
    },
    {
      title: 'SMS Notifications',
      icon: MessageSquare,
      items: [
        { key: 'smsBookingUpdates' as keyof typeof settings, label: 'Booking Updates', description: 'SMS updates about your service' },
        { key: 'smsReminders' as keyof typeof settings, label: 'Appointment Reminders', description: '1 hour before your service' },
        { key: 'smsPromotions' as keyof typeof settings, label: 'SMS Promotions', description: 'Exclusive SMS-only deals' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-8">
        <button onClick={onBack} className="flex items-center gap-2 mb-4">
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-3">
          <Bell className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-red-100 mt-1">Manage your notification preferences</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {notificationSections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-5 h-5 text-red-700" />
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  {section.title}
                </h2>
              </div>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {section.items.map((item, index) => (
                  <div
                    key={item.key}
                    className={`p-4 flex items-center justify-between ${
                      index !== section.items.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div className="flex-1 pr-4">
                      <h3 className="font-medium text-gray-900">{item.label}</h3>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(item.key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings[item.key] ? 'bg-red-700' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings[item.key] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Save Button */}
        <button
          className="w-full bg-red-700 text-white py-4 rounded-2xl font-semibold hover:bg-red-800 transition-colors shadow-lg"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Some notifications like critical security alerts and service updates 
            cannot be disabled as they are essential for account safety and service delivery.
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mt-4">
            <p className="text-sm text-green-800">
              {message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
