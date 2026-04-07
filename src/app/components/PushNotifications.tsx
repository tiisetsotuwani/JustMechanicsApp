import { useState, useEffect } from 'react';
import { Bell, BellOff, Check, X } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { api } from '../../utils/api';

export function PushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      // Check if already subscribed
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const requestPermission = async () => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in your browser');
      return;
    }

    setLoading(true);

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        await subscribeToPush();
        toast.success('Notifications enabled!');
      } else {
        toast.error('Notification permission denied');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast.error('Failed to enable notifications');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPush = async () => {
    try {
      // Register service worker if not already registered
      let registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        registration = await navigator.serviceWorker.register('/service-worker.js');
      }

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          // VAPID public key - in production, get this from environment variable
          'BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8xYqFGkrwzKfk7dNhD1234567890'
        ),
      });

      // Send subscription to backend
      await api.notifications.subscribe(subscription);

      setIsSubscribed(true);
    } catch (error) {
      console.error('Error subscribing to push:', error);
      throw error;
    }
  };

  const unsubscribe = async () => {
    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Notify backend
        await api.notifications.unsubscribe();
      }

      setIsSubscribed(false);
      toast.success('Notifications disabled');
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Failed to disable notifications');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to convert VAPID key
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <BellOff className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-900">
              Push notifications not supported
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              Your browser doesn't support push notifications. Try using Chrome, Firefox, or Safari.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {permission === 'granted' && isSubscribed ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">
                Push notifications enabled
              </p>
              <p className="text-sm text-green-700 mt-1">
                You'll receive updates about your bookings and service status
              </p>
              <button
                onClick={unsubscribe}
                disabled={loading}
                className="mt-3 text-sm text-green-700 font-medium hover:text-green-800 disabled:opacity-50"
              >
                Disable notifications
              </button>
            </div>
          </div>
        </div>
      ) : permission === 'denied' ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">
                Notifications blocked
              </p>
              <p className="text-sm text-red-700 mt-1">
                You've blocked notifications. To enable them, update your browser settings and refresh the page.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={requestPermission}
          disabled={loading}
          className="w-full flex items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-red-700 hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <Bell className="w-6 h-6 text-red-700" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-gray-900">Enable Push Notifications</p>
            <p className="text-sm text-gray-600">
              Get real-time updates about your bookings
            </p>
          </div>
        </button>
      )}
    </div>
  );
}

// Test notification function
export async function sendTestNotification() {
  if (Notification.permission === 'granted') {
    new Notification('JustMechanic', {
      body: 'Your mechanic is on the way! ETA: 15 minutes',
      icon: '/icon-192.png',
      badge: '/icon-72.png',
      tag: 'test-notification',
      requireInteraction: false,
      vibrate: [200, 100, 200],
    });
  }
}

// Notification helper functions for common events
export const NotificationTemplates = {
  mechanicAssigned: (mechanicName: string) => ({
    title: 'Mechanic Assigned',
    body: `${mechanicName} has been assigned to your request`,
    icon: '/icon-192.png',
  }),
  
  mechanicEnRoute: (mechanicName: string, eta: string) => ({
    title: 'Mechanic En Route',
    body: `${mechanicName} is on the way. ETA: ${eta}`,
    icon: '/icon-192.png',
  }),
  
  mechanicArrived: (mechanicName: string) => ({
    title: 'Mechanic Arrived',
    body: `${mechanicName} has arrived at your location`,
    icon: '/icon-192.png',
  }),
  
  serviceComplete: (service: string) => ({
    title: 'Service Complete',
    body: `Your ${service} service is complete. Please rate your experience.`,
    icon: '/icon-192.png',
  }),
  
  paymentReceived: (amount: number) => ({
    title: 'Payment Received',
    body: `Payment of R${amount.toFixed(2)} has been processed successfully`,
    icon: '/icon-192.png',
  }),
  
  newMessage: (senderName: string) => ({
    title: 'New Message',
    body: `${senderName} sent you a message`,
    icon: '/icon-192.png',
  }),
};
