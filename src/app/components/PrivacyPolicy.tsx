import { ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-8">
        <button onClick={onBack} className="flex items-center gap-2 mb-4">
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </button>
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="text-red-100 mt-2">Last updated: March 5, 2026</p>
      </div>

      <div className="px-6 py-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              JustMechanic collects information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Name, email address, and phone number</li>
              <li>Vehicle information (make, model, year, license plate)</li>
              <li>Service addresses and location data</li>
              <li>Payment information (processed securely)</li>
              <li>Service history and preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Connect you with qualified mechanics and service providers</li>
              <li>Process payments and send transaction notifications</li>
              <li>Send you service updates, promotional materials, and other information</li>
              <li>Respond to your comments, questions, and customer service requests</li>
              <li>Monitor and analyze trends, usage, and activities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Information Sharing</h2>
            <p className="text-gray-700 leading-relaxed">
              We may share your information with:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-3">
              <li>Service providers who need access to perform services on our behalf</li>
              <li>Mechanics and auto service professionals you request services from</li>
              <li>Payment processors to facilitate transactions</li>
              <li>Law enforcement when required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              We take reasonable measures to protect your personal information from unauthorized access, 
              use, or disclosure. However, no internet transmission is ever fully secure or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              You have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Access and update your personal information</li>
              <li>Request deletion of your account and data</li>
              <li>Opt-out of promotional communications</li>
              <li>Request a copy of your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Location Data</h2>
            <p className="text-gray-700 leading-relaxed">
              We collect and use location data to connect you with nearby mechanics and provide 
              real-time tracking of service providers. You can disable location services in your 
              device settings, though this may limit app functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              JustMechanic is not intended for use by children under 18 years of age. We do not 
              knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any 
              changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <div className="mt-3 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">Email: privacy@justmechanic.com</p>
              <p className="text-gray-700">Phone: +27 (0) 800 123 4567</p>
              <p className="text-gray-700">Address: Cape Town, South Africa</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
