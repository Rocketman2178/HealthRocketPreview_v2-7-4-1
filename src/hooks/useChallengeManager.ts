import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/client';
import { contestChallenges, tier0Challenges } from '../data';
import type { Challenge } from '../types/dashboard';
import { DatabaseError } from '../lib/errors';
import { useSupabase } from '../contexts/SupabaseContext';
import { useChallengeLibrary } from './useChallengeLibrary';

export function useChallengeManager(userId: string | undefined) {
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [customChallengeCount, setCustomChallengeCount] = useState(0);
  const [hasCompletedTier0, setHasCompletedTier0] = useState(false);
  const { session } = useSupabase();
  const { challenges } = useChallengeLibrary();

  const cancelChallenge = async (challengeId: string) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);

      const { error: dbError } = await supabase
        .from('challenges')
        .delete()
        .eq('user_id', userId)
        .eq('challenge_id', challengeId);

      if (dbError) throw dbError;

      // Refresh challenges list
      await fetchActiveChallenges();
      
      // Trigger dashboard refresh
      window.dispatchEvent(new CustomEvent('dashboardUpdate'));
    } catch (err) {
      console.error('Error canceling challenge:', err);
      setError(err instanceof Error ? err : new DatabaseError('Failed to cancel challenge'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const startChallenge = async (challengeId: string) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);

      // Check if this is a custom challenge
      const isCustomChallenge = challengeId.startsWith('custom-');

      // Check if this is a contest challenge
      const isContest = contestChallenges.find(c => c.id === challengeId);
      
      if (isContest) {
        // For contests, we need to create a registration first
        const { data: contestData, error: contestError } = await supabase
          .from('contests')
          .select('id, entry_fee')
          .eq('challenge_id', challengeId)
          .single();

        if (contestError) throw contestError;

        // If contest has entry fee, process through Stripe
        if (contestData.entry_fee > 0) {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-premium-challenge-session`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session}`
              },
              body: JSON.stringify({ 
                contestId: contestData.id,
                challengeId
              })
            }
          );

          const data = await response.json();
          if (data.error) throw new Error(data.error);
          if (data.sessionUrl) {
            window.location.href = data.sessionUrl;
            return;
          }
        }
      }

      // Check if challenge is already active or completed
      const { data: existingChallenge } = await supabase
        .from('challenges')
        .select('id')
        .eq('user_id', userId)
        .eq('challenge_id', challengeId.toString())
        .maybeSingle();

      if (existingChallenge) {
        throw new Error('Challenge already active');
      }

      // Check if challenge was previously completed
      const { data: completedChallenge } = await supabase
        .from('completed_challenges')
        .select('id')
        .eq('user_id', userId)
        .eq('challenge_id', challengeId.toString())
        .maybeSingle();
      
      // If challenge was previously completed, that's fine - user can restart it

      // Initialize verification requirements
      const startDate = new Date();
      const verificationRequirements = {
        week1: { 
          required: 1,
          completed: 0,
          deadline: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        week2: {
          required: 1,
          completed: 0,
          deadline: new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
        },
        week3: {
          required: 1,
          completed: 0,
          deadline: new Date(startDate.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString()
        }
      };
      
      // Use the RPC function to start the challenge with the new limit logic
      const { data, error } = await supabase.rpc(
        'start_challenge',
        {
          p_user_id: userId,
          p_challenge_id: challengeId
        }
      );

      if (error) throw error;
      
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to start challenge');
      }

      // Trigger refresh
      await fetchActiveChallenges();
      window.dispatchEvent(new CustomEvent('dashboardUpdate'));
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start challenge';
      console.error('Error starting challenge:', errorMessage);
      setError(err instanceof Error ? err : new DatabaseError('Failed to start challenge'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Calculate days remaining for a challenge
  const calculateDaysRemaining = (startDate: string, duration: number = 21): number => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0); // Normalize to start of day
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalize to start of day
    const daysPassed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, duration - daysPassed);
  };

  // Fetch active challenges from Supabase
  const fetchActiveChallenges = async () => {
    if (!userId) {
      setLoading(false);
      setHasCompletedTier0(false);
      setActiveChallenges([]);
      return;
    }

    try {
      // Check if Morning Basics is completed
      const { data: morningBasicsData, error: mbError } = await supabase
        .from('challenges')
        .select('verification_count')
        .eq('user_id', userId)
        .eq('challenge_id', 'mb0')
        .maybeSingle();
        
      if (!mbError) {
        // Consider Morning Basics completed if verification_count >= 21
        setHasCompletedTier0(morningBasicsData?.verification_count >= 21);
      }
      
      // Also check completed_challenges table
      if (!hasCompletedTier0) {
        const { data: completedMB, error: completedMBError } = await supabase
          .from('completed_challenges')
          .select('id')
          .eq('user_id', userId)
          .eq('challenge_id', 'mb0')
         .maybeSingle();
          
       if (!completedMBError && completedMB) {
          setHasCompletedTier0(true);
        }
      }

      // Count custom challenges
      const { data: customChallenges, error: customError } = await supabase
        .from('custom_challenges')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active');
        
      if (!customError) {
        setCustomChallengeCount(customChallenges?.length || 0);
      }

      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) throw error;

      // Map database records to Challenge type
      const mappedChallenges = (data || []).map(dbChallenge => {
        const details = challenges.find(c => c.id === dbChallenge.challenge_id);
        
        // For contest challenges (starting with 'cn' or legacy 'tc'), we might not have details in the challenges array
        const isContest = dbChallenge.challenge_id?.startsWith('cn') || dbChallenge.challenge_id?.startsWith('tc');
        const isMorningBasics = dbChallenge.challenge_id === 'mb0';
        
        if (!details && !isContest) return null;
        
        // Calculate progress based on verification count
        let progress;
        if (isMorningBasics) {
          // For Morning Basics, progress is based on days completed
          const daysCompleted = dbChallenge.verification_count || 0;
          progress = Math.min((daysCompleted / 21) * 100, 100);
        } else {
          // For other challenges, use verification progress
          progress = Math.min(
            ((dbChallenge.verification_count || 0) / (dbChallenge.verifications_required || 3)) * 100,
            100
          );
        }
        
        // Calculate days remaining
        let daysRemaining;
        if (isMorningBasics) {
          // For Morning Basics, days remaining is based on days completed
          const daysCompleted = dbChallenge.verification_count || 0;
          daysRemaining = Math.max(0, 21 - daysCompleted);
        } else {
          // For other challenges, calculate based on elapsed time
          daysRemaining = calculateDaysRemaining(dbChallenge.started_at, details?.duration || 21);
        }

        return {
          id: dbChallenge?.id,
          challenge_id: dbChallenge?.challenge_id,
          name: details?.name || (isContest ? `Contest: ${dbChallenge.challenge_id}` : dbChallenge.challenge_id),
          category: dbChallenge.category || details?.category || (isContest ? 'Contests' : 'Challenge'),
          relatedCategories: details?.relatedCategories || [],
          description: details?.description || 'Contest description',
          expertReference: details?.expertReference || 'Health Rocket Team',
          requirements: details?.requirements || [],
          verificationMethod: details?.verificationMethod || null,
          expertTips: details?.expertTips || [],
          fuelPoints: details?.fuelPoints || 50,
          duration: details?.duration || 21,
          progress: progress,
          verification_count: dbChallenge.verification_count || 0,
          verifications_required: dbChallenge.verifications_required || 3,
          daysRemaining: daysRemaining,
          boostCount: dbChallenge?.boost_count || 0,
          last_daily_boost_completed_date: dbChallenge?.last_daily_boost_completed_date
        };
      }).filter(Boolean) as Challenge[];

      setActiveChallenges(mappedChallenges);
    } catch (err) {
      console.error('Error fetching active challenges:', err);
      setError(err instanceof Error ? err : new DatabaseError('Failed to fetch active challenges'));
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchActiveChallenges();
  }, [userId, challenges, hasCompletedTier0]);

  return {
    activeChallenges,
    loading,
    hasCompletedTier0,
    customChallengeCount,
    error,
    startChallenge,
    cancelChallenge,
    fetchActiveChallenges
  };
}