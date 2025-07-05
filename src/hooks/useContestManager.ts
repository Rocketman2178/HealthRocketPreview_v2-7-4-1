import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/client';
import { contestChallenges } from '../data';
import type { Challenge } from '../types/dashboard';
import { DatabaseError } from '../lib/errors';
import { useSupabase } from '../contexts/SupabaseContext';

export function useContestManager(userId: string | undefined) {
  const [activeContests, setActiveContests] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { session } = useSupabase();

  const cancelContest = async (challengeId: string) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);

      // Check if this is in active_contests table
      const { data: activeContest } = await supabase
        .from('active_contests')
        .select('id')
        .eq('user_id', userId)
        .eq('challenge_id', challengeId)
        .maybeSingle();

      if (activeContest) {
        // Delete from active_contests
        const { error: deleteError } = await supabase
          .from('active_contests')
          .delete()
          .eq('id', activeContest.id);

        if (deleteError) throw deleteError;
      } else {
        // Fall back to challenges table (legacy)
        const { error: dbError } = await supabase
          .from('challenges')
          .delete()
          .eq('user_id', userId)
          .eq('challenge_id', challengeId);

        if (dbError) throw dbError;
      }

      // Refresh challenges list
      await fetchActiveContests();
      
      // Trigger dashboard refresh
      window.dispatchEvent(new CustomEvent('dashboardUpdate'));
    } catch (err) {
      console.error('Error canceling contest:', err);
      setError(err instanceof Error ? err : new DatabaseError('Failed to cancel contest'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const startContest = async (challengeId: string) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);

      try {
        // Find contest details from the available contests
        const isContest = challengeId.startsWith('cn_') || challengeId.startsWith('tc_');

        if (isContest) {
          // First check if already registered
          const { data: registrationStatus, error: registrationError } = await supabase.rpc(
            'is_user_registered_for_contest',
            {
              p_user_id: userId,
              p_challenge_id: challengeId
            }
          );
          
          if (registrationError) throw registrationError;
          
          // If already registered, throw error
         if (registrationStatus) {
            throw new Error('Already registered');
          }
          
          // Check eligibility
          const { data: eligibility, error: eligibilityError } = await supabase.rpc(
            'check_contest_eligibility_credits',
            {
              p_user_id: userId,
              p_challenge_id: challengeId
            }
          );
          
          if (eligibilityError) throw eligibilityError;
          
          // If not eligible, show error
          if (!eligibility?.is_eligible) {
            throw new Error(eligibility?.reason || 'You are not eligible for this contest');
          }
          
          // Register for contest using credits
          const { data, error } = await supabase.rpc(
            'register_for_contest_with_credits',
            {
              p_user_id: userId,
              p_challenge_id: challengeId
            }
          );
          
          if (error) throw error;
          if (!data?.success) {
            throw new Error(data?.error || 'Failed to register for contest');
          }
          
          // Refresh contests list after successful registration
          await fetchActiveContests();
          
          // Trigger dashboard refresh
          window.dispatchEvent(new CustomEvent('dashboardUpdate'));
          
         // Return success with active contest ID
         return { success: true, activeContestId: data?.active_contest_id };
        } else {
          // For regular challenges, use the standard approach
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
          
          // Refresh challenges list
          await fetchActiveContests();
          
          // Trigger dashboard refresh
          window.dispatchEvent(new CustomEvent('dashboardUpdate'));
          
         return { success: true };
        }
      } catch (err) {
        console.error('Error in startContest:', err);
        throw err;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start contest';
      console.error('Error starting contest:', errorMessage);
      setError(err instanceof Error ? err : new DatabaseError('Failed to start contest'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Calculate days remaining for a challenge
  const calculateDaysRemaining = (startDate: string, duration: number): number => {
    const start = new Date(startDate);
    const now = new Date();
    
    // If contest hasn't started yet, return days until start
    if (start > now) {
      const daysUntilStart = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilStart;
    }
    
    // If contest has started, calculate days remaining
    start.setHours(0, 0, 0, 0); // Normalize to start of day
    now.setHours(0, 0, 0, 0); // Normalize to start of day
    const daysPassed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, duration - daysPassed);
  };

  // Fetch active contests from Supabase
  const fetchActiveContests = async () => {
    if (!userId) {
      setLoading(false);
      setActiveContests([]);
      setActiveContests([]);
      return;
    }

    try {
      // First check if any contests need days info from the database
      const contestsToCheck = [];
      
      // First try to get contests from active_contests table
      const { data: activeContestsData, error: activeContestsError } = await supabase
        .from('active_contests')
        .select(`
          id,
          contest_id,
          challenge_id,
          status,
          progress,
          started_at,
          completed_at,
          verification_count,
          verifications_required,
          user_name,
         start_date,
          contests(
            name,
            description,
            entry_fee,
            health_category,
            duration,
            fuel_points,
            expert_reference,
            requirements,
            expert_tips,
           start_date, 
           registration_end_date,
            how_to_play,
           community_id
          )
        `)
        .eq('user_id', userId)
        .in('status', ['active', 'pending'])
        .not('challenge_id', 'eq', 'cn_oura_sleep_week_score');

      if (activeContestsError) {
        console.error('Error fetching from active_contests:', activeContestsError);
      }

      // Then get any contests from the challenges table (legacy)
      const { data: challengesData, error: challengesError } = await supabase
        .from('challenges')
        .select('*')
        .eq('user_id', userId)
        .eq('category', 'Contests')
        .in('status', ['active', 'registered'])
        .not('challenge_id', 'eq', 'cn_oura_sleep_week_score');

      if (challengesError) {
        console.error('Error fetching from challenges:', challengesError);
      }

      // Combine both sources
      let allContests = [];

      // Process active_contests data
      if (activeContestsData && activeContestsData.length > 0) {
        const mappedActiveContests = activeContestsData.map(contest => {
          // Find contest details from frontend data or use database data
          const contestDetails = contestChallenges.find(c => 
            c.id === contest.challenge_id || 
            c.challenge_id === contest.challenge_id
          );
          
          const contestData = contest.contests;
          
          // Get start date from database or frontend data
          const contestStartDate = contest.start_date 
            ? new Date(contest.start_date).toISOString()
            : contestData?.start_date 
              ? new Date(contestData.start_date).toISOString() 
              : null;
          
         // Get registration end date from database or frontend data
         const registrationEndDate = contestData?.registration_end_date
           ? new Date(contestData.registration_end_date).toISOString()
           : null;

         // Get community information if available
         let communityName = null;
         if (contestData?.community_id) {
           // We'll fetch community names separately after mapping
         }
         
          // Calculate days until start
          let daysUntilStart = null;
          if (contestStartDate) {
            const startDate = new Date(contestStartDate);
            const now = new Date();
            if (startDate > now) {
              daysUntilStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            }
          }

          // Determine if contest has started
          const hasStarted = contestStartDate ? new Date(contestStartDate) <= new Date() : false;
          
          return {
            id: contest.id,
            challenge_id: contest.challenge_id,
            name: contestData?.name || contestDetails?.name || `Contest: ${contest.challenge_id}`,
            category: 'Contests',
            relatedCategories: contestDetails?.relatedCategories || [contestData?.health_category || "Sleep"],
            description: contestData?.description || contestDetails?.description || 'Contest description',
            expertReference: contestData?.expert_reference || contestDetails?.expertReference || 'Health Rocket Team',
            requirements: contestData?.requirements || contestDetails?.requirements || [],
            verificationMethod: contestDetails?.verificationMethod || null,
            expertTips: contestData?.expert_tips || contestDetails?.expertTips || [],
            fuelPoints: contestData?.fuel_points || contestDetails?.fuelPoints || 50,
            duration: contestData?.duration || contestDetails?.duration || 7,
            progress: contest.progress || 0,
            verification_count: contest.verification_count || 0,
            verifications_required: contest.verifications_required || 8,
            daysRemaining: calculateDaysRemaining(
              contestStartDate, 
              contestData?.duration || contestDetails?.duration || 7
            ),
            isPremium: true,
            entryFee: contestData?.entry_fee || contestDetails?.entryFee || 75,
            status: hasStarted ? 'active' : 'pending',
            startDate: contestStartDate,
           registrationEndDate: registrationEndDate,
            start_date: contest.start_date,
           community_id: contestData?.community_id || null,
           community_name: communityName,
            daysUntilStart: daysUntilStart
          };
        });
        
        allContests.push(...mappedActiveContests);
        
        // Add contest IDs to check for days info
        mappedActiveContests.forEach(contest => {
          if (contest.challenge_id.startsWith('cn_') || contest.challenge_id.startsWith('tc_')) {
            contestsToCheck.push(contest.challenge_id);
          }
        });
        
        // Fetch community names for contests with community_id
        const communityIds = mappedActiveContests
          .filter(contest => contest.community_id)
          .map(contest => contest.community_id);
          
        if (communityIds.length > 0) {
          try {
            const { data: communities, error: commError } = await supabase
              .from('communities')
              .select('id, name')
              .in('id', communityIds);
              
            if (!commError && communities) {
              // Create a map of community id to name
              const communityMap = new Map();
              communities.forEach(comm => {
                communityMap.set(comm.id, comm.name);
              });
              
              // Update contest community names
              allContests = allContests.map(contest => {
                if (contest.community_id && communityMap.has(contest.community_id)) {
                  return {
                    ...contest,
                    community_name: communityMap.get(contest.community_id)
                  };
                }
                return contest;
              });
            }
          } catch (err) {
            console.warn('Error fetching community names:', err);
          }
        }
      }

      // Process challenges data (legacy)
      if (challengesData && challengesData.length > 0) {
        const mappedChallenges = await Promise.all(challengesData.map(async (dbChallenge) => {
          // Find contest details from frontend data
          const contestDetails = contestChallenges.find(c => 
            c.id === dbChallenge.challenge_id || 
            c.challenge_id === dbChallenge.challenge_id
          );
          
          // Get contest details from database if available
          const { data: contestData } = await supabase
            .from('contests')
           .select('start_date, duration, registration_end_date')
            .eq('challenge_id', dbChallenge.challenge_id)
            .maybeSingle();
          
          // Get start date from database or frontend data
          const contestStartDate = contestData?.start_date 
            ? new Date(contestData.start_date).toISOString() 
            : null;
          
         // Get registration end date from database
         const registrationEndDate = contestData?.registration_end_date
           ? new Date(contestData?.registration_end_date).toISOString()
           : null;

          // Calculate days until start
          let daysUntilStart = null;
          if (contestStartDate) {
            const startDate = new Date(contestStartDate);
            const now = new Date();
            if (startDate > now) {
              daysUntilStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            }
          }

          // Use the status from the database directly
          const status = contestData?.status || dbChallenge.status || 'active';
          const hasStarted = contestStartDate ? new Date(contestStartDate) <= new Date() : true;
          
          // Calculate progress based on verification count
          const verificationProgress = Math.min(
            ((dbChallenge.verification_count || 0) / (dbChallenge.verifications_required || 8)) * 100,
            100
          );

          return {
            id: dbChallenge.id,
            challenge_id: dbChallenge.challenge_id,
            name: contestDetails?.name || `Contest: ${dbChallenge.challenge_id}`,
            category: 'Contests',
            relatedCategories: contestDetails?.relatedCategories || ["Sleep"],
            description: contestDetails?.description || 'Contest description',
            expertReference: contestDetails?.expertReference || 'Health Rocket Team',
            requirements: contestDetails?.requirements || [],
            verificationMethod: contestDetails?.verificationMethod || null,
            expertTips: contestDetails?.expertTips || [],
            fuelPoints: contestDetails?.fuelPoints || 50,
            duration: contestDetails?.duration || 7,
            progress: verificationProgress,
            verification_count: dbChallenge.verification_count || 0,
            verifications_required: dbChallenge.verifications_required || 8,
            daysRemaining: calculateDaysRemaining(contestStartDate, contestDetails?.duration || contestData?.duration || 7),
            isPremium: true,
            entryFee: contestDetails?.entryFee || 75,
            status: status,
            startDate: contestStartDate, 
           registrationEndDate: registrationEndDate,
            daysUntilStart: daysUntilStart,
            minPlayers: contestDetails?.minPlayers || 4
          };
        }));
        
        allContests.push(...mappedChallenges);
        
        // Add contest IDs to check for days info
        mappedChallenges.forEach(contest => {
          if (contest.challenge_id.startsWith('cn_') || contest.challenge_id.startsWith('tc_')) {
            contestsToCheck.push(contest.challenge_id);
          }
        });
      }
      
      // Get days info for all contests that need it
      if (contestsToCheck.length > 0) {
        for (const contestId of contestsToCheck) {
          try {
            console.log(`Fetching days info for contest ${contestId}`);
            const { data: daysInfo, error: daysError } = await supabase.rpc(
              'get_contest_days_info',
              { p_challenge_id: contestId }
            );
            
            if (daysError) {
              console.error(`Error fetching days info for contest ${contestId}:`, daysError);
            }
            
            if (!daysError && daysInfo?.success) {
              console.log(`Days info for contest ${contestId}:`, daysInfo);
              // Update the contest with days info
              allContests = allContests.map(contest => {
                if (contest.challenge_id === contestId) {
                  return {
                    ...contest,
                    daysUntilStart: daysInfo.days_until_start,
                    daysRemaining: daysInfo.has_started ? daysInfo.days_remaining : daysInfo.days_until_start
                  };
                }
                return contest;
              });
            }
          } catch (err) {
            console.error(`Error fetching days info for contest ${contestId}:`, err);
          }
        }
      }

      console.log('Combined active contests:', allContests);
      setActiveContests(allContests);
    } catch (err) {
      console.error('Error fetching active contests:', err);
      setError(err instanceof Error ? err : new DatabaseError('Failed to fetch active contests'));
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchActiveContests();
  }, [userId]);

  return {
    activeContests,
    loading,
    error,
    startContest,
    cancelContest,
    fetchActiveContests
  };
}