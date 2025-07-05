import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/supabase';
import { ConfigurationError } from '../errors'; 
import { retryWithBackoff } from '../utils';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Allow both http:// and https:// for localhost development, require https:// for production
const isLocalhost = supabaseUrl?.includes('localhost') || supabaseUrl?.includes('127.0.0.1');
const isValidUrl = isLocalhost 
  ? (supabaseUrl?.startsWith('http://') || supabaseUrl?.startsWith('https://'))
  : supabaseUrl?.startsWith('https://');

if (!isValidUrl || !supabaseAnonKey) {
  throw new ConfigurationError(
    'Invalid Supabase configuration. Please check your environment variables:\n' +
    `- VITE_SUPABASE_URL should start with ${isLocalhost ? 'http:// or https://' : 'https://'}\n` +
    '- VITE_SUPABASE_ANON_KEY should not be empty'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: window.localStorage,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-client-info': 'health-rocket'
    },
    fetch: async (url, options = {}) => {
      const fetchWithTimeout = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased timeout to 30 seconds

        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      };

      return retryWithBackoff(
        fetchWithTimeout,
        {
          maxRetries: 5,
          initialDelay: 1000,
          maxDelay: 10000,
          shouldRetry: (error) => {
            // Retry on network errors, timeouts, 5xx server errors
            return (
              error instanceof TypeError || // Network errors
              error.name === 'AbortError' || // Timeout
              (error.status && error.status >= 500 && error.status < 600) || // Server errors
              error.message.includes('Failed to fetch') ||
              error.message.includes('Network request failed')
            );
          }
        }
      );
    }
  }
});