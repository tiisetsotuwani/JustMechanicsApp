import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { api } from '../../utils/api';
import type { Booking, Dispute } from '../../shared/types';

interface DisputesProps {
  booking: Booking | null;
  onBack: () => void;
}

export function Disputes({ booking, onBack }: DisputesProps) {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [type, setType] = useState('quality');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const response = await api.disputes.getMyDisputes();
      setDisputes(response.disputes || []);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load disputes');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async () => {
    if (!booking) {
      setError('Select a booking before creating a dispute.');
      return;
    }

    try {
      await api.disputes.create(booking.id, type, description);
      setDescription('');
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create dispute');
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-6">
        <button onClick={onBack} className="flex items-center gap-2 mb-6">
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold">Disputes</h1>
      </div>

      <div className="px-6 py-6 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{error}</div>}

        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900">Open a dispute</h2>
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3"
          >
            <option value="quality">Quality</option>
            <option value="overcharge">Overcharge</option>
            <option value="no_show">No show</option>
            <option value="damage">Damage</option>
            <option value="incomplete">Incomplete</option>
            <option value="other">Other</option>
          </select>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the issue"
            rows={4}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 resize-none"
          />
          <button
            onClick={() => void handleCreate()}
            className="bg-red-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-800 transition-colors"
          >
            Submit Dispute
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">My disputes</h2>
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <div key={dispute.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900 capitalize">{dispute.type.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-600">{dispute.description}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-medium">
                    {dispute.status}
                  </span>
                </div>
              </div>
            ))}
            {disputes.length === 0 && <p className="text-sm text-gray-500">No disputes on file.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
