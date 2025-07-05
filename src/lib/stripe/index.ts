import { supabase } from '../supabase';

export interface StripeCheckoutResult {
  sessionId: string;
  sessionUrl: string;
}

export interface StripeError {
  error: string;
}

export type StripeResult = StripeCheckoutResult | StripeError;

export async function createSubscription(priceId: string, trialDays: number = 0, promoCode: boolean = false): Promise<StripeResult> {
  try {
    // Call the RPC function instead of the edge function
    const { data, error } = await supabase.rpc('create_subscription_session', {
      p_price_id: priceId
    });

    if (error) throw error;
    
    // Format the response to match the expected StripeCheckoutResult
    if (data?.success) {
      return {
        sessionId: 'mock_session_id',
        sessionUrl: data.session_url || '#'
      };
    } else {
      throw new Error(data?.error || 'Failed to create subscription');
    }
  } catch (err) {
    console.error('Error creating subscription:', err);
    return { error: err instanceof Error ? err.message : 'Failed to create subscription' };
  }
}

export async function cancelSubscription(): Promise<{ success: boolean; error?: string }> {
  try {
    // Call the RPC function to cancel subscription
    const { data, error } = await supabase.rpc('cancel_subscription', {});

    if (error) throw error;
    
    if (!data?.success) {
      throw new Error(data?.error || 'Failed to cancel subscription');
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Failed to cancel subscription');
    }

    return { success: true };
  } catch (err) {
    console.error('Error canceling subscription:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Failed to cancel subscription' };
  }
}

export async function updatePaymentMethod(): Promise<StripeResult> {
  try {
    // Call the RPC function instead of the edge function
    const { data, error } = await supabase.rpc('get_stripe_portal_url');

    if (error) throw error;
    
    // Format the response to match the expected StripeCheckoutResult
    if (data?.success) {
      return {
        sessionId: 'mock_session_id',
        sessionUrl: data.url || '#'
      };
    } else {
      throw new Error(data?.error || 'Failed to get portal URL');
    }
  } catch (err) {
    console.error('Error updating payment method:', err);
    return { error: err instanceof Error ? err.message : 'Failed to update payment method' };
  }
}