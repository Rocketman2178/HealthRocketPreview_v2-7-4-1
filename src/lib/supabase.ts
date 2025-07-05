import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Validate environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Allow both http:// and https:// for localhost development, require https:// for production
const isLocalhost = supabaseUrl?.includes('localhost') || supabaseUrl?.includes('127.0.0.1');
const isValidUrl = isLocalhost 
  ? (supabaseUrl?.startsWith('http://') || supabaseUrl?.startsWith('https://'))
  : supabaseUrl?.startsWith('https://');

if (!isValidUrl || !supabaseAnonKey) {
  throw new Error(
    'Invalid Supabase configuration. Please check your environment variables:\n' +
    `- VITE_SUPABASE_URL should start with ${isLocalhost ? 'http:// or https://' : 'https://'}\n` +
    '- VITE_SUPABASE_ANON_KEY should not be empty'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});