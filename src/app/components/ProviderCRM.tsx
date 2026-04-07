import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MessageCircle, Plus, Users } from 'lucide-react';
import { api } from '../../utils/api';

interface ProviderCRMProps {
  onBack: () => void;
}

interface CrmCustomer {
  customerId: string;
  name: string;
  email: string;
  phone: string;
  totalJobs: number;
  totalSpent: number;
  lastServiceAt: string | null;
}

interface CrmNote {
  id: string;
  text: string;
  tag: string;
  createdAt: string;
}

export function ProviderCRM({ onBack }: ProviderCRMProps) {
  const [customers, setCustomers] = useState<CrmCustomer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [notes, setNotes] = useState<CrmNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderDueAt, setNewReminderDueAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.customerId === selectedCustomerId) || null,
    [customers, selectedCustomerId],
  );

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.crm.getCustomers();
      const nextCustomers = (response.customers || []) as CrmCustomer[];
      setCustomers(nextCustomers);
      if (!selectedCustomerId && nextCustomers.length > 0) {
        setSelectedCustomerId(nextCustomers[0].customerId);
      }
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load CRM customers');
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async (customerId: string) => {
    try {
      const response = await api.crm.getCustomerNotes(customerId);
      setNotes((response.notes || []) as CrmNote[]);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load customer notes');
    }
  };

  useEffect(() => {
    void loadCustomers();
  }, []);

  useEffect(() => {
    if (!selectedCustomerId) {
      setNotes([]);
      return;
    }
    void loadNotes(selectedCustomerId);
  }, [selectedCustomerId]);

  const handleAddNote = async () => {
    if (!selectedCustomerId || !newNote.trim()) {
      return;
    }
    try {
      await api.crm.addCustomerNote(selectedCustomerId, newNote.trim(), 'follow_up');
      setNewNote('');
      await loadNotes(selectedCustomerId);
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : 'Failed to add note');
    }
  };

  const handleCreateReminder = async () => {
    if (!selectedCustomerId || !newReminderTitle.trim() || !newReminderDueAt) {
      return;
    }

    try {
      await api.crm.createReminder({
        customerId: selectedCustomerId,
        title: newReminderTitle.trim(),
        dueAt: newReminderDueAt,
        channel: 'whatsapp',
      });
      setNewReminderTitle('');
      setNewReminderDueAt('');
      setError('');
    } catch (reminderError) {
      setError(reminderError instanceof Error ? reminderError.message : 'Failed to create reminder');
    }
  };

  const openWhatsApp = () => {
    if (!selectedCustomer?.phone) {
      setError('Selected customer has no phone number for WhatsApp');
      return;
    }
    const phone = selectedCustomer.phone.replace(/[^\d]/g, '');
    if (!phone) {
      setError('Invalid customer phone number for WhatsApp');
      return;
    }
    const text = encodeURIComponent('Hi, this is your JustMechanic provider. Quick follow-up on your vehicle service.');
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-6">
        <button onClick={onBack} className="flex items-center gap-2 mb-6">
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold">Provider CRM</h1>
        <p className="text-red-100 mt-2">Manage customers, notes, and follow-ups</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{error}</div>}

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-red-700" />
            <h2 className="font-semibold text-gray-900">Customers</h2>
          </div>
          <select
            value={selectedCustomerId}
            onChange={(event) => setSelectedCustomerId(event.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3"
          >
            {customers.map((customer) => (
              <option key={customer.customerId} value={customer.customerId}>
                {customer.name} - {customer.totalJobs} jobs
              </option>
            ))}
            {!loading && customers.length === 0 && <option value="">No customers yet</option>}
          </select>
          {selectedCustomer && (
            <div className="mt-4 bg-stone-50 rounded-xl p-4 text-sm text-gray-700">
              <p><span className="font-semibold">Email:</span> {selectedCustomer.email || 'Not provided'}</p>
              <p><span className="font-semibold">Phone:</span> {selectedCustomer.phone || 'Not provided'}</p>
              <p><span className="font-semibold">Total spent:</span> R{selectedCustomer.totalSpent.toFixed(2)}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Customer Notes</h2>
          <div className="space-y-3 mb-4">
            {notes.map((note) => (
              <div key={note.id} className="border border-gray-200 rounded-xl p-3">
                <p className="text-sm text-gray-900">{note.text}</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(note.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {notes.length === 0 && <p className="text-sm text-gray-500">No notes yet for this customer.</p>}
          </div>
          <div className="flex gap-3">
            <input
              value={newNote}
              onChange={(event) => setNewNote(event.target.value)}
              placeholder="Add note for this customer"
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3"
            />
            <button
              onClick={() => void handleAddNote()}
              className="bg-red-700 text-white px-4 rounded-xl hover:bg-red-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900">WhatsApp Follow-up</h2>
          <button
            onClick={openWhatsApp}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            Open WhatsApp Chat
          </button>
          <input
            value={newReminderTitle}
            onChange={(event) => setNewReminderTitle(event.target.value)}
            placeholder="Reminder title"
            className="w-full border border-gray-300 rounded-xl px-4 py-3"
          />
          <input
            type="datetime-local"
            value={newReminderDueAt}
            onChange={(event) => setNewReminderDueAt(event.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3"
          />
          <button
            onClick={() => void handleCreateReminder()}
            className="w-full bg-red-700 text-white py-3 rounded-xl font-semibold hover:bg-red-800 transition-colors"
          >
            Schedule WhatsApp Reminder
          </button>
        </div>
      </div>
    </div>
  );
}
