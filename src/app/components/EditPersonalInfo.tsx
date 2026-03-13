import { useState } from 'react';
import { ArrowLeft, User, Mail, Phone, MapPin, Save } from 'lucide-react';
import type { UserProfile } from '../App';
import { api } from '../../utils/api';

interface EditPersonalInfoProps {
  userProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onBack: () => void;
}

export function EditPersonalInfo({ userProfile, onSave, onBack }: EditPersonalInfoProps) {
  const [formData, setFormData] = useState<UserProfile>(userProfile);
  const [isSaving, setIsSaving] = useState(false);

  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    try {
      await api.profile.update({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
      });
      onSave(formData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save to server. Changes saved locally.';
      setSaveError(message);
      // Save locally even if API fails
      onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof UserProfile, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-6">
        <button onClick={onBack} className="flex items-center gap-2 mb-6">
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold">Personal Information</h1>
        <p className="text-red-100 mt-2">Update your profile details</p>
      </div>

      <div className="px-6 py-6">
        {saveError && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl mb-4 text-sm">
            {saveError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-red-700 to-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {formData.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 mb-1">Profile Picture</p>
                <button
                  type="button"
                  className="text-sm text-red-700 hover:text-red-800 font-medium"
                >
                  Change Photo
                </button>
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <label className="flex items-center gap-2 text-gray-900 font-semibold mb-4">
              <User className="w-5 h-5 text-red-700" />
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
              required
            />
          </div>

          {/* Email */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <label className="flex items-center gap-2 text-gray-900 font-semibold mb-4">
              <Mail className="w-5 h-5 text-red-700" />
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
              required
            />
          </div>

          {/* Phone Number */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <label className="flex items-center gap-2 text-gray-900 font-semibold mb-4">
              <Phone className="w-5 h-5 text-red-700" />
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
              required
            />
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <label className="flex items-center gap-2 text-gray-900 font-semibold mb-4">
              <MapPin className="w-5 h-5 text-red-700" />
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Enter your address"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-gray-100 text-gray-900 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-red-700 text-white py-4 rounded-xl font-semibold hover:bg-red-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
