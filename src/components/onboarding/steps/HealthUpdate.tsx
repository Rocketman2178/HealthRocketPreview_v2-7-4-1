import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { useSupabase } from '../../../contexts/SupabaseContext';
import { calculateHealthScore } from '../../../lib/health/calculators/score';
import { HealthUpdateForm } from '../../health/HealthUpdateForm';
import { ArrowRight } from 'lucide-react';
import type { CategoryScores, Gender } from '../../../lib/health/types';
import { DatabaseError } from '../../../lib/errors';

interface HealthUpdateData {
  expectedLifespan: number;
  expectedHealthspan: number;
  gender: Gender;
  categoryScores: CategoryScores;
  healthGoals?: string;
}

interface HealthUpdateProps {
  onComplete?: () => void;
  onBack?: () => void;
}

export function HealthUpdate({ onComplete, onBack }: HealthUpdateProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useSupabase();
  const [error, setError] = useState<Error | null>(null);

  // State for button press handling
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [buttonInterval, setButtonInterval] = useState<NodeJS.Timeout | null>(null);
  const [buttonSpeed, setButtonSpeed] = useState<number>(500);
  const speedIncreaseRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = async (data: HealthUpdateData) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const healthScore = calculateHealthScore(data.categoryScores);
      const now = new Date().toISOString();

      const { data: result, error: transactionError } = await supabase.rpc('update_health_assessment_v3', {
        p_user_id: user.id,
        p_expected_lifespan: data.expectedLifespan,
        p_expected_healthspan: data.expectedHealthspan,
        p_health_score: healthScore,
        p_mindset_score: data.categoryScores.mindset,
        p_sleep_score: data.categoryScores.sleep,
        p_exercise_score: data.categoryScores.exercise,
        p_nutrition_score: data.categoryScores.nutrition,
        p_biohacking_score: data.categoryScores.biohacking,
        p_created_at: now,
        p_gender: data.gender,
        p_health_goals: data.healthGoals
      });
      
      if (transactionError) {
        throw new DatabaseError('Failed to update health assessment', transactionError);
      }

      // Wait for transaction to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Trigger refresh events
      window.dispatchEvent(new CustomEvent('onboardingCompleted'));
      window.dispatchEvent(new CustomEvent('dashboardUpdate'));
      window.dispatchEvent(new CustomEvent('healthUpdate'));

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error updating health:', error);
      setError(error instanceof Error ? error : new DatabaseError('Failed to complete onboarding'));
      return; // Don't proceed on error
    } finally {
      setLoading(false);
    }
  };

  // Handle button press start
  const handleButtonDown = (action: string, increment: number, field: string, min: number, max: number) => {
    // Clear any existing intervals
    if (buttonInterval) {
      clearInterval(buttonInterval);
    }
    
    // Set the active button
    setActiveButton(action);
    
    // Initial speed
    setButtonSpeed(100); // Ultra-fast initial speed
    
    // Perform the action immediately
    updateValue(field, increment, min, max);
    
    // Set up an interval to repeat the action
    const interval = setInterval(() => {
      updateValue(field, increment, min, max);
    }, buttonSpeed);
    
    setButtonInterval(interval);
    
    // Set up speed increase
    speedIncreaseRef.current = setTimeout(() => {
      if (buttonInterval) {
        clearInterval(buttonInterval);
      }
      
      // Faster interval after initial delay
      const fasterInterval = setInterval(() => {
        updateValue(field, increment, min, max);
      }, 20); // Ultra-fast second stage
      
      setButtonInterval(fasterInterval);
      
      // Even faster after another delay
      setTimeout(() => {
        if (buttonInterval) {
          clearInterval(buttonInterval);
        }
        
        // Very fast interval
        const fastestInterval = setInterval(() => {
          updateValue(field, increment, min, max);
        }, 5); // Extremely fast third stage
        
        setButtonInterval(fastestInterval);
      }, 500);
    }, 500);
  };
  
  // Handle button release
  const handleButtonUp = () => {
    if (buttonInterval) {
      clearInterval(buttonInterval);
      setButtonInterval(null);
    }
    
    if (speedIncreaseRef.current) {
      clearTimeout(speedIncreaseRef.current);
      speedIncreaseRef.current = null;
    }
    
    setActiveButton(null);
  };
  
  // Update value based on field
  const updateValue = (field: string, increment: number, min: number, max: number) => {
    setFormData(prev => {
      if (field === 'expectedLifespan') {
        const newValue = Math.max(min, Math.min(max, prev.expectedLifespan + increment));
        return { ...prev, expectedLifespan: newValue };
      } else if (field === 'expectedHealthspan') {
        const newValue = Math.max(min, Math.min(Math.min(max, prev.expectedLifespan), prev.expectedHealthspan + increment));
        return { ...prev, expectedHealthspan: newValue };
      } else {
        // For category scores
        const categoryField = field as keyof CategoryScores;
        const currentValue = prev.categoryScores[categoryField];
        const newValue = Math.max(1, Math.min(10, currentValue + increment));
        
        return {
          ...prev,
          categoryScores: {
            ...prev.categoryScores,
            [categoryField]: newValue
          }
        };
      }
    });
  };
  
  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (buttonInterval) {
        clearInterval(buttonInterval);
      }
      if (speedIncreaseRef.current) {
        clearTimeout(speedIncreaseRef.current);
      }
    };
  }, [buttonInterval]);

  return (
    <>
      <HealthUpdateForm 
        onClose={onBack || (() => {})} // Use onBack if provided
        previousAssessment={{
          expected_lifespan: 85,
          expected_healthspan: 75,
          mindset_score: 7.0,
          sleep_score: 7.0,
          exercise_score: 7.0,
          nutrition_score: 7.0,
          biohacking_score: 7.0
        }}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
        isOnboarding={true} 
        showBackButton={!!onBack}
        buttonText="Complete Assessment"
      />
    </>
  );
}