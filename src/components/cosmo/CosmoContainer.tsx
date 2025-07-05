import React from 'react';
import { useCosmo } from '../../contexts/CosmoContext';
import { useSupabase } from '../../contexts/SupabaseContext';
import { useEffect } from 'react';

export function CosmoContainer() {
  const { state, showCosmo } = useCosmo();
  const { user } = useSupabase();

  // Show Cosmo when onboarding completes
  useEffect(() => {
    const handleOnboardingComplete = () => {
      showCosmo();
    };

    window.addEventListener('onboardingCompleted', handleOnboardingComplete);
    return () => window.removeEventListener('onboardingCompleted', handleOnboardingComplete);
  }, [showCosmo]);

  if (!state.isEnabled || !user) {
    return null;
  }

  // The CosmoModal component has been removed as it's no longer used
  // The Cosmo functionality is now directly integrated into the dashboard
  return null;
}