import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { api } from '../../utils/api';

interface RatingModalProps {
  bookingId: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export function RatingModal({ bookingId, onClose, onSubmitted }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Select a rating before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      await api.bookings.rate(bookingId, rating, review);
      onSubmitted();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Rate Your Mechanic</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((value) => (
            <button key={value} onClick={() => setRating(value)}>
              <Star
                className={`w-10 h-10 ${
                  value <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>

        <textarea
          value={review}
          onChange={(event) => setReview(event.target.value)}
          placeholder="Share a short review"
          rows={4}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-700 resize-none"
        />

        {error && <p className="text-sm text-red-700 mt-3">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 rounded-xl py-3 font-semibold text-gray-700"
          >
            Later
          </button>
          <button
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="flex-1 bg-red-700 text-white rounded-xl py-3 font-semibold hover:bg-red-800 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
