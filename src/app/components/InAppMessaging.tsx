import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Image, Paperclip, Phone, Video, MoreVertical, Check, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { projectId } from '/utils/supabase/info';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  read: boolean;
  image?: string;
  type: 'text' | 'image' | 'system';
}

interface InAppMessagingProps {
  bookingId: string;
  currentUserId: string;
  currentUserName: string;
  otherUserName: string;
  otherUserImage: string;
  accessToken: string;
  onBack: () => void;
}

export function InAppMessaging({
  bookingId,
  currentUserId,
  currentUserName,
  otherUserName,
  otherUserImage,
  accessToken,
  onBack
}: InAppMessagingProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages from backend
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-dd7ceef7/messages/${bookingId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.log('Using demo messages:', error);
        // Demo messages
        setMessages([
          {
            id: '1',
            senderId: 'other',
            senderName: otherUserName,
            text: 'Hi! I\'m on my way to your location.',
            timestamp: Date.now() - 600000,
            read: true,
            type: 'text',
          },
          {
            id: '2',
            senderId: currentUserId,
            senderName: currentUserName,
            text: 'Great! How long until you arrive?',
            timestamp: Date.now() - 540000,
            read: true,
            type: 'text',
          },
          {
            id: '3',
            senderId: 'other',
            senderName: otherUserName,
            text: 'About 15 minutes. Traffic is light.',
            timestamp: Date.now() - 480000,
            read: true,
            type: 'text',
          },
          {
            id: 'system-1',
            senderId: 'system',
            senderName: 'System',
            text: `${otherUserName} is now 2.3 km away`,
            timestamp: Date.now() - 120000,
            read: true,
            type: 'system',
          },
        ]);
      }
    };

    loadMessages();

    // Poll for new messages every 3 seconds (replace with WebSocket in production)
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [bookingId, accessToken, currentUserId, currentUserName, otherUserName]);

  // Mark messages as read
  useEffect(() => {
    const markAsRead = async () => {
      const unreadMessages = messages.filter(m => m.senderId !== currentUserId && !m.read);
      if (unreadMessages.length === 0) return;

      try {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-dd7ceef7/messages/read`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messageIds: unreadMessages.map(m => m.id),
            }),
          }
        );
      } catch (error) {
        console.log('Could not mark messages as read:', error);
      }
    };

    markAsRead();
  }, [messages, currentUserId, accessToken]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      senderId: currentUserId,
      senderName: currentUserName,
      text: messageText,
      timestamp: Date.now(),
      read: false,
      type: 'text',
    };

    // Optimistically add message
    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dd7ceef7/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId,
            text: messageText,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Replace temp message with real one
        setMessages(prev => prev.map(m => m.id === tempMessage.id ? data.message : m));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove demo fallback - show error instead
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      // TODO: Show error message to user
    } finally {
      setIsSending(false);
    }
  };

  // Simulate typing indicator
  useEffect(() => {
    if (newMessage) {
      const timeout = setTimeout(() => setIsTyping(false), 1000);
      return () => clearTimeout(timeout);
    }
  }, [newMessage]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-4 shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={onBack} className="flex items-center justify-center">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <img
            src={otherUserImage}
            alt={otherUserName}
            className="w-12 h-12 rounded-full object-cover border-2 border-white"
          />
          <div className="flex-1">
            <h1 className="text-lg font-bold">{otherUserName}</h1>
            <p className="text-sm text-red-100">
              {isTyping ? 'Typing...' : 'Active now'}
            </p>
          </div>
          <button className="w-10 h-10 flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        <AnimatePresence>
          {messages.map((message) => {
            const isOwn = message.senderId === currentUserId;
            const isSystem = message.type === 'system';

            if (isSystem) {
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center"
                >
                  <div className="bg-gray-200 text-gray-600 text-sm px-4 py-2 rounded-full max-w-xs text-center">
                    {message.text}
                  </div>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[75%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isOwn && (
                    <img
                      src={otherUserImage}
                      alt={otherUserName}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  )}
                  <div>
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        isOwn
                          ? 'bg-red-700 text-white rounded-br-sm'
                          : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
                      }`}
                    >
                      {message.image && (
                        <img
                          src={message.image}
                          alt="Shared image"
                          className="rounded-lg mb-2 max-w-full"
                        />
                      )}
                      <p className="text-sm leading-relaxed">{message.text}</p>
                    </div>
                    <div className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                      {isOwn && (
                        message.read ? (
                          <CheckCheck className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Check className="w-4 h-4 text-gray-400" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-red-700 transition-colors">
            <Image className="w-6 h-6" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-red-700 transition-colors">
            <Paperclip className="w-6 h-6" />
          </button>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="w-full px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-red-700 focus:bg-white transition-all"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              newMessage.trim() && !isSending
                ? 'bg-red-700 text-white hover:bg-red-800 shadow-lg'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            <Send className={`w-5 h-5 ${isSending ? 'animate-pulse' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
