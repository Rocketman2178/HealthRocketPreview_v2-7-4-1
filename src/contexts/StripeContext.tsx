import { createContext, useContext, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { createSubscription, cancelSubscription, updatePaymentMethod } from '../lib/stripe';
import type { StripeResult } from '../lib/stripe';

interface StripeContextType {
  stripe: Stripe | null;
  loading: boolean;
  error: string | null;
  createSubscription: (priceId: string, trialDays?: number, promoCode?: boolean) => Promise<StripeResult>;
  cancelSubscription: () => Promise<{ success: boolean; error?: string }>;
  updatePaymentMethod: () => Promise<StripeResult>;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export function StripeProvider({ children }: { children: React.ReactNode }) {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Stripe
  useState(() => {
    const initStripe = async () => {
      try {
        const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
        if (!stripeKey) {
          console.warn('Stripe public key not found in environment variables');
          return;
        }
        
        const stripeInstance = await loadStripe(stripeKey);
        setStripe(stripeInstance);
      } catch (err) {
        console.error('Error initializing Stripe:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize Stripe');
      }
    };

    initStripe();
  });

  const handleCreateSubscription = async (priceId: string, trialDays: number = 0, promoCode: boolean = false): Promise<StripeResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await createSubscription(priceId, trialDays, promoCode);
      
      if ('error' in result) {
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await cancelSubscription();
      
      if (!result.success && result.error) {
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentMethod = async (): Promise<StripeResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await updatePaymentMethod();
      
      if ('error' in result) {
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return (
    <StripeContext.Provider
      value={{
        stripe,
        loading,
        error,
        createSubscription: handleCreateSubscription,
        cancelSubscription: handleCancelSubscription,
        updatePaymentMethod: handleUpdatePaymentMethod
      }}
    >
      {children}
    </StripeContext.Provider>
  );
}

export function useStripeContext() {
  const context = useContext(StripeContext);
  
  if (context === undefined) {
    throw new Error('useStripeContext must be used within a StripeProvider');
  }
  
  return context;
}