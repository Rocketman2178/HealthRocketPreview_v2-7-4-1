import { supabase } from '../lib/supabase/client';
import { useState, useEffect } from 'react';
import type { User } from '../types/user';

export function useUser(userId: string | undefined) {
  const [userData, setUserData] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);
  const [healthData, setHealthData] = useState<any>(null);

  async function fetchUser() {
    if (!userId) {
      setUserData(null);
      setHealthData(null);
      setUserLoading(false);
      return;
    }

    try {
      // Fetch user data
      const { data: newUserData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // This is already correct

      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }
      
      if (newUserData) {
        setUserData(newUserData);
      } else {
        // If no user data found, create a default user record
        try {
          const { data: authUser } = await supabase.auth.getUser();
          if (authUser?.user) {
            const { data: createdUser, error: createError } = await supabase
              .from('users')
              .insert({
                id: userId,
                email: authUser.user.email || '',
                name: authUser.user.user_metadata?.name || '',
                plan: 'Pro Plan',
                level: 1,
                fuel_points: 0,
                burn_streak: 0,
                health_score: 7.8,
                healthspan_years: 0,
                lifespan: 85,
                healthspan: 75,
                onboarding_completed: false,
                onboarding_step: 'mission'
              })
              .select('*');
              
            if (createError && createError.code !== 'PGRST116') throw createError;
            if (createdUser && createdUser.length > 0) {
              setUserData(createdUser[0]);
            }
          }
        } catch (createErr) {
          console.error('Error creating user record:', createErr);
        }
      }
      
      // Fetch latest health assessment using new function
      const { data: latestHealth, error: healthError } = await supabase
        .rpc('get_latest_health_assessment', {
          p_user_id: userId
        });

      if (healthError && healthError.code !== 'PGRST116') {
        throw healthError;
      }

      // Check if latestHealth exists and has at least one element
      setHealthData(latestHealth && latestHealth.length > 0 ? latestHealth[0] : null);

    } catch (err) {
      console.error('Error fetching user data:', err);
      setUserError(err instanceof Error ? err : new Error('Failed to fetch user data'));
    } finally {
      setUserLoading(false);
    }
  }

  // Reset state when userId changes
  useEffect(() => {
    if (!userId) {
      setUserData(null);
      setHealthData(null);
      setUserLoading(false);
      return;
    }
    fetchUser();
  }, [userId]);

  return {
    userData,
    userLoading,
    userError,
    healthData,
    isLoading: userLoading,
    fetchUser
  };
}