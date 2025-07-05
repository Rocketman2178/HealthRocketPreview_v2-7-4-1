import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function BillingPortal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleUpdatePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Redirect to success page after payment update
      // In a real implementation, this would call your Stripe portal endpoint
      setTimeout(() => {
        navigate('/subscription/success');
      }, 1000);
    } catch (err) {
      console.error('Error updating payment method:', err);
      setError(err instanceof Error ? err.message : 'Failed to update payment method');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 relative">
      {error && (
        <div className="absolute inset-0 bg-gray-800/90 flex items-center justify-center p-4">
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-orange-500" />
          <h3 className="text-sm font-medium text-white">Payment Method (Coming Soon)</h3>
        </div>
        <button
          onClick={handleUpdatePayment}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-gray-600 rounded-lg hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading...</span>
            </>
          ) : (
            'Coming Soon'
          )}
        </button>
      </div>
    </div>
  );
}