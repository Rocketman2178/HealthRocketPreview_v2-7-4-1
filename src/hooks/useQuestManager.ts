import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/client';
import { QuestDataService } from '../lib/quest/QuestDataService';
import type { Quest } from '../types/dashboard';
import { DatabaseError, EmptyResultError } from '../lib/errors';

export function useQuestManager(userId: string | undefined) {
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasCompletedAnyChallenge, setHasCompletedAnyChallenge] = useState(false);

  // Fetch active quest from Supabase
  const fetchActiveQuest = async () => {
    if (!userId) {
      setLoading(false);
      setActiveQuest(null);
      return;
    }

    try {
      // Use the new RPC function to check if user has completed any challenge
      const { data: completedData, error: completedError } = await supabase.rpc(
        'get_user_completed_challenges',
        { p_user_id: userId }
      );
      
      if (completedError) {
        console.error('Error checking completed challenges with RPC:', completedError);
        
        // Fallback to direct query if RPC fails
        const { data: completedChallenges, error: directError } = await supabase
          .from('completed_challenges')
          .select('id')
          .eq('user_id', userId)
          .limit(1);
          
        if (!directError && completedChallenges && completedChallenges.length > 0) {
          setHasCompletedAnyChallenge(true);
        } else {
          setHasCompletedAnyChallenge(false);
        }
      } else {
        // Use the result from the RPC function
        setHasCompletedAnyChallenge(completedData?.has_completed_any || false);
      }

      // Get active quest if any
      const { data: questData, error: questError } = await supabase
        .from('quests')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (questError) {
        if (questError.code === 'PGRST116') {
          // No active quest found
          setActiveQuest(null);
          return;
        }
        throw questError;
      }

      // Handle case where no quests exist yet
      if (!questData) {
        setActiveQuest(null);
        return;
      }

      // Fetch weekly progress separately if quest exists
      let weeklyProgress = [];
      if (questData) {
        const { data: progressData, error: progressError } = await supabase
          .from('user_quest_weekly_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('quest_id', questData.quest_id);

        if (!progressError && progressData) {
          weeklyProgress = progressData;
        }
      }

      // Check if user can complete next week
      let canCompleteNextWeek = true;
      let daysUntilNextWeek = null;

      // If there are weekly progress entries, check the last one
      if (weeklyProgress && weeklyProgress.length > 0) {
        const sortedProgress = [...weeklyProgress].sort(
          (a, b) => new Date(b.completion_date).getTime() - new Date(a.completion_date).getTime()
        );
        
        const lastCompletion = sortedProgress[0];
        if (lastCompletion && lastCompletion.completion_date) {
          const lastCompletionDate = new Date(lastCompletion.completed_at || lastCompletion.completion_date);
          const now = new Date(); 
          const diffTime = now.getTime() - lastCompletionDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays < 7) {
            canCompleteNextWeek = false; // Explicitly set to false when in cooldown period
            daysUntilNextWeek = 7 - diffDays;
          }
        }
      }

      // Find quest details from data
      const details = await QuestDataService.getQuestDetails(questData.quest_id);
      if (!details) {
        console.warn('Quest details not found for:', questData.quest_id);
        setActiveQuest(null);
        return;
      }

      const daysElapsed = Math.floor(
        (new Date().getTime() - new Date(questData.started_at).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      const daysRemaining = Math.max(0, (details.duration || 90) - daysElapsed);

      setActiveQuest({
        ...questData,
        user_quest_weekly_progress: weeklyProgress,
        name: details.name,
        description: details.description,
        category: details.category,
        verificationMethods: details.verificationMethods || [],
        expertReference: details.expertReference,
        fuelPoints: details.fuelPoints,
        duration: details.duration || 90, 
        daysRemaining,
        canCompleteNextWeek, // Make sure this is explicitly set
        daysUntilNextWeek: daysUntilNextWeek
      });
    } catch (err) {
      console.error('Error fetching active quest:', err);
      setError(err instanceof Error ? err : new DatabaseError('Failed to fetch active quest'));
      setActiveQuest(null);
      // Don't reset hasCompletedAnyChallenge here, as it's independent of active quest
    } finally {
      setLoading(false);
    }
  };

  // Start a new quest
  const startQuest = async (questId: string) => {
    if (!userId) return;
    setLoading(true);

    try {
      const questDetails = await QuestDataService.getQuestDetails(questId);
      if (!questDetails) throw new Error('Quest not found');

      // Create quest in Supabase
      const { data, error } = await supabase
        .from('quests')
        .insert({
          user_id: userId,
          quest_id: questId,
          status: 'active',
          progress: 0,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger quest selected event with challenge IDs
      window.dispatchEvent(new CustomEvent('questSelected', { detail: { questId } }));

      // Update local state with combined data
      setActiveQuest({
        ...data,
        name: questDetails.name,
        description: questDetails.description,
        category: questDetails.category,
        verificationMethods: questDetails.verificationMethods,
        expertReference: questDetails.expertReference,
        fuelPoints: questDetails.fuelPoints,
        duration: 90,
        daysRemaining: 90
      });

      return data;
    } catch (err) {
      console.error('Error starting quest:', err);
      setError(err instanceof Error ? err : new DatabaseError('Failed to start quest'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cancel active quest
  const cancelQuest = async () => {
    if (!userId || !activeQuest) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('quests')
        .delete()
        .eq('user_id', userId)
        .eq('quest_id', activeQuest.quest_id);

      if (error) throw error;

      // Update local state
      setActiveQuest(null);
      
      // Trigger quest canceled event
      window.dispatchEvent(new CustomEvent('questCanceled'));
      
      // Trigger dashboard refresh
      window.dispatchEvent(new CustomEvent('dashboardUpdate'));
    } catch (err) {
      console.error('Error canceling quest:', err);
      setError(err instanceof Error ? err : new DatabaseError('Failed to cancel quest'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchActiveQuest();
    }
  }, [userId]);

  return {
    activeQuest,
    loading,
    hasCompletedAnyChallenge,
    error,
    startQuest,
    cancelQuest
  };
}