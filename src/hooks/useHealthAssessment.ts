import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/client';
import type { CategoryScores } from '../lib/health/types';
import type { HealthAssessment } from '../types/health';
import { DatabaseError } from '../lib/errors';
import { calculateHealthScore } from '../lib/health/calculators/score';

interface HealthUpdateData {
  expectedLifespan: number;
  expectedHealthspan: number;
  gender?: string;
  healthGoals?: string;
  categoryScores: CategoryScores;
}

export function useHealthAssessment(userId: string | undefined) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [canUpdate, setCanUpdate] = useState(false);
  const [daysUntilUpdate, setDaysUntilUpdate] = useState<number>(30);
  const [assessmentHistory, setAssessmentHistory] = useState<HealthAssessment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [previousAssessment, setPreviousAssessment] = useState<HealthAssessment | null>(null);

  // Add retry count state
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;

  // Check if user can submit new assessment
  const checkEligibility = async () => {
    if (!userId) return false;

    setError(null);
    
    try {
      if (retryCount >= MAX_RETRIES) {
        throw new Error('Failed to connect after multiple attempts');
      }
      
      const { data: assessments, error } = await supabase
        .from('health_assessments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // PGRST116 means no rows, which is fine - user can submit first assessment
      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Only store the latest assessment date for eligibility check
      const lastAssessment = assessments?.[0];
      setAssessmentHistory(assessments || []); // Store all assessments for history view
      
      // Calculate days until next update
      if (!lastAssessment) {
        setDaysUntilUpdate(0);
        setCanUpdate(true);
        return true;
      }
      
      const lastUpdate = new Date(lastAssessment.created_at);
      const nextUpdate = new Date(lastUpdate);
      nextUpdate.setDate(nextUpdate.getDate() + 30);
      
      const now = new Date();
      const diffTime = nextUpdate.getTime() - now.getTime();
      const days = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      
      setDaysUntilUpdate(days);
      setCanUpdate(days === 0);
      return days === 0;

    } catch (err) {
      // Increment retry count
      setRetryCount(prev => prev + 1);
      
      // Only show error after max retries
      if (retryCount >= MAX_RETRIES - 1) {
        console.error('Error checking eligibility:', err);
        setError(err instanceof Error ? err : new DatabaseError('Failed to check eligibility'));
      } else {
        // Retry after delay
        setTimeout(() => {
          checkEligibility();
        }, RETRY_DELAY * (retryCount + 1));
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Check eligibility on mount and when userId changes
  useEffect(() => {
    setRetryCount(0); // Reset retry count on userId change
    checkEligibility();
  }, [userId]);

  // Submit new health assessment
  const submitAssessment = async (data: HealthUpdateData) => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (data.expectedLifespan < 50 || data.expectedLifespan > 200) {
        throw new Error('Expected lifespan must be between 50 and 200');
      }
      if (data.expectedHealthspan < 50 || data.expectedHealthspan > data.expectedLifespan) {
        throw new Error('Expected healthspan must be between 50 and your expected lifespan');
      }

      const now = new Date().toISOString();
      const healthScore = calculateHealthScore(data.categoryScores);

      // Validate health score
      if (isNaN(healthScore) || healthScore < 1 || healthScore > 10) {
        throw new Error('Invalid health score calculated');
      }

      // Call the RPC function with all parameters
      const { data: result, error } = await supabase.rpc('update_health_assessment_v3', {
        p_user_id: userId,
        p_expected_lifespan: data.expectedLifespan,
        p_expected_healthspan: data.expectedHealthspan,
        p_health_score: healthScore,
        p_mindset_score: data.categoryScores.mindset,
        p_sleep_score: data.categoryScores.sleep,
        p_exercise_score: data.categoryScores.exercise,
        p_nutrition_score: data.categoryScores.nutrition,
        p_biohacking_score: data.categoryScores.biohacking,
        p_created_at: now,
        p_gender: data.gender || null,
        p_health_goals: data.healthGoals || null
      });

      if (error) {
        // Handle specific database errors
        if (error.message.includes('Must wait 30 days')) {
          throw new Error('Must wait 30 days between health assessments');
        }
        throw error;
      }

      // Check if the function returned an error
      if (!result?.success) {
        throw new Error(result?.error || 'Failed to update health assessment');
      }
      
      // Extract FP bonus from result
      const fpBonus = result.fp_bonus || Math.round(calculateNextLevelPoints(data.level || 1) * 0.1);

      // Wait briefly to ensure transaction completes
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        // Refresh eligibility and history
        await checkEligibility();

        // Trigger refresh events
        window.dispatchEvent(new CustomEvent('healthUpdate'));
        window.dispatchEvent(new CustomEvent('dashboardUpdate'));
        window.dispatchEvent(new CustomEvent('dashboardUpdate', {
          detail: {
            fpEarned: fpBonus,
            updatedPart: 'health_assessment',
            category: 'general'
          }
        }));
        
        return true;
      } catch (refreshErr) {
        console.warn('Error refreshing eligibility after assessment:', refreshErr);
        // Continue with success even if refresh fails
        return true;
      }
      
    } catch (err) {
      const error = err instanceof Error 
        ? err 
        : new DatabaseError('Failed to update health assessment');
      console.error('Error updating health assessment:', error);
      setError(error);
      throw error;
    } finally {
      setHistoryLoading(false);
      setLoading(false);
    }
  };

  // Function to fetch previous assessment data
  const fetchPreviousAssessment = async () => {
    if (!userId) return;
    
    try {
      setHistoryLoading(true);
      const { data: prevData, error: prevError } = await supabase
        .rpc('get_previous_health_assessment', {
          p_user_id: userId
        });

      if (prevError && prevError.code !== 'PGRST116') {
        throw prevError;
      }

      setPreviousAssessment(prevData?.[0] || null);
    } catch (err) {
      console.error('Error fetching previous assessment:', err);
      setError(err instanceof Error ? err : new DatabaseError('Failed to fetch previous assessment'));
    } finally {
      setHistoryLoading(false);
    }
  };

  return {
    loading,
    error,
    previousAssessment,
    canUpdate,
    assessmentHistory,
    historyLoading,
    daysUntilUpdate,
    checkEligibility,
    submitAssessment,
    fetchPreviousAssessment
  };
}