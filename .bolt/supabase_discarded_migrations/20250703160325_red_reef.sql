/*
  # Fix Custom Challenge Item Type

  1. Changes
    - Update the complete_custom_challenge_daily function to use 'challenge' as the item_type instead of 'custom_challenge'
    - Add 'custom_challenge' to the valid_item_type constraint for backward compatibility
    - Update existing fp_earnings records to use the correct item_type
    - Add metadata field with is_custom_challenge: true to distinguish custom challenges
*/

-- First, add 'custom_challenge' to the valid_item_type constraint for backward compatibility
ALTER TABLE fp_earnings DROP CONSTRAINT IF EXISTS valid_item_type;
ALTER TABLE fp_earnings ADD CONSTRAINT valid_item_type CHECK (
  item_type = ANY (ARRAY[
    'boost'::text, 
    'challenge'::text, 
    'quest'::text, 
    'contest'::text, 
    'health_assessment'::text, 
    'device_connection'::text, 
    'burn_streak_bonus'::text, 
    'other'::text, 
    'code'::text, 
    'custom_challenge'::text
  ])
);

-- Update existing fp_earnings records to use 'challenge' instead of 'custom_challenge'
UPDATE fp_earnings
SET 
  item_type = 'challenge',
  metadata = COALESCE(metadata, '{}'::jsonb) || '{"is_custom_challenge": true}'::jsonb
WHERE item_type = 'custom_challenge';

-- Create or replace the complete_custom_challenge_daily function to use 'challenge' as the item_type
CREATE OR REPLACE FUNCTION public.complete_custom_challenge_daily(
  p_user_id UUID,
  p_challenge_id UUID,
  p_completed_actions JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_challenge RECORD;
  v_daily_completion_id UUID;
  v_action_id UUID;
  v_action_completion_id UUID;
  v_actions_completed INTEGER := 0;
  v_minimum_met BOOLEAN := FALSE;
  v_fp_earned INTEGER := 0;
  v_is_completed BOOLEAN := FALSE;
  v_total_completions INTEGER := 0;
  v_progress NUMERIC := 0;
  v_target_completions INTEGER := 21;
  v_today DATE := CURRENT_DATE;
  v_challenge_name TEXT;
  v_user_name TEXT;
  v_fp_item_id TEXT;
  v_fp_item_name TEXT;
  v_debug_info JSONB := '{}'::JSONB;
BEGIN
  -- Get challenge details
  SELECT 
    cc.id, 
    cc.name, 
    cc.daily_minimum, 
    cc.total_completions, 
    cc.target_completions,
    cc.fp_daily_reward,
    cc.fp_completion_reward,
    cc.last_completion_date,
    u.name AS user_name
  INTO v_challenge
  FROM custom_challenges cc
  JOIN users u ON u.id = cc.user_id
  WHERE cc.id = p_challenge_id AND cc.user_id = p_user_id AND cc.status = 'active';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Challenge not found or not active'
    );
  END IF;
  
  -- Check if already completed today
  IF v_challenge.last_completion_date = v_today THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Challenge already completed today'
    );
  END IF;
  
  -- Create daily completion record
  INSERT INTO custom_challenge_daily_completions (
    custom_challenge_id,
    user_id,
    completion_date,
    actions_completed,
    minimum_met
  ) VALUES (
    p_challenge_id,
    p_user_id,
    v_today,
    0, -- Will update this later
    FALSE -- Will update this later
  ) RETURNING id INTO v_daily_completion_id;
  
  -- Process completed actions
  FOR i IN 0..jsonb_array_length(p_completed_actions) - 1 LOOP
    v_action_id := (p_completed_actions->i->>'action_id')::UUID;
    
    -- Insert action completion
    INSERT INTO custom_challenge_action_completions (
      daily_completion_id,
      action_id,
      completed
    ) VALUES (
      v_daily_completion_id,
      v_action_id,
      TRUE
    ) RETURNING id INTO v_action_completion_id;
    
    v_actions_completed := v_actions_completed + 1;
  END LOOP;
  
  -- Update daily completion with actions count
  v_minimum_met := v_actions_completed >= v_challenge.daily_minimum;
  
  UPDATE custom_challenge_daily_completions
  SET 
    actions_completed = v_actions_completed,
    minimum_met = v_minimum_met
  WHERE id = v_daily_completion_id;
  
  -- If minimum met, update challenge
  IF v_minimum_met THEN
    -- Calculate new values
    v_total_completions := v_challenge.total_completions + 1;
    v_progress := (v_total_completions::NUMERIC / v_challenge.target_completions::NUMERIC) * 100;
    v_fp_earned := v_challenge.fp_daily_reward;
    
    -- Check if challenge is completed
    IF v_total_completions >= v_challenge.target_completions THEN
      v_is_completed := TRUE;
      v_fp_earned := v_fp_earned + v_challenge.fp_completion_reward;
      
      -- Update challenge status to completed
      UPDATE custom_challenges
      SET 
        status = 'completed',
        completed_at = NOW(),
        total_completions = v_total_completions,
        progress = v_progress,
        last_completion_date = v_today
      WHERE id = p_challenge_id;
    ELSE
      -- Update challenge progress
      UPDATE custom_challenges
      SET 
        total_completions = v_total_completions,
        progress = v_progress,
        last_completion_date = v_today
      WHERE id = p_challenge_id;
    END IF;
    
    -- Award FP
    v_challenge_name := COALESCE(v_challenge.name, 'Custom Challenge');
    v_user_name := COALESCE(v_challenge.user_name, '');
    v_fp_item_id := 'custom-challenge-' || p_challenge_id::TEXT;
    v_fp_item_name := v_challenge_name;
    
    -- Record FP earnings with item_type 'challenge' instead of 'custom_challenge'
    INSERT INTO fp_earnings (
      user_id,
      item_id,
      item_name,
      item_type,
      fp_amount,
      title,
      description,
      user_name,
      metadata
    ) VALUES (
      p_user_id,
      v_fp_item_id,
      v_fp_item_name,
      'challenge', -- Changed from 'custom_challenge' to 'challenge'
      v_fp_earned,
      'Custom Challenge Daily Completion',
      'Completed daily actions for custom challenge',
      v_user_name,
      jsonb_build_object(
        'challenge_id', p_challenge_id,
        'minimum_met', v_minimum_met,
        'actions_completed', v_actions_completed,
        'is_custom_challenge', TRUE, -- Add this flag to distinguish custom challenges
        'daily_completion_id', v_daily_completion_id
      )
    );
  END IF;
  
  -- Return success
  RETURN jsonb_build_object(
    'success', TRUE,
    'daily_completion_id', v_daily_completion_id,
    'minimum_met', v_minimum_met,
    'actions_completed', v_actions_completed,
    'fp_earned', v_fp_earned,
    'is_completed', v_is_completed,
    'total_completions', v_total_completions,
    'progress', v_progress,
    'debug_info', v_debug_info
  );
EXCEPTION WHEN OTHERS THEN
  -- Log error
  INSERT INTO debug_logs (
    operation,
    table_name,
    record_id,
    details,
    success
  ) VALUES (
    'complete_custom_challenge_daily',
    'custom_challenges',
    p_challenge_id::TEXT,
    jsonb_build_object(
      'error', SQLERRM,
      'detail', SQLSTATE,
      'user_id', p_user_id,
      'challenge_id', p_challenge_id,
      'completed_actions', p_completed_actions
    ),
    FALSE
  );
  
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;