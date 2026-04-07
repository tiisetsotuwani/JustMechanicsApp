import { useEffect, useState } from 'react';
import { ArrowLeft, Megaphone, Send, Share2 } from 'lucide-react';
import { api } from '../../utils/api';

interface ProviderMarketingProps {
  onBack: () => void;
}

interface SocialAccount {
  id: string;
  platform: string;
  accountName: string;
  status: string;
}

interface MarketingPost {
  id: string;
  text: string;
  status: string;
  scheduledAt: string | null;
  createdAt: string;
}

export function ProviderMarketing({ onBack }: ProviderMarketingProps) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<MarketingPost[]>([]);
  const [postText, setPostText] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [accountName, setAccountName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [accountsResponse, postsResponse] = await Promise.all([
        api.marketing.getAccounts(),
        api.marketing.getPosts(),
      ]);
      setAccounts((accountsResponse.accounts || []) as SocialAccount[]);
      setPosts((postsResponse.posts || []) as MarketingPost[]);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load marketing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const connectWhatsApp = async () => {
    if (!accountName.trim()) {
      setError('Enter an account name to connect WhatsApp');
      return;
    }

    try {
      await api.marketing.connectAccount('whatsapp', accountName.trim());
      setAccountName('');
      await load();
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : 'Failed to connect WhatsApp');
    }
  };

  const createPost = async () => {
    if (!postText.trim()) {
      setError('Post text is required');
      return;
    }
    try {
      await api.marketing.createPost({
        text: postText.trim(),
        platforms: ['whatsapp'],
        scheduledAt: scheduledAt || null,
      });
      setPostText('');
      setScheduledAt('');
      await load();
    } catch (postError) {
      setError(postError instanceof Error ? postError.message : 'Failed to create post');
    }
  };

  const publishPost = async (postId: string) => {
    try {
      await api.marketing.publishPost(postId);
      await load();
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'Failed to publish post');
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-6">
        <button onClick={onBack} className="flex items-center gap-2 mb-6">
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold">Marketing Automation</h1>
        <p className="text-red-100 mt-2">Create and publish campaigns for your shop</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{error}</div>}

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="w-5 h-5 text-red-700" />
            <h2 className="font-semibold text-gray-900">Connected Accounts</h2>
          </div>
          <div className="space-y-3 mb-4">
            {accounts.map((account) => (
              <div key={account.id} className="border border-gray-200 rounded-xl p-3 text-sm">
                <p className="font-semibold text-gray-900 capitalize">{account.platform}</p>
                <p className="text-gray-600">{account.accountName}</p>
                <p className="text-xs text-gray-500">{account.status}</p>
              </div>
            ))}
            {!loading && accounts.length === 0 && <p className="text-sm text-gray-500">No connected social accounts yet.</p>}
          </div>
          <div className="flex gap-3">
            <input
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
              placeholder="WhatsApp business name"
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3"
            />
            <button
              onClick={() => void connectWhatsApp()}
              className="bg-green-600 text-white px-4 rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              Connect
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-red-700" />
            <h2 className="font-semibold text-gray-900">Create Campaign</h2>
          </div>
          <textarea
            value={postText}
            onChange={(event) => setPostText(event.target.value)}
            rows={4}
            placeholder="Example: We just completed a brake service on a Toyota Corolla. Book your check-up today."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 resize-none"
          />
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3"
          />
          <button
            onClick={() => void createPost()}
            className="w-full bg-red-700 text-white py-3 rounded-xl font-semibold hover:bg-red-800 transition-colors"
          >
            Save Campaign
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Campaign Queue</h2>
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-900">{post.text}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {post.status === 'scheduled' && post.scheduledAt
                    ? `Scheduled: ${new Date(post.scheduledAt).toLocaleString()}`
                    : `Status: ${post.status}`}
                </p>
                {post.status !== 'published' && (
                  <button
                    onClick={() => void publishPost(post.id)}
                    className="mt-3 inline-flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-800 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Publish Now
                  </button>
                )}
              </div>
            ))}
            {!loading && posts.length === 0 && <p className="text-sm text-gray-500">No campaigns yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
