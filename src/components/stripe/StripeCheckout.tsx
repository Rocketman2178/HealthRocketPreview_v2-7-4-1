import { useEffect, useState } from 'react';
import { Shield, Info } from 'lucide-react';
import { useStripe } from '../../hooks/useStripe';
import { SubscriptionSuccess } from '../subscription/SubscriptionSuccess';

interface StripeCheckoutModalProps {
  priceId: string | undefined;
  trialDays: number | undefined;
  promoCode: boolean;
  onClose: () => void;
}

export default function StripeCheckoutModal({
  priceId,
  promoCode,
  trialDays = 0,
  onClose,
}: StripeCheckoutModalProps) {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createSubscription, loading: stripeLoading } = useStripe();
  
  useEffect(() => {
    // Check if this is a success redirect from Stripe
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('session_id')) {
      setSuccess(true);
      setLoading(false);
      
      // Clean up URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('session_id');
      window.history.replaceState({}, document.title, url.toString());
      return;
    }
    
    if (!priceId) {
      setError('No price ID provided');
      setLoading(false);
      return;
    }
    
    const processCheckout = async () => {
      try {
        setLoading(true);
        
        // Use the useStripe hook to create a subscription
        const result = await createSubscription(priceId, trialDays, promoCode);
        
        if ('error' in result) {
          throw new Error(result.error);
        }

        // Redirect to Stripe checkout
        if (result.sessionUrl) {
          window.location.href = result.sessionUrl;
        } else {
          throw new Error('No session URL returned');
        }
      } catch (err) {
        console.error('Error creating checkout session:', err);
        setError(err instanceof Error ? err.message : 'Failed to create checkout session');
        setLoading(false);
      }
    };
    
    processCheckout();
  }, [priceId, trialDays, promoCode, createSubscription]);

  if (success) {
    return <SubscriptionSuccess onClose={onClose} trialDays={trialDays} />;
  }

  return (
    <div className="w-full max-w-md bg-gray-800 rounded-lg p-6 shadow-2xl text-center relative z-[302]">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center">
            <Shield className="text-orange-500" size={32} />
          </div>
        </div>
        
      <h2 className="text-white text-2xl font-bold mb-4">Processing Payment</h2>
      <p className="text-gray-300 mb-6">
        We're preparing your checkout session. You'll be redirected to Stripe shortly.
      </p>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg mb-4 text-left">
          <div className="flex items-start gap-3">
            <Info className="text-red-400 mt-1" size={20} />
            <div>
              <p className="text-red-400 font-medium mb-1">Error</p>
              <p className="text-gray-300 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {loading || stripeLoading ? (
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500 border-opacity-75 mx-auto mb-4"></div>
      ) : (
        <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-lg mb-6 text-left">
          <div className="flex items-start gap-3">
            <Info className="text-orange-500 mt-1" size={20} />
            <div>
              <p className="text-orange-500 font-medium mb-2">
                Payment Processing Error
              </p>
              <p className="text-gray-300 text-sm mb-2">
                We encountered an issue while setting up your checkout session.
              </p>
              <p className="text-gray-300 text-sm">
                Please try again or contact support if the problem persists.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <button
        onClick={onClose}
        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-all font-medium mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={loading || stripeLoading}
      >
        Cancel
      </button>
    </div>
  );
}