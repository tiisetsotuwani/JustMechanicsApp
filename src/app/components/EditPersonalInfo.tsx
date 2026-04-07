import { useRef, useState } from 'react';
import { ArrowLeft, User, Mail, Phone, MapPin, Save } from 'lucide-react';
import { api } from '../../utils/api';
import type { UserProfile } from '../../shared/types';

interface EditPersonalInfoProps {
  userProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onBack: () => void;
}

export function EditPersonalInfo({ userProfile, onSave, onBack }: EditPersonalInfoProps) {
  const [formData, setFormData] = useState<UserProfile>(userProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      await api.profile.update({
        name: formData.name,
        phone: formData.phone,
        profileImage: formData.profileImage,
      });
      onSave(formData);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save profile changes.');
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

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploadingPhoto(true);
    setError('');

    try {
      const uploadResult = await api.storage.upload(file, 'profile-images');
      const profileImage = String(uploadResult.url || uploadResult.path || '');

      if (!profileImage) {
        throw new Error('Upload did not return an image URL.');
      }

      await api.profile.update({ profileImage });
      setFormData((prev) => ({ ...prev, profileImage }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload profile photo.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setIsUploadingPhoto(false);
    }
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{error}</div>}

          {/* Profile Picture */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-red-700 to-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {formData.profileImage ? (
                  <img src={formData.profileImage} alt={formData.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  formData.name.charAt(0)
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 mb-1">Profile Picture</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-red-700 hover:text-red-800 font-medium"
                >
                  {isUploadingPhoto ? 'Uploading...' : 'Change Photo'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void handlePhotoChange(e)}
                />
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
