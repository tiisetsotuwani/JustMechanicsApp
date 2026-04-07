import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bot, Send, Sparkles, User } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface AIChatBotProps {
  onBack: () => void;
  userType: 'customer' | 'provider';
}

export function AIChatBot({ onBack, userType }: AIChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text:
        userType === 'customer'
          ? "Hi! I'm your JustMechanic AI assistant. I can help you with booking services, finding mechanics, pricing information, and answering questions about the platform. How can I assist you today?"
          : "Hello! I'm your JustMechanic AI assistant for service providers. I can help you with managing bookings, customer requests, pricing guidance, and platform features. What would you like to know?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const responseTimerRef = useRef<number | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      if (responseTimerRef.current) {
        window.clearTimeout(responseTimerRef.current);
      }
    };
  }, []);

  const quickReplies =
    userType === 'customer'
      ? [
          'How do I book a service?',
          'What services do you offer?',
          'How much does an oil change cost?',
          'Can I track my mechanic?',
          'What payment methods do you accept?',
          'How do I cancel a booking?',
        ]
      : [
          'How do I accept a job?',
          'What are the service fees?',
          'How do I get paid?',
          'How to update my availability?',
          'Customer rating system',
          'What tools do I need?',
        ];

  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (userType === 'customer') {
      if (lowerMessage.includes('book') || lowerMessage.includes('request')) {
        return "To book a service:\n\n1. Tap 'Request Mechanic' from your dashboard\n2. Select the service you need\n3. Enter your vehicle details\n4. Provide your location\n5. Add any additional details\n6. Submit your request\n\nA qualified mechanic will be assigned to you within minutes.";
      }

      if (lowerMessage.includes('service') && lowerMessage.includes('offer')) {
        return "We offer a wide range of automotive services:\n\n- Oil Changes\n- Battery Service\n- Tire Service\n- Brake Repair\n- Engine Diagnostics\n- AC Service\n- Transmission Service\n- General Maintenance\n\nAll services include certified mechanics, mobile service at your location, and a 90-day guarantee.";
      }

      if (lowerMessage.includes('oil change') && lowerMessage.includes('cost')) {
        return "Our oil change service starts at a base rate and includes:\n\n- Quality motor oil\n- Oil filter replacement\n- Fluid level check\n- Tire pressure check\n- Multi-point inspection\n\nThe exact price depends on your vehicle type and oil requirements. You'll receive a quote before confirming your booking.";
      }

      if (lowerMessage.includes('track')) {
        return "Yes. You can track your mechanic in real time:\n\n1. Go to your dashboard\n2. Tap 'Track Mechanic'\n3. View the mechanic's location on the map\n4. Check the estimated arrival time\n5. Call or message the mechanic directly";
      }

      if (lowerMessage.includes('payment')) {
        return "We support multiple payment methods:\n\n- Card payments\n- EFT or bank transfer\n- Cash, depending on the booking\n\nYou'll receive a detailed invoice after the service is completed.";
      }

      if (lowerMessage.includes('cancel')) {
        return "To cancel a booking:\n\n1. Go to 'My Bookings'\n2. Select the booking you want to cancel\n3. Tap 'Cancel Booking'\n4. Confirm the cancellation\n\nAny cancellation charges depend on how close the mechanic is to the job.";
      }
    }

    if (userType === 'provider') {
      if (lowerMessage.includes('accept') || lowerMessage.includes('job')) {
        return "To accept a job:\n\n1. Review the pending request on your dashboard\n2. Check the service, location, and customer details\n3. Tap 'Accept'\n4. Contact the customer if needed\n5. Head to the service location";
      }

      if (lowerMessage.includes('fee') || lowerMessage.includes('commission')) {
        return "Our service fee structure:\n\n- Platform fee: 15% of the service cost\n- You keep the remaining payout\n- No hidden charges\n- Earnings are visible from the provider dashboard";
      }

      if (lowerMessage.includes('paid') || lowerMessage.includes('payment')) {
        return "Provider payments are tracked through the platform:\n\n- Payment status is attached to each booking\n- You can review completed payments in your dashboard\n- Non-cash payments may need confirmation before completion";
      }

      if (lowerMessage.includes('availability') || lowerMessage.includes('online')) {
        return "To update your availability:\n\n1. Open the provider dashboard\n2. Toggle your online status\n3. Adjust your service radius if needed\n4. Save the update so new jobs can be matched correctly";
      }

      if (lowerMessage.includes('rating') || lowerMessage.includes('review')) {
        return "Customer ratings affect provider visibility. Focus on:\n\n- Arriving on time\n- Clear communication\n- Accurate diagnostics\n- Quality work\n- Fair pricing";
      }

      if (lowerMessage.includes('tool') || lowerMessage.includes('equipment')) {
        return "Recommended tools depend on your services, but most providers should carry:\n\n- Socket and wrench sets\n- Screwdrivers and pliers\n- A jack and stands\n- Basic diagnostic tools\n- Common fluids and consumables";
      }
    }

    if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return "I can help with bookings, pricing, tracking, payments, and platform questions. If you need direct support, use the in-app help options from your profile or help screen.";
    }

    if (lowerMessage.includes('hour') || lowerMessage.includes('available')) {
      return 'Service availability depends on active providers in your area, but the app is designed to support on-demand requests throughout the day.';
    }

    return (
      "I'd be happy to help with that. Here are some things I can assist you with:\n\n" +
      (userType === 'customer'
        ? '- Booking services\n- Service pricing\n- Tracking mechanics\n- Payment methods\n- Cancellation guidance'
        : '- Accepting jobs\n- Earnings and fees\n- Payment status\n- Managing availability\n- Provider guidance') +
      '\n\nPlease share a bit more detail about what you need.'
    );
  };

  const sendMessage = (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) {
      return;
    }

    const userMessage: Message = {
      id: `${Date.now()}`,
      text: trimmedText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    if (responseTimerRef.current) {
      window.clearTimeout(responseTimerRef.current);
    }

    responseTimerRef.current = window.setTimeout(() => {
      const botResponse: Message = {
        id: `${Date.now()}-bot`,
        text: getAIResponse(trimmedText),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
      responseTimerRef.current = null;
    }, 1000);
  };

  const handleSend = () => {
    sendMessage(inputText);
  };

  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  return (
    <div className="min-h-screen bg-stone-100 pb-20 flex flex-col">
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-6 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-2 mb-6">
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
            <Bot className="w-7 h-7 text-red-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              AI Assistant
              <Sparkles className="w-5 h-5" />
            </h1>
            <p className="text-red-100 text-sm">Always here to help</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex gap-3 max-w-[80%] ${
                  message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === 'user'
                      ? 'bg-red-700 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {message.sender === 'user' ? (
                    <User className="w-5 h-5" />
                  ) : (
                    <Bot className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-red-700 text-white rounded-tr-none'
                        : 'bg-white text-gray-900 rounded-tl-none shadow-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line leading-relaxed">{message.text}</p>
                  </div>
                  <p
                    className={`text-xs text-gray-500 mt-1 ${
                      message.sender === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <Bot className="w-5 h-5 text-gray-700" />
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
              <div className="flex gap-1">
                <motion.div
                  className="w-2 h-2 bg-gray-400 rounded-full"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-2 h-2 bg-gray-400 rounded-full"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-2 h-2 bg-gray-400 rounded-full"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {messages.length <= 2 && !isTyping && (
        <div className="px-6 pb-4 flex-shrink-0">
          <p className="text-sm text-gray-600 mb-3">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickReplies.slice(0, 4).map((reply) => (
              <button
                key={reply}
                onClick={() => handleQuickReply(reply)}
                className="px-4 py-2 bg-white text-gray-700 text-sm rounded-full border border-gray-300 hover:border-red-700 hover:text-red-700 transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleSend();
              }
            }}
            placeholder="Ask me anything..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
          />
          <button
            type="button"
            aria-label="Send message"
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="bg-red-700 text-white p-3 rounded-xl hover:bg-red-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
