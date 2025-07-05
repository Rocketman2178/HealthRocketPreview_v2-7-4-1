-- Drop all existing versions of the function to avoid overloading issues
DROP FUNCTION IF EXISTS public.complete_custom_challenge_daily(UUID, UUID, JSONB);
DROP FUNCTION IF EXISTS public.complete_custom_challenge_daily(UUID, UUID, JSONB[]);
DROP FUNCTION IF EXISTS public.complete_custom_challenge_daily_jsonb(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.complete_custom_challenge_daily(UUID, UUID, TEXT);

-- Create a single, clean function that accepts a TEXT parameter for completed actions
CREATE OR REPLACE FUNCTION public.complete_custom_challenge_daily(
  p_user_id UUID,
  p_challenge_id UUID,
  p_completed_actions TEXT -- Accept as TEXT to avoid ambiguity
)
RETURNS JSONB AS $$
DECLARE
  v_challenge RECORD;
  v_daily_completion_id UUID;
  v_action_id UUID;
  v_actions_completed INTEGER := 0;
  v_minimum_met BOOLEAN := FALSE;
  v_fp_earned INTEGER := 0;
  v_is_completed BOOLEAN := FALSE;
  v_total_completions INTEGER := 0;
  v_progress NUMERIC := 0;
  v_today DATE := CURRENT_DATE;
  v_action_record RECORD;
  v_debug_info JSONB := '{}'::JSONB;
  v_parsed_actions JSONB;
  v_action JSONB;
  v_user_name TEXT;
  v_daily_fp_id UUID;
BEGIN
  -- Parse the JSON string into a JSONB value
  BEGIN
    v_parsed_actions := p_completed_actions::JSONB;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Invalid JSON format for completed actions',
      'detail', SQLERRM
    );
  END;
  
  -- Get user name for records
  SELECT name INTO v_user_name
  FROM users
  WHERE id = p_user_id;
  
  -- Check if challenge exists and belongs to user
  SELECT * INTO v_challenge
  FROM custom_challenges
  WHERE id = p_challenge_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Challenge not found or does not belong to user'
    );
  END IF;
  
  -- Check if challenge is active
  IF v_challenge.status != 'active' THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Challenge is not active'
    );
  END IF;
  
  -- Check if already completed today
  IF EXISTS (
    SELECT 1 
    FROM custom_challenge_daily_completions
    WHERE custom_challenge_id = p_challenge_id
    AND completion_date = v_today
  ) THEN
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
  v_actions_completed := 0;
  
  -- Loop through the array elements
  FOR v_action IN SELECT * FROM jsonb_array_elements(v_parsed_actions)
  LOOP
    v_action_id := (v_action->>'action_id')::UUID;
    
    -- Verify action belongs to this challenge
    SELECT * INTO v_action_record
    FROM custom_challenge_actions
    WHERE id = v_action_id AND custom_challenge_id = p_challenge_id;
    
    IF FOUND THEN
      -- Insert action completion
      INSERT INTO custom_challenge_action_completions (
        daily_completion_id,
        action_id,
        completed
      ) VALUES (
        v_daily_completion_id,
        v_action_id,
        TRUE
      );
      
      v_actions_completed := v_actions_completed + 1;
    END IF;
  END LOOP;
  
  -- Update daily completion with actions completed count
  v_minimum_met := v_actions_completed >= v_challenge.daily_minimum;
  
  UPDATE custom_challenge_daily_completions
  SET 
    actions_completed = v_actions_completed,
    minimum_met = v_minimum_met
  WHERE id = v_daily_completion_id;
  
  -- If minimum met, update challenge progress
  IF v_minimum_met THEN
    -- Award FP
    v_fp_earned := v_challenge.fp_daily_reward;
    
    -- Record FP earning with 'challenge' as item_type (FIXED)
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
      p_challenge_id::TEXT,
      v_challenge.name,
      'challenge', -- FIXED: Use 'challenge' instead of 'custom_challenge'
      v_fp_earned,
      'Custom Challenge Daily Completion',
      'Completed daily actions for custom challenge: ' || v_challenge.name,
      v_user_name,
      jsonb_build_object(
        'is_custom_challenge', TRUE,
        'daily_completion_id', v_daily_completion_id,
        'actions_completed', v_actions_completed,
        'minimum_required', v_challenge.daily_minimum
      )
    );
    
    -- Update or insert into daily_fp table
    SELECT id INTO v_daily_fp_id
    FROM daily_fp
    WHERE user_id = p_user_id AND date = v_today;
    
    IF FOUND THEN
      -- Update existing record
      UPDATE daily_fp
      SET 
        fp_earned = fp_earned + v_fp_earned,
        challenges_completed = challenges_completed + 1,
        updated_at = NOW()
      WHERE id = v_daily_fp_id;
    ELSE
      -- Insert new record
      INSERT INTO daily_fp (
        user_id,
        date,
        fp_earned,
        challenges_completed,
        user_name
      ) VALUES (
        p_user_id,
        v_today,
        v_fp_earned,
        1,
        v_user_name
      );
    END IF;
    
    -- Update challenge progress
    UPDATE custom_challenges
    SET 
      total_completions = total_completions + 1,
      last_completion_date = v_today,
      progress = LEAST(((total_completions + 1)::NUMERIC / target_completions::NUMERIC) * 100, 100)
    WHERE id = p_challenge_id
    RETURNING total_completions, progress INTO v_total_completions, v_progress;
    
    -- Check if challenge is now completed
    IF v_total_completions >= v_challenge.target_completions THEN
      -- Mark challenge as completed
      UPDATE custom_challenges
      SET 
        status = 'completed',
        completed_at = NOW()
      WHERE id = p_challenge_id;
      
      -- Award completion bonus
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
        p_challenge_id::TEXT,
        v_challenge.name,
        'challenge', -- FIXED: Use 'challenge' instead of 'custom_challenge'
        v_challenge.fp_completion_reward,
        'Custom Challenge Completion Bonus',
        'Completed all ' || v_challenge.target_completions || ' days of custom challenge: ' || v_challenge.name,
        v_user_name,
        jsonb_build_object(
          'is_custom_challenge', TRUE,
          'total_completions', v_challenge.target_completions,
          'completion_reward', v_challenge.fp_completion_reward
        )
      );
      
      -- Update daily_fp with completion bonus
      UPDATE daily_fp
      SET 
        fp_earned = fp_earned + v_challenge.fp_completion_reward,
        updated_at = NOW()
      WHERE user_id = p_user_id AND date = v_today;
      
      v_is_completed := TRUE;
      v_fp_earned := v_fp_earned + v_challenge.fp_completion_reward;
    END IF;
    
    -- Update user's fuel_points and reset days_since_fp
    UPDATE users
    SET 
      fuel_points = fuel_points + v_fp_earned,
      days_since_fp = 0
    WHERE id = p_user_id;
  END IF;
  
  -- Return success with details
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
  -- Log error details
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
      'state', SQLSTATE,
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

-- Fix existing fp_earnings records for custom challenges
UPDATE fp_earnings
SET item_type = 'challenge'
WHERE item_type = 'custom_challenge';

-- Log the fix operation
INSERT INTO debug_logs (
  operation,
  table_name,
  record_id,
  details,
  success
) VALUES (
  'fix_custom_challenge_fp_earnings',
  'fp_earnings',
  'batch_fix',
  jsonb_build_object(
    'description', 'Updated all fp_earnings records with item_type custom_challenge to challenge',
    'timestamp', NOW()
  ),
  TRUE
);