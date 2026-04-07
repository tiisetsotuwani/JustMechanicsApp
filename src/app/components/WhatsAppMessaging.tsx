import { MessageCircle, Phone, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

interface WhatsAppMessagingProps {
  phoneNumber: string;
  userName: string;
  bookingId: string;
  service: string;
}

export function WhatsAppMessaging({ phoneNumber, userName, bookingId, service }: WhatsAppMessagingProps) {
  // Format phone number for WhatsApp (remove non-digits and add country code if needed)
  const formatPhoneForWhatsApp = (phone: string): string => {
    let cleaned = phone.replace(/\D/g, '');
    
    // If doesn't start with country code, assume South Africa (+27)
    if (!cleaned.startsWith('27') && cleaned.length === 10) {
      cleaned = '27' + cleaned.substring(1); // Remove leading 0 and add +27
    }
    
    return cleaned;
  };

  const formattedPhone = formatPhoneForWhatsApp(phoneNumber);

  // Predefined message templates
  const messageTemplates = [
    {
      id: 'eta',
      label: 'Ask for ETA',
      text: `Hi! I'm checking on the status of my booking #${bookingId} for ${service}. What's your estimated arrival time?`,
      icon: '⏰',
    },
    {
      id: 'location',
      label: 'Share Location',
      text: `Hi! Here's my exact location for booking #${bookingId}. Let me know if you need any help finding me.`,
      icon: '📍',
    },
    {
      id: 'delay',
      label: 'Notify Delay',
      text: `Hi! I'm running a few minutes late for booking #${bookingId}. I'll be there as soon as possible. Thanks for your patience!`,
      icon: '⏱️',
    },
    {
      id: 'question',
      label: 'Ask Question',
      text: `Hi! I have a question about my ${service} service (Booking #${bookingId}). `,
      icon: '❓',
    },
    {
      id: 'cancel',
      label: 'Request Cancellation',
      text: `Hi, I need to cancel my booking #${bookingId} for ${service}. Please let me know the cancellation process.`,
      icon: '❌',
    },
  ];

  const openWhatsApp = (message?: string) => {
    const defaultMessage = `Hi ${userName}! I'm contacting you about booking #${bookingId} for ${service}.`;
    const text = encodeURIComponent(message || defaultMessage);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${text}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const makeCall = () => {
    window.location.href = `tel:+${formattedPhone}`;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-green-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Contact via WhatsApp</h3>
          <p className="text-sm text-gray-600">Quick message templates</p>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => openWhatsApp()}
          className="flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-md"
        >
          <MessageCircle className="w-5 h-5" />
          Open Chat
        </button>
        <button
          onClick={makeCall}
          className="flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md"
        >
          <Phone className="w-5 h-5" />
          Call Now
        </button>
      </div>

      {/* Message Templates */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 mb-3">Quick Messages:</p>
        {messageTemplates.map((template) => (
          <motion.button
            key={template.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openWhatsApp(template.text)}
            className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
          >
            <span className="text-2xl">{template.icon}</span>
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">{template.label}</p>
              <p className="text-xs text-gray-500 line-clamp-1">{template.text}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </motion.button>
        ))}
      </div>

      {/* WhatsApp Info */}
      <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs">✓</span>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">End-to-End Encrypted:</span> Your messages are secure and private on WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick WhatsApp Button Component (for floating action button)
interface WhatsAppQuickButtonProps {
  phoneNumber: string;
  bookingId: string;
  className?: string;
}

export function WhatsAppQuickButton({ phoneNumber, bookingId, className = '' }: WhatsAppQuickButtonProps) {
  const formatPhoneForWhatsApp = (phone: string): string => {
    let cleaned = phone.replace(/\D/g, '');
    if (!cleaned.startsWith('27') && cleaned.length === 10) {
      cleaned = '27' + cleaned.substring(1);
    }
    return cleaned;
  };

  const openWhatsApp = () => {
    const formattedPhone = formatPhoneForWhatsApp(phoneNumber);
    const message = encodeURIComponent(`Hi! Regarding booking #${bookingId}`);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={openWhatsApp}
      className={`w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group ${className}`}
    >
      <MessageCircle className="w-7 h-7" />
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
    </motion.button>
  );
}
