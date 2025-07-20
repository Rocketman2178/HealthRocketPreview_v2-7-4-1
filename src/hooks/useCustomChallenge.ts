import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "../contexts/SupabaseContext";
import { CustomChallengeService } from "../lib/customChallenge/CustomChallengeService";
import type {
  CustomChallenge,
  CustomChallengeAction,
  CustomChallengeDailyCompletion,
  CustomChallengeFormData,
} from "../types/customChallenge";

export function useCustomChallenge(userId: string | undefined) {
  const { session } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasActiveChallenge, setHasActiveChallenge] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [challenge, setChallenge] = useState<CustomChallenge | null>(null);
  const [actions, setActions] = useState<CustomChallengeAction[]>([]);
  const [dailyCompletions, setDailyCompletions] = useState<
    CustomChallengeDailyCompletion[]
  >([]);
  const [canCompleteToday, setCanCompleteToday] = useState(false);
  const [completionCount, setCompletionCount] = useState(0);
  const [fpCompletionReward, setFpCompletionReward] = useState(0);
  const [fpDailyReward, setFpDailyReward] = useState(0);

  // Generic guidance text to use instead of AI-generated content
  const genericGuidance =
    "Focus on consistency with your custom actions. Start with the easiest actions to build momentum. Track your progress daily and celebrate small wins. Remember that this challenge is designed specifically for your needs and lifestyle. Stay committed to your 21 completions goal!";

  // Check if user can create a custom challenge
  const checkCanCreate = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await CustomChallengeService.canCreateCustomChallenge(
        userId
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      // Always allow creating custom challenges
      setCanCreate(result.canCreate || true);
      setCompletionCount(result.completionCount);
      setFpCompletionReward(result.fpCompletionReward);
      setFpDailyReward(result.fpDailyReward);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's active custom challenge with retry logic
  const fetchUserChallenge = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await CustomChallengeService.getUserCustomChallenge(
        userId
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      setHasActiveChallenge(result.hasActiveChallenge);

      if (result.hasActiveChallenge && result.challenge) {
        setChallenge(result.challenge);
        setActions(result.actions || []);
        setDailyCompletions(result.dailyCompletions || []);
        setCanCompleteToday(result.canCompleteToday || false);
      } else {
        setChallenge(null);
        setActions([]);
        setDailyCompletions([]);
        setCanCompleteToday(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Create a new custom challenge
  const createCustomChallenge = async (formData: CustomChallengeFormData) => {
    if (!userId) return null;
    try {
      setCreating(true);
      setError(null);

      // Ensure we have valid data before proceeding
      if (!formData.name) {
        throw new Error("Challenge name is required");
      }

      if (formData.actions.length < 3) {
        throw new Error("At least 3 actions are required");
      }

      // Validate that all actions have text
      const emptyActions = formData.actions.filter((a) => !a.action_text);
      if (emptyActions.length > 0) {
        throw new Error("All actions must have a name");
      }
      const result = await CustomChallengeService.createCustomChallenge(
        userId,
        formData.name || "My Custom Challenge",
        formData.daily_minimum || 1,
        formData.expert_guidance || genericGuidance,
        formData.actions
      );

      if (!result.success) {
        setError(result.error || "Failed to create custom challenge");
        if (result.debug_info) {
          console.error("Debug info:", result.debug_info);
        }
        return null;
      }
      // Refresh challenge data
      await fetchUserChallenge();
      await checkCanCreate();

      // Wait a moment to ensure database operations complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Trigger dashboard update
      // window.dispatchEvent(new CustomEvent('dashboardUpdate'));

      return result.challengeId;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    } finally {
      setCreating(false);
    }
  };

  // Complete daily actions for a custom challenge
  const completeDailyActions = async (
    challengeId: string,
    completedActions: { action_id: string }[]
  ) => {
    if (!userId) return false;

    try {
      setCompleting(true);
      setError(null);

      const result = await CustomChallengeService.completeCustomChallengeDaily(
        userId,
        challengeId,
        completedActions
      );

      if (!result.success) {
        setError(result.error || "Failed to complete daily actions");
        return false;
      }

      // If FP was earned, trigger dashboard update
      if (result.fpEarned && result.fpEarned > 0) {
        window.dispatchEvent(
          new CustomEvent("dashboardUpdate", {
            detail: {
              fpEarned: result.fpEarned,
              updatedPart: result.isCompleted ? "challenge" : "boost",
              category: "general",
              challengeCompleted: result.isCompleted,
            },
          })
        );
      }

      // Refresh challenge data
      await fetchUserChallenge();

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    } finally {
      setCompleting(false);
    }
  };

  // Cancel a custom challenge
  const cancelCustomChallenge = async (challengeId: string) => {
    if (!userId) return false;

    try {
      setCanceling(true);
      setError(null);

      const result = await CustomChallengeService.cancelCustomChallenge(
        userId,
        challengeId
      );

      if (!result.success) {
        setError(result.error || "Failed to cancel custom challenge");
        return false;
      }

      // Refresh challenge data
      await fetchUserChallenge();
      await checkCanCreate();

      // Wait a moment to ensure database operations complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Trigger dashboard update
      window.dispatchEvent(new CustomEvent("dashboardUpdate"));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    } finally {
      setCanceling(false);
    }
  };

  // Generate expert guidance using Cosmo AI
  const generateExpertGuidance = useCallback(
    async (actions: { action_text: string; category: string }[]) => {
      if (!userId || !session?.access_token) return null;
      // Return generic guidance instead of calling the AI service
      return genericGuidance;
    },
    [userId, session?.access_token]
  );

  // Initialize data on mount
  useEffect(() => {
    if (userId) {
      Promise.all([fetchUserChallenge(), checkCanCreate()])
        .then(() => {})
        .catch((err) => {
          console.error("Error initializing custom challenge data:", err);
        });
    }
  }, [userId]);

  const result = {
    loading,
    creating,
    error,
    completing,
    canceling,
    hasActiveChallenge,
    canCreate,
    challenge,
    actions,
    dailyCompletions,
    canCompleteToday,
    completionCount,
    fpCompletionReward,
    fpDailyReward,
    createCustomChallenge,
    completeDailyActions,
    cancelCustomChallenge,
    generateExpertGuidance,
    refreshData: async () => {
      await Promise.all([fetchUserChallenge(), checkCanCreate()]);
    },
  };

  return result;
}
