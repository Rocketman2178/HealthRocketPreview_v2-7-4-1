import React, { useEffect } from 'react';
import { useSupabase } from '../../contexts/SupabaseContext';
import { OnboardingFlow } from '../onboarding/OnboardingFlow';
import { AuthForm } from './AuthForm';
import { useUser } from '../../hooks/useUser';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSupabase();
  const { userData, userLoading } = useUser(user?.id);

  useEffect(() => {
    if (user && window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(user));
    }
  }, [user]);

  // Show loading state while checking auth
  if (loading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Show auth form if no user
  if (!user) {
    return <AuthForm />;
  }

  // Show onboarding for new users
  if (!userData?.onboarding_completed) {
    return <OnboardingFlow />;
  }
  // Show main content for authenticated users
  return children;
}