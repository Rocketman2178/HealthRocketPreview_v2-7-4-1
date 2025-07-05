import { supabase } from '../supabase';
import type { CustomChallenge, CustomChallengeAction, CustomChallengeDailyCompletion } from '../../types/customChallenge';

export class CustomChallengeService {
  /**
   * Check if user can create a custom challenge
   */
  static async canCreateCustomChallenge(userId: string): Promise<{
    canCreate: boolean;
    completionCount: number;
    fpCompletionReward: number;
    fpDailyReward: number;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc('can_create_custom_challenge', {
        p_user_id: userId || ''
      });

      if (error) throw error;

      return {
        canCreate: true, // Always allow creating custom challenges
        completionCount: data?.completion_count || 0,
        fpCompletionReward: data?.fp_completion_reward || 100,
        fpDailyReward: data?.fp_daily_reward || 10
      };
    } catch (err) {
      console.error('Error checking if user can create custom challenge:', err);
      return {
        canCreate: true, // Always allow creating custom challenges even on error
        completionCount: 0,
        fpCompletionReward: 100,
        fpDailyReward: 10,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a new custom challenge
   */
  static async createCustomChallenge(
    userId: string,
    name: string,
    dailyMinimum: number = 1,
    expertGuidance: string | null,
    actions: {
      action_text: string;
      description: string;
      category: string;
    }[]
  ): Promise<{
    success: boolean;
    debug_info?: any;
    challengeId?: string;
    completionCount?: number;
    fpCompletionReward?: number;
    fpDailyReward?: number;
    error?: string;
  }> {
    try {
      console.log("Creating custom challenge with data:", {
        userId: userId,
        name: name || 'My Custom Challenge',
        dailyMinimum: dailyMinimum,
        expertGuidance: expertGuidance ? "provided" : "null", 
        actionsCount: actions.length,
        firstAction: actions[0]?.action_text
      });

      // Validate inputs before sending to server
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      if (!name || name.trim() === '') {
        name = 'My Custom Challenge';
      }
      
      if (dailyMinimum < 1 || isNaN(dailyMinimum)) {
        dailyMinimum = 1;
      }
      
      if (actions.length < 3) {
        throw new Error('At least 3 actions are required');
      }
      
      // Ensure all actions have text
      const emptyActions = actions.filter(a => !a.action_text || a.action_text.trim() === '');
      if (emptyActions.length > 0) {
        throw new Error('All actions must have a name');
      }

      const { data, error } = await supabase.rpc('create_custom_challenge', {
        p_user_id: userId,
        p_name: name.trim(),
        p_daily_minimum: dailyMinimum,
        p_expert_guidance: expertGuidance,
        p_actions: actions.map(action => ({
          ...action,
          description: action.description || '',
          category: action.category
        }))
      });

      if (error) {
        console.error("RPC error in createCustomChallenge:", error);
        console.error("Error details:", error.message, error.details, error.hint);
        throw error;
      }

      // If data is null or undefined, throw an error
      if (!data) {
        throw new Error('No response from server');
      }

      if (!data.success) {
        console.error("Function returned error in createCustomChallenge:", data.error);
        if (data.debug_info) {
          console.error("Debug info:", data.debug_info);
        }
        return {
          success: false,
          error: data.error || 'Failed to create custom challenge',
          debug_info: data.debug_info || { error_source: 'unknown' }
        };
      }

      console.log("Challenge created successfully, response:", data);
      return {
        success: true,
        challengeId: data.challenge_id,
        completionCount: data.completion_count || 0,
        fpCompletionReward: data.fp_completion_reward || 100,
        fpDailyReward: data.fp_daily_reward || 10,
        debug_info: data.debug_info || null
      };
    } catch (err) {
      console.error('Error creating custom challenge:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        debug_info: err instanceof Error ? {
          error_type: 'client_error',
          message: err.message,
          stack: err.stack
        } : {
          error_type: 'unknown_error',
          message: 'Unknown error occurred'
        }
      };
    }
  }

  /**
   * Get user's active custom challenge
   */
  static async getUserCustomChallenge(userId: string): Promise<{
    hasActiveChallenge: boolean;
    challenge?: CustomChallenge;
    actions?: CustomChallengeAction[];
    dailyCompletions?: CustomChallengeDailyCompletion[];
    canCompleteToday?: boolean;
    error?: string;
  }> {
    try {
      console.log("CustomChallengeService.getUserCustomChallenge called for userId:", userId);
      
      if (!userId) {
        console.warn("getUserCustomChallenge called with empty userId");
        return {
          hasActiveChallenge: false,
          error: "User ID is required"
        };
      }
      
      const { data, error } = await supabase.rpc('get_user_custom_challenge', {
        p_user_id: userId
      });

      if (error) {
        console.error("RPC error in getUserCustomChallenge:", error);
        throw error;
      }
      
      console.log("getUserCustomChallenge RPC response:", data);

      if (!data.success) {
        console.warn("getUserCustomChallenge returned error:", data.error);
        return {
          hasActiveChallenge: false,
          error: data.error || 'Failed to get custom challenge'
        };
      }

      if (!data.has_active_challenge) {
        console.log("No active challenge found for user");
        return {
          hasActiveChallenge: false
        };
      }

      console.log("Active challenge found:", data.challenge?.name);
      return {
        hasActiveChallenge: true,
        challenge: data.challenge,
        actions: data.actions || [],
        dailyCompletions: data.daily_completions || [],
        canCompleteToday: data.can_complete_today || false
      };
    } catch (err) {
      console.error('Error in getUserCustomChallenge:', err);
      return {
        hasActiveChallenge: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }

  /**
   * Complete daily actions for a custom challenge
   */
  static async completeCustomChallengeDaily(
    userId: string,
    challengeId: string,
    completedActions: { action_id: string }[]
  ): Promise<{
    success: boolean;
    dailyCompletionId?: string;
    minimumMet?: boolean;
    actionsCompleted?: number;
    fpEarned?: number;
    isCompleted?: boolean;
    totalCompletions?: number;
    progress?: number;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc('complete_custom_challenge_daily', {
        p_user_id: userId,
        p_challenge_id: challengeId,
        // Stringify the array to avoid function overloading ambiguity
        p_completed_actions: JSON.stringify(completedActions)
      });

      if (error) throw error;

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Failed to complete daily actions'
        };
      }

      return {
        success: true,
        dailyCompletionId: data.daily_completion_id,
        minimumMet: data.minimum_met,
        actionsCompleted: data.actions_completed,
        fpEarned: data.fp_earned,
        isCompleted: data.is_completed,
        totalCompletions: data.total_completions,
        progress: data.progress
      };
    } catch (err) {
      console.error('Error completing daily actions:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }

  /**
   * Cancel a custom challenge
   */
  static async cancelCustomChallenge(
    userId: string,
    challengeId: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc('cancel_custom_challenge', {
        p_user_id: userId,
        p_challenge_id: challengeId
      });

      if (error) throw error;

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Failed to cancel custom challenge'
        };
      }

      return {
        success: true
      };
    } catch (err) {
      console.error('Error canceling custom challenge:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }

  /**
   * Get completed custom challenges
   */
  static async getCompletedCustomChallenges(userId: string): Promise<{
    success: boolean;
    challenges?: CustomChallenge[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc('get_completed_custom_challenges', {
        p_user_id: userId
      });

      if (error) throw error;

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Failed to get completed custom challenges'
        };
      }

      return {
        success: true,
        challenges: data.challenges
      };
    } catch (err) {
      console.error('Error getting completed custom challenges:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }
}