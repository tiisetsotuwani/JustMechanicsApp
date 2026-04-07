import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Bot, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
      text: userType === 'customer' 
        ? "Hi! I'm your JustMechanic AI assistant. I can help you with booking services, finding mechanics, pricing information, and answering any questions about our platform. How can I assist you today?"
        : "Hello! I'm your JustMechanic AI assistant for service providers. I can help you with managing bookings, understanding customer requests, pricing guidelines, and platform features. What would you like to know?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const quickReplies = userType === 'customer' 
    ? [
        "How do I book a service?",
        "What services do you offer?",
        "How much does an oil change cost?",
        "Can I track my mechanic?",
        "What payment methods do you accept?",
        "How do I cancel a booking?",
      ]
    : [
        "How do I accept a job?",
        "What are the service fees?",
        "How do I get paid?",
        "How to update my availability?",
        "Customer rating system",
        "What tools do I need?",
      ];

  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Customer responses
    if (userType === 'customer') {
      if (lowerMessage.includes('book') || lowerMessage.includes('request')) {
        return "To book a service:\n\n1. Tap 'Request Mechanic' from your dashboard\n2. Select the service you need\n3. Enter your vehicle details\n4. Provide your location\n5. Add any additional details\n6. Submit your request\n\nA qualified mechanic will be assigned to you within minutes!";
      }
      
      if (lowerMessage.includes('service') && lowerMessage.includes('offer')) {
        return "We offer a wide range of automotive services:\n\n• Oil Changes - From $49.99\n• Battery Service - From $89.99\n• Tire Service - From $79.99\n• Brake Repair - From $149.99\n• Engine Diagnostics - From $69.99\n• AC Service - From $99.99\n• Transmission Service - From $129.99\n• Full Service - From $249.99\n\nAll services include certified mechanics, mobile service at your location, and a 90-day guarantee!";
      }

      if (lowerMessage.includes('oil change') && lowerMessage.includes('cost')) {
        return "Our oil change service starts at $49.99. This includes:\n\n• Up to 5 quarts of quality motor oil\n• Oil filter replacement\n• Fluid level check\n• Tire pressure check\n• Multi-point inspection\n\nThe price may vary based on your vehicle type and oil requirements. You'll receive an exact quote before confirming your booking.";
      }

      if (lowerMessage.includes('track')) {
        return "Yes! You can track your mechanic in real-time:\n\n1. Go to your dashboard\n2. Tap 'Track Mechanic'\n3. See your mechanic's location on the map\n4. View estimated arrival time\n5. Call or message your mechanic directly\n\nYou'll receive notifications at each step: when accepted, on the way, and when arriving.";
      }

      if (lowerMessage.includes('payment')) {
        return "We accept multiple payment methods:\n\n• Credit/Debit Cards (Visa, Mastercard, Amex)\n• Digital Wallets (Apple Pay, Google Pay)\n• Direct Bank Transfer\n\nPayment is processed after service completion. You'll receive a detailed invoice and can save your payment methods for future bookings.";
      }

      if (lowerMessage.includes('cancel')) {
        return "To cancel a booking:\n\n1. Go to 'My Bookings'\n2. Select the booking you want to cancel\n3. Tap 'Cancel Booking'\n4. Confirm cancellation\n\nCancellation policy:\n• Free cancellation up to 2 hours before service\n• 50% charge for cancellations within 2 hours\n• Full charge if mechanic is already on the way\n\nYou'll receive a confirmation email after cancellation.";
      }

      if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent')) {
        return "For emergency or urgent services:\n\n1. Use the 'Request Mechanic' feature\n2. Mark your request as 'Urgent'\n3. We'll prioritize finding the nearest available mechanic\n4. Average response time: 15-30 minutes\n\nFor roadside emergencies like flat tires or dead batteries, we offer expedited service. Emergency service fees may apply.";
      }

      if (lowerMessage.includes('warranty') || lowerMessage.includes('guarantee')) {
        return "All our services come with a 90-day warranty:\n\n• Parts and labor covered\n• Free re-service if issues arise\n• Satisfaction guaranteed\n• Quality assurance on all work\n\nIf you experience any issues with a completed service, contact us immediately through the app and we'll make it right!";
      }
    }

    // Provider responses
    if (userType === 'provider') {
      if (lowerMessage.includes('accept') || lowerMessage.includes('job')) {
        return "To accept a job:\n\n1. Check the pending requests on your dashboard\n2. Review job details: service type, location, customer info\n3. Tap 'Accept' to confirm\n4. You'll receive customer contact info\n5. Navigate to the service location\n\nMake sure you have the necessary tools and parts for the job before accepting!";
      }

      if (lowerMessage.includes('fee') || lowerMessage.includes('commission')) {
        return "Our service fee structure:\n\n• Platform Fee: 15% of service cost\n• You keep 85% of the total payment\n• No hidden charges\n• Weekly direct deposit payments\n\nExample: $100 service = $85 to you, $15 platform fee\n\nHigher volume providers can qualify for reduced fees (12% for 50+ jobs/month).";
      }

      if (lowerMessage.includes('paid') || lowerMessage.includes('payment')) {
        return "Payment process for providers:\n\n• Customers pay through the app after service completion\n• Funds are held for 24 hours (quality assurance period)\n• Transferred to your account every Friday\n• Direct deposit to your registered bank account\n• View earnings in real-time on your dashboard\n\nYou can track all transactions in the 'Earnings' section.";
      }

      if (lowerMessage.includes('availability') || lowerMessage.includes('online')) {
        return "Managing your availability:\n\n1. Go to your Provider Dashboard\n2. Toggle 'Go Online' to start receiving requests\n3. Toggle 'Go Offline' when unavailable\n4. Set your service radius (miles)\n5. Block specific dates/times in Settings\n\nYou'll only receive requests when you're online and within your service area.";
      }

      if (lowerMessage.includes('rating') || lowerMessage.includes('review')) {
        return "Customer rating system:\n\n• Customers rate service 1-5 stars after completion\n• Reviews are posted to your profile\n• Ratings affect your job priority\n• 4.5+ stars = Priority provider status\n• Respond to reviews within 48 hours\n\nMaintain high ratings by:\n✓ Arriving on time\n✓ Professional service\n✓ Clear communication\n✓ Quality work\n✓ Fair pricing";
      }

      if (lowerMessage.includes('tool') || lowerMessage.includes('equipment')) {
        return "Recommended tools and equipment:\n\nBasic Kit:\n• Socket and wrench sets\n• Screwdrivers (flathead, Phillips)\n• Pliers and cutters\n• OBD-II scanner\n• Jack and jack stands\n• Basic fluids and supplies\n\nSpecialized (based on services):\n• Tire tools for tire services\n• Battery tester for electrical\n• AC manifold for AC service\n• Brake tools for brake jobs\n\nYou're responsible for bringing necessary tools to job sites.";
      }

      if (lowerMessage.includes('insurance') || lowerMessage.includes('license')) {
        return "Requirements for service providers:\n\n✓ Valid driver's license\n✓ Automotive technician certification (ASE preferred)\n✓ General liability insurance ($1M minimum)\n✓ Background check clearance\n✓ Valid business license (if applicable)\n\nWe verify all credentials during onboarding. Keep your certifications current and upload renewed documents to your profile.";
      }
    }

    // General responses
    if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return "I'm here to help! You can ask me about:\n\n• Booking and services\n• Pricing and payments\n• Tracking and locations\n• Account settings\n• Policies and guarantees\n\nFor urgent support, contact our team:\n📞 1-800-MECHANIC\n📧 support@justmechanic.com\n💬 Live chat (available 24/7)";
    }

    if (lowerMessage.includes('hour') || lowerMessage.includes('available')) {
      return "JustMechanic operates 24/7!\n\n• Request services anytime\n• Day and night service available\n• Weekend and holiday coverage\n• Emergency services always ready\n\nMechanic availability varies by location and time. Peak hours (8AM-6PM) typically have the most providers online.";
    }

    // Default response
    return "I'd be happy to help with that! Here are some things I can assist you with:\n\n" +
      (userType === 'customer' 
        ? "• Booking services\n• Service pricing\n• Tracking mechanics\n• Payment methods\n• Cancellation policy\n• General questions"
        : "• Accepting jobs\n• Earning structure\n• Payment schedule\n• Managing availability\n• Rating system\n• Provider requirements") +
      "\n\nCould you please provide more details about what you'd like to know?";
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getAIResponse(inputText),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleQuickReply = (reply: string) => {
    setInputText(reply);
    setTimeout(() => handleSend(), 100);
  };

  return (
    <div className="min-h-screen bg-stone-100 pb-20 flex flex-col">
      {/* Header */}
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

      {/* Messages */}
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
                {/* Avatar */}
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

                {/* Message Bubble */}
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

        {/* Typing Indicator */}
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

      {/* Quick Replies */}
      {messages.length <= 2 && !isTyping && (
        <div className="px-6 pb-4 flex-shrink-0">
          <p className="text-sm text-gray-600 mb-3">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickReplies.slice(0, 4).map((reply, index) => (
              <button
                key={index}
                onClick={() => handleQuickReply(reply)}
                className="px-4 py-2 bg-white text-gray-700 text-sm rounded-full border border-gray-300 hover:border-red-700 hover:text-red-700 transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
          />
          <button
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
