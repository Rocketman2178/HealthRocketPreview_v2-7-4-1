import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Calendar, Check } from 'lucide-react';
import { useSupabase } from '../../contexts/SupabaseContext';
import { supabase } from '../../lib/supabase';

interface DowngradeConfirmationProps {
  onClose: () => void;
  onConfirm: () => void;
  subscriptionEndDate?: string;
}

export function DowngradeConfirmation({ 
  onClose, 
  onConfirm,
  subscriptionEndDate 
}: DowngradeConfirmationProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const { user } = useSupabase();

  // Get subscription end date if not provided
  useEffect(() => {
    const getSubscriptionDetails = async () => {
      if (subscriptionEndDate) {
        setEndDate(subscriptionEndDate);
        return;
      }

      if (!user) return;

      try {
        // Get subscription details from database
        const { data, error } = await supabase
          .from('subscriptions')
          .select('current_period_end')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        
        if (data?.current_period_end) {
          setEndDate(data.current_period_end);
        } else {
          // Fallback to user table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('subscription_end_date')
            .eq('id', user.id)
            .single();
            
          if (userError) throw userError;
          setEndDate(userData?.subscription_end_date || null);
        }
      } catch (err) {
        console.error('Error fetching subscription details:', err);
        setError('Failed to fetch subscription details');
      }
    };

    getSubscriptionDetails();
  }, [user, subscriptionEndDate]);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call the RPC function to cancel subscription
      const { data, error: cancelError } = await supabase.rpc('cancel_subscription');

      if (cancelError) {
        throw new Error(cancelError.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to cancel subscription');
      }

      // Update user's plan to Free Plan (will take effect at end of period)
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          plan: 'Free Plan',
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      onConfirm();
    } catch (err) {
      console.error('Error downgrading subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to downgrade subscription');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formattedDate = endDate 
    ? new Date(endDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'your next billing date';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl border border-orange-500/20">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-orange-500" size={20} />
              </div>
              <h2 className="text-xl font-bold text-white">Confirm Downgrade</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Calendar className="text-orange-500 mt-1" size={20} />
                <div>
                  <p className="text-white font-medium mb-2">Your Pro Plan Benefits Will End Soon</p>
                  <p className="text-gray-300 text-sm">
                    Your subscription will remain active until <span className="text-orange-500 font-medium">{formattedDate}</span>. 
                    After this date, your account will be downgraded to the Free Plan.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-white">You will lose access to:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-gray-300 text-sm">
                  <span className="text-orange-500 mt-1">•</span>
                  <span>Premium challenges and quests</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300 text-sm">
                  <span className="text-orange-500 mt-1">•</span>
                  <span>Tier 2 boosts for advanced health optimization</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300 text-sm">
                  <span className="text-orange-500 mt-1">•</span>
                  <span>Prize pool eligibility for monthly rewards</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300 text-sm">
                  <span className="text-orange-500 mt-1">•</span>
                  <span>Advanced health analytics and insights</span>
                </li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                Keep Pro Plan
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px] justify-center"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Confirm Downgrade</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}