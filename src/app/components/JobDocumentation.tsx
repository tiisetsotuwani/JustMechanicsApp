import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Camera } from 'lucide-react';
import { api } from '../../utils/api';
import type { JobPhoto } from '../../shared/types';

interface JobDocumentationProps {
  bookingId: string;
  onBack: () => void;
}

export function JobDocumentation({ bookingId, onBack }: JobDocumentationProps) {
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [type, setType] = useState<'before' | 'during' | 'after' | 'issue'>('before');
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');

  const loadPhotos = async () => {
    try {
      const response = await api.bookings.getJobPhotos(bookingId);
      setPhotos(response.photos || []);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load photos');
    }
  };

  useEffect(() => {
    void loadPhotos();
  }, [bookingId]);

  const groupedPhotos = useMemo(
    () => ({
      before: photos.filter((photo) => photo.type === 'before'),
      during: photos.filter((photo) => photo.type === 'during'),
      after: photos.filter((photo) => photo.type === 'after'),
      issue: photos.filter((photo) => photo.type === 'issue'),
    }),
    [photos],
  );

  const handleUpload = async (file: File | null) => {
    if (!file) {
      return;
    }

    try {
      const uploadResponse = await api.storage.upload(file, 'job-photos');
      await api.bookings.addJobPhoto(bookingId, uploadResponse.url, type, caption);
      setCaption('');
      await loadPhotos();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload photo');
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-6">
        <button onClick={onBack} className="flex items-center gap-2 mb-6">
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold">Job Documentation</h1>
      </div>

      <div className="px-6 py-6 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{error}</div>}

        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900">Add photo</h2>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as 'before' | 'during' | 'after' | 'issue')}
            className="w-full border border-gray-300 rounded-xl px-4 py-3"
          >
            <option value="before">Before</option>
            <option value="during">During</option>
            <option value="after">After</option>
            <option value="issue">Issue</option>
          </select>
          <input
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Caption"
            className="w-full border border-gray-300 rounded-xl px-4 py-3"
          />
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-6 cursor-pointer hover:border-red-700 hover:text-red-700 transition-colors">
            <Camera className="w-5 h-5" />
            <span>Upload photo</span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(event) => void handleUpload(event.target.files?.[0] || null)}
            />
          </label>
        </div>

        {(['before', 'during', 'after', 'issue'] as const).map((group) => (
          <div key={group} className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4 capitalize">{group}</h2>
            <div className="grid grid-cols-2 gap-4">
              {groupedPhotos[group].map((photo) => (
                <div key={photo.id} className="overflow-hidden rounded-xl border border-gray-200">
                  <img src={photo.url} alt={photo.caption} className="w-full h-32 object-cover" />
                  <div className="p-3">
                    <p className="text-sm text-gray-900">{photo.caption || 'No caption'}</p>
                  </div>
                </div>
              ))}
              {groupedPhotos[group].length === 0 && <p className="text-sm text-gray-500">No {group} photos yet.</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
