import React, { useState } from 'react';
import { MessageSquare, Send, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { useSupabase } from '../../contexts/SupabaseContext';
import { supabase } from '../../lib/supabase';

interface SupportFormProps {
  onClose: () => void;
  initialCategory?: string | null;
}

export function SupportForm({ onClose, initialCategory = null }: SupportFormProps) {
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState(initialCategory || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { user } = useSupabase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !category || !user) {
      setError('Please enter a message and select a category');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Submit support message using RPC function
      const { data, error: rpcError } = await supabase.rpc('submit_user_support', {
        p_user_id: user.id,
        p_category: category,
        p_feedback: message,
        p_rating: null,
        p_context: {}
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      if (!data?.success) {
        throw new Error('Failed to save message');
      }

      // If message was saved successfully, try to send email
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-support-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messageId: data.message_id,
              message,
              category,
              userName: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown User',
              userEmail: user.email,
              userId: user.id
            })
          }
        );

        // Even if email fails, we still consider it a success since the message was saved
        if (!response.ok) {
          console.warn('Support message saved but email delivery failed');
        }
      } catch (emailErr) {
        console.warn('Error sending support email:', emailErr);
        // Continue with success flow even if email fails
      }

      setSuccess(true);
      setMessage('');
      
      // Close the form after 3 seconds on success
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      console.error('Error sending support message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
              <MessageSquare className="text-orange-500" size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Support & Feedback</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="bg-lime-500/10 border border-lime-500/20 rounded-lg p-4 text-center">
            <CheckCircle className="mx-auto mb-2 text-lime-500" size={32} />
            <h3 className="text-lg font-semibold text-white mb-2">Message Sent!</h3>
            <p className="text-gray-300">
              Thank you for your feedback. Our team will review it shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Category
              </label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="" disabled>Select one</option>
                <option value="general">General Support</option>
                <option value="bug">Report a Bug</option>
                <option value="feature">Feature Request</option>
                <option value="account">Account Issues</option>
                <option value="feedback">General Feedback</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or feedback..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={5}
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}