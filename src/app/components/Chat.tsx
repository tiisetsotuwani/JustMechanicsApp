import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { api } from '../../utils/api';
import type { ChatMessage } from '../../shared/types';

interface ChatProps {
  bookingId: string;
  currentUserId: string;
  onBack: () => void;
}

export function Chat({ bookingId, currentUserId, onBack }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await api.chat.getMessages(bookingId);
        setMessages(response.messages || []);
        setError('');
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load messages');
      }
    };

    void loadMessages();
    const interval = window.setInterval(() => {
      void loadMessages();
    }, 3000);
    return () => window.clearInterval(interval);
  }, [bookingId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!draft.trim()) {
      return;
    }

    try {
      await api.chat.send(bookingId, draft.trim());
      setDraft('');
      const response = await api.chat.getMessages(bookingId);
      setMessages(response.messages || []);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Failed to send message');
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-5">
        <button onClick={onBack} className="flex items-center gap-2 mb-4">
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold">Booking Chat</h1>
      </div>

      {error && <div className="m-4 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">{error}</div>}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((message) => {
          const isMine = message.senderId === currentUserId;
          return (
            <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  isMine ? 'bg-red-700 text-white rounded-br-sm' : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-2 ${isMine ? 'text-red-100' : 'text-gray-500'}`}>
                  {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {message.read ? ' • Read' : ''}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="bg-white border-t border-gray-200 px-4 py-4 flex gap-3">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type a message"
          className="flex-1 border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-700"
        />
        <button
          onClick={() => void handleSend()}
          className="bg-red-700 text-white rounded-xl px-4 py-3 font-semibold hover:bg-red-800 transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
