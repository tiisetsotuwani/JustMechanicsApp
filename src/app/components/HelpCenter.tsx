import { ArrowLeft, Search, MessageCircle, Phone, Mail, Book, FileText, HelpCircle, ChevronRight } from 'lucide-react';

interface HelpCenterProps {
  onBack: () => void;
}

export function HelpCenter({ onBack }: HelpCenterProps) {
  const faqCategories = [
    {
      title: 'Getting Started',
      icon: Book,
      questions: [
        'How do I request a mechanic?',
        'How do I create an account?',
        'What services are available?',
      ]
    },
    {
      title: 'Payments & Pricing',
      icon: FileText,
      questions: [
        'What payment methods are accepted?',
        'How is pricing determined?',
        'Can I get a receipt?',
      ]
    },
    {
      title: 'Service Issues',
      icon: HelpCircle,
      questions: [
        'What if I need to cancel?',
        'How do I report a problem?',
        'Can I reschedule a service?',
      ]
    }
  ];

  const contactOptions = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our support team',
      action: 'Start Chat',
      color: 'bg-blue-100 text-blue-700'
    },
    {
      icon: Phone,
      title: 'Call Us',
      description: '+27 (0) 800 123 4567',
      action: 'Call Now',
      color: 'bg-green-100 text-green-700'
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'support@justmechanic.com',
      action: 'Send Email',
      color: 'bg-red-100 text-red-700'
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
                    <button className="text-red-700 font-medium hover:text-red-800">
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
            {faqCategories.map((category) => {
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
                    {category.questions.map((question, index) => (
                      <button
                        key={index}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                      >
                        <span className="text-gray-700">{question}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <span className="text-gray-700">Terms of Service</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <span className="text-gray-700">Privacy Policy</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <span className="text-gray-700">Community Guidelines</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
