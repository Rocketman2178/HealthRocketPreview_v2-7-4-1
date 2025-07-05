import React, { useState } from 'react';
import { Check, X, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSupabase } from '../../contexts/SupabaseContext';

interface BoostCodeInputProps {
  onClose: () => void;
}

export function BoostCodeInput({ onClose }: BoostCodeInputProps) {
  const [boostCode, setBoostCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fpEarned, setFpEarned] = useState<number | null>(null);
  const [data, setData] = useState<any | null>(null);
  const [success, setSuccess] = useState(false);
  const { user } = useSupabase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setFpEarned(null);
    setSuccess(false);

    if (!boostCode.trim()) {
      setMessage('Please enter a boost code.');
      return;
    }

    if (!user) {
      setMessage('You must be logged in to redeem a boost code.');
      return;
    }

    try {
      setLoading(true);

      // Call the RPC function with the correct parameter name 'p_boost_code'
      const { data, error } = await supabase.rpc('redeem_boost_code', {
        p_boost_code: boostCode.trim().toUpperCase()
      });

      if (error) {
        console.error('Error redeeming boost code:', error);
        setMessage('Code not valid or already redeemed. Please try again or contact support.');
        return;
      }

      if (data && data.success) {
        setFpEarned(data.fp_earned);
        setData(data);
        setSuccess(true);
        setMessage(`Successfully redeemed code for +${data.fp_earned} FP!`);

        // Dispatch dashboard update event with FP earned
        window.dispatchEvent(
          new CustomEvent('dashboardUpdate', {
            detail: {
              fpEarned: data.fp_earned,
              updatedPart: 'boost_code',
              category: 'general'
            },
          })
        );
      } else {
        setMessage(data?.error || 'Code not valid. Please try again or contact support.');
      }
    } catch (err) {
      console.error('Error redeeming boost code:', err);
      setMessage('An error occurred. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Enter Boost Code</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
            <X size={20} />
          </button>
        </div>

        {success && fpEarned ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-lime-500/20 rounded-full flex items-center justify-center mx-auto">
              <Check className="text-lime-500" size={32} />
            </div>
            <h3 className="text-xl font-bold text-white">
              {data?.boost_code_name ? `"${data.boost_code_name}" Redeemed!` : 'Code Redeemed!'}
            </h3>
            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-orange-500">
              <Zap size={24} className="animate-pulse" />
              <span>+{fpEarned} FP</span>
            </div>
            <p className="text-gray-300">Fuel Points have been added to your account.</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Continue
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="boostCode" className="block text-sm font-medium text-gray-300 mb-1">
                Boost Code
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Enter your Boost Code to receive Fuel Points.
              </p>
              <input
                type="text"
                id="boostCode"
                value={boostCode}
                onChange={(e) => setBoostCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {message && (
              <div className={`text-sm text-center ${success ? 'text-green-400' : 'text-red-400'}`}>
                {message}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !boostCode.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Redeeming...</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    <span>Redeem</span>
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