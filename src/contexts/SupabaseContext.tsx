import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';
import { signIn, signUp, signOut, resetPassword, updatePassword } from '../lib/supabase/auth';
import { useRef } from 'react';

interface SupabaseContextType {
  user: User | null;
  session: string;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, launchCode: string, plan?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const retryCountRef = useRef(0);
  const authSubscriptionRef = useRef<{ subscription: { unsubscribe: () => void } } | null>(null);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    let reconnectTimer: NodeJS.Timeout;
    let checkConnectionTimer: NodeJS.Timeout;

    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        // Set persistent session
        if (currentSession) {
          await supabase.auth.setSession({
            access_token: currentSession.access_token,
            refresh_token: currentSession.refresh_token
          });
        }
        
        if (mounted) {
          if (currentSession?.user) {
            setUser(currentSession.user);
            setSession(currentSession.access_token);
          }
          setIsConnected(true);
          retryCountRef.current = 0;
        }
      } catch (error) {
        // Check if the error is due to an invalid session
        if (error instanceof Error && 
            (error.message.includes('session_not_found') || 
             error.message.includes('JWT expired'))) {
          console.warn('Session invalid or expired, signing out');
          // Force sign out to clear invalid session
          await supabase.auth.signOut();
          if (mounted) {
            setUser(null);
            setSession('');
          }
        }
        console.error('Error initializing auth:', error);
        if (mounted) {
          setIsConnected(false);
          // Increment retry count and implement exponential backoff
          retryCountRef.current += 1;
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const setupAuthListener = () => {
      const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            setSession(session.access_token);
            // Reset connection state on successful auth
            setIsConnected(true);
            retryCountRef.current = 0;
          } else {
            setUser(null);
            setSession('');
          }
          setLoading(false);
        }
      });
      
      // Store the subscription reference
      authSubscriptionRef.current = subscription;
      return subscription;
    };

    // Initial auth setup
    initAuth();
    const authSubscription = setupAuthListener();

    // Connection health check
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('users').select('count').limit(1);
        if (mounted) {
          const newConnectionState = !error;
          setIsConnected(newConnectionState);
          if (newConnectionState) {
            retryCountRef.current = 0;
          }
        }
      } catch (error) {
        if (mounted) {
          setIsConnected(false);
        }
      }
    };

    // Set up periodic connection check
    checkConnectionTimer = setInterval(checkConnection, 30000);

    // Implement reconnection with exponential backoff
    const attemptReconnection = () => {
      if (!isConnected && mounted) {
        const backoffTime = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
        reconnectTimer = setTimeout(() => {
          initAuth();
        }, backoffTime);
      }
    };

    // Watch connection state changes
    if (!isConnected) {
      attemptReconnection();
    }

    return () => {
      mounted = false;
      // Safely unsubscribe if the subscription exists
      if (authSubscriptionRef.current?.subscription?.unsubscribe) {
        authSubscriptionRef.current.subscription.unsubscribe();
      }
      clearInterval(checkConnectionTimer);
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [isConnected]); // Remove retryCount from dependencies since we're using retryCountRef

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {!isConnected && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          Connection lost. Retrying... {retryCountRef.current > 0 ? `(Attempt ${retryCountRef.current})` : ''}
        </div>
      )}
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}