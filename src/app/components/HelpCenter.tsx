import { useMemo, useState } from 'react';
import { ArrowLeft, Search, MessageCircle, Phone, Mail, Book, FileText, HelpCircle, ChevronRight } from 'lucide-react';
import type { Screen } from '../../shared/types';

interface HelpCenterProps {
  onBack: () => void;
  onNavigate: (screen: Screen) => void;
}

interface FaqQuestion {
  question: string;
  answer: string;
}

interface FaqCategory {
  title: string;
  icon: typeof Book;
  questions: FaqQuestion[];
}

export function HelpCenter({ onBack, onNavigate }: HelpCenterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState<FaqQuestion | null>(null);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const faqCategories = [
    {
      title: 'Getting Started',
      icon: Book,
      questions: [
        {
          question: 'How do I request a mechanic?',
          answer: 'Tap Home, choose your service and vehicle, then submit the request to dispatch nearby providers.',
        },
        {
          question: 'How do I create an account?',
          answer: 'Use the Sign Up tab on the login screen, choose Customer or Provider, then complete your details.',
        },
        {
          question: 'What services are available?',
          answer: 'Services include battery, tires, brakes, diagnostics, AC, oil changes, and general maintenance.',
        },
      ]
    },
    {
      title: 'Payments & Pricing',
      icon: FileText,
      questions: [
        {
          question: 'What payment methods are accepted?',
          answer: 'The app supports cash, EFT, and card workflows depending on your booking and provider setup.',
        },
        {
          question: 'How is pricing determined?',
          answer: 'Pricing combines service scope, labor, callout, and parts. Final totals are shown on booking and invoices.',
        },
        {
          question: 'Can I get a receipt?',
          answer: 'Yes. Completed jobs can generate an invoice/receipt in your payments and service history flows.',
        },
      ]
    },
    {
      title: 'Service Issues',
      icon: HelpCircle,
      questions: [
        {
          question: 'What if I need to cancel?',
          answer: 'Open the booking and choose cancel. If a provider is already assigned, cancellation details may apply.',
        },
        {
          question: 'How do I report a problem?',
          answer: 'Use Profile > Disputes to report quality, overcharge, no-show, damage, or incomplete service.',
        },
        {
          question: 'Can I reschedule a service?',
          answer: 'If the booking is still pending, cancel and rebook with the new preferred time and notes.',
        },
      ]
    }
  ] satisfies FaqCategory[];

  const filteredFaqCategories = useMemo(() => {
    if (!normalizedQuery) {
      return faqCategories;
    }

    return faqCategories
      .map((category) => {
        const categoryMatch = category.title.toLowerCase().includes(normalizedQuery);
        if (categoryMatch) {
          return category;
        }

        const matchingQuestions = category.questions.filter((item) =>
          item.question.toLowerCase().includes(normalizedQuery) ||
          item.answer.toLowerCase().includes(normalizedQuery),
        );

        return {
          ...category,
          questions: matchingQuestions,
        };
      })
      .filter((category) => category.questions.length > 0);
  }, [faqCategories, normalizedQuery]);

  const contactOptions = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our support team',
      action: 'Start Chat',
      color: 'bg-blue-100 text-blue-700',
      onClick: () => onNavigate('ai-chat'),
    },
    {
      icon: Phone,
      title: 'Call Us',
      description: '+27 (0) 800 123 4567',
      action: 'Call Now',
      color: 'bg-green-100 text-green-700',
      onClick: () => {
        window.location.href = 'tel:+278001234567';
      },
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'support@justmechanic.com',
      action: 'Send Email',
      color: 'bg-red-100 text-red-700',
      onClick: () => {
        window.location.href = 'mailto:support@justmechanic.com?subject=JustMechanic%20Support';
      },
    }
  ];

  const handlePlaceholder = (label: string) => {
    window.alert(`${label} page is coming soon.`);
  };

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-8">
        <button onClick={onBack} className="flex items-center gap-2 mb-4">
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </button>
        <h1 className="text-3xl font-bold mb-2">Help Center</h1>
        <p className="text-red-100">How can we help you today?</p>
      </div>

      <div className="px-6 -mt-4">
        {/* Search Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-lg mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
            />
          </div>
        </div>

        {/* Contact Options */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Support</h2>
          <div className="space-y-3">
            {contactOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div key={option.title} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${option.color} rounded-full flex items-center justify-center`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{option.title}</h3>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                    <button
                      onClick={option.onClick}
                      className="text-red-700 font-medium hover:text-red-800"
                    >
                      {option.action}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {filteredFaqCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.title} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Icon className="w-5 h-5 text-red-700" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{category.title}</h3>
                  </div>
                  <div className="space-y-2">
                    {category.questions.map((faq) => (
                      <button
                        key={faq.question}
                        onClick={() => setSelectedQuestion(faq)}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                      >
                        <span className="text-gray-700">{faq.question}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            {filteredFaqCategories.length === 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <p className="text-gray-700 font-medium">No matching help topics</p>
                <p className="text-sm text-gray-600 mt-1">Try a different search term or use one of the contact options above.</p>
              </div>
            )}
          </div>
        </div>

        {selectedQuestion && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">{selectedQuestion.question}</h3>
            <p className="text-gray-700">{selectedQuestion.answer}</p>
          </div>
        )}

        {/* Quick Links */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
          <div className="space-y-3">
            <button
              onClick={() => handlePlaceholder('Terms of Service')}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <span className="text-gray-700">Terms of Service</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => onNavigate('privacy')}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <span className="text-gray-700">Privacy Policy</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => handlePlaceholder('Community Guidelines')}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <span className="text-gray-700">Community Guidelines</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
