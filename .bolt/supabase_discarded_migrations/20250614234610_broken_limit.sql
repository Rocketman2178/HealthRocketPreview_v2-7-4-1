/*
  # Fix Morning Basics Function Quest ID Reference

  1. Changes
    - Removes any references to "quest_id" in the complete_morning_basics_action_v2 function
    - Fixes the error "record "new" has no field "quest_id""
    - Ensures proper transaction handling and error recovery
    - Maintains consistency between fp_earnings and daily_fp tables

  2. Security
    - Maintains existing security model with SECURITY DEFINER
    - Properly handles user permissions
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.complete_morning_basics_action_v2;

-- Create the updated function with proper handling and no quest_id references
CREATE OR REPLACE FUNCTION public.complete_morning_basics_action_v2(
  p_user_id UUID,
  p_challenge_id TEXT,
  p_action_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_challenge_id UUID;
  v_verification_count INTEGER;
  v_fp_earned INTEGER := 5; -- Fixed FP amount for Morning Basics
  v_result JSONB;
  v_already_completed BOOLEAN := FALSE;
  v_days_completed INTEGER := 0;
  v_challenge_completed BOOLEAN := FALSE;
  v_bonus_fp INTEGER := 0;
  v_daily_fp_id UUID;
  v_user_name TEXT;
BEGIN
  -- Check if the user has already completed an action for this date
  SELECT EXISTS (
    SELECT 1 
    FROM completed_actions 
    WHERE user_id = p_user_id 
    AND action_id = 'morning_basics_daily' 
    AND completed_date = p_action_date
  ) INTO v_already_completed;
  
  IF v_already_completed THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Already completed Morning Basics for today',
      'days_completed', v_days_completed
    );
  END IF;
  
  -- Get user name for records
  SELECT name INTO v_user_name FROM users WHERE id = p_user_id;
  
  -- Get or create the challenge
  SELECT id, verification_count INTO v_challenge_id, v_verification_count
  FROM challenges
  WHERE user_id = p_user_id AND challenge_id = p_challenge_id;
  
  IF v_challenge_id IS NULL THEN
    -- Create new challenge if it doesn't exist
    INSERT INTO challenges (
      user_id, 
      challenge_id, 
      status, 
      progress, 
      started_at,
      verification_count,
      category,
      name,
      description
    ) VALUES (
      p_user_id,
      p_challenge_id,
      'active',
      0,
      now(),
      0,
      'Bonus',
      'Morning Basics',
      'Complete at least 3 of 5 morning actions each day'
    )
    RETURNING id INTO v_challenge_id;
    
    v_verification_count := 0;
  ELSE
    -- Use the verification count we already retrieved
    v_verification_count := COALESCE(v_verification_count, 0);
  END IF;
  
  -- Record the completed action
  INSERT INTO completed_actions (
    user_id,
    action_id,
    completed_at,
    completed_date,
    fp_earned
  ) VALUES (
    p_user_id,
    'morning_basics_daily',
    now(),
    p_action_date,
    v_fp_earned
  );
  
  -- Update challenge verification count
  UPDATE challenges
  SET 
    verification_count = v_verification_count + 1,
    progress = LEAST(((v_verification_count + 1) / 21.0) * 100, 100),
    last_verification_update = p_action_date
  WHERE id = v_challenge_id
  RETURNING verification_count INTO v_days_completed;
  
  -- Check if challenge is now completed (21 days)
  IF v_days_completed >= 21 THEN
    v_challenge_completed := TRUE;
    v_bonus_fp := 50; -- Bonus FP for completing the challenge
    
    -- Mark challenge as completed
    UPDATE challenges
    SET 
      status = 'completed',
      completed_at = now()
    WHERE id = v_challenge_id;
    
    -- Add to completed_challenges
    INSERT INTO completed_challenges (
      user_id,
      challenge_id,
      completed_at,
      fp_earned,
      days_to_complete,
      final_progress,
      status,
      started_at,
      verification_count
    ) 
    SELECT 
      user_id,
      challenge_id,
      now(),
      50, -- Bonus FP for completing
      21,
      100,
      'completed',
      started_at,
      verification_count
    FROM challenges
    WHERE id = v_challenge_id;
  END IF;
  
  -- Record FP earning - This will trigger update to users.fuel_points
  INSERT INTO fp_earnings (
    user_id,
    item_id,
    item_name,
    item_type,
    health_category,
    fp_amount,
    title,
    description,
    user_name
  ) VALUES (
    p_user_id,
    'morning_basics_daily',
    'Morning Basics Daily',
    'challenge',
    'general',
    v_fp_earned,
    'Morning Basics Daily Completion',
    'Completed at least 3 morning actions',
    v_user_name
  );
  
  -- Update daily_fp table for today
  SELECT id INTO v_daily_fp_id
  FROM daily_fp
  WHERE user_id = p_user_id AND date = p_action_date;
  
  IF v_daily_fp_id IS NULL THEN
    -- Create new daily_fp record if none exists for today
    INSERT INTO daily_fp (
      user_id,
      date,
      fp_earned,
      boosts_completed,
      challenges_completed,
      source,
      user_name
    ) VALUES (
      p_user_id,
      p_action_date,
      v_fp_earned,
      1, -- Count as a boost
      0,
      'challenge',
      v_user_name
    );
  ELSE
    -- Update existing daily_fp record
    UPDATE daily_fp
    SET 
      fp_earned = fp_earned + v_fp_earned,
      boosts_completed = boosts_completed + 1
    WHERE id = v_daily_fp_id;
  END IF;
  
  -- Add bonus FP if challenge completed
  IF v_challenge_completed THEN
    -- Record bonus FP in fp_earnings
    INSERT INTO fp_earnings (
      user_id,
      item_id,
      item_name,
      item_type,
      health_category,
      fp_amount,
      title,
      description,
      user_name
    ) VALUES (
      p_user_id,
      'morning_basics_completion',
      'Morning Basics Challenge',
      'challenge',
      'general',
      v_bonus_fp,
      'Morning Basics Challenge Completed',
      'Completed all 21 days of Morning Basics',
      v_user_name
    );
    
    -- Update daily_fp with bonus FP
    UPDATE daily_fp
    SET 
      fp_earned = fp_earned + v_bonus_fp,
      challenges_completed = challenges_completed + 1
    WHERE id = v_daily_fp_id;
  END IF;
  
  -- Return success with FP earned
  v_result := jsonb_build_object(
    'success', TRUE,
    'fp_earned', v_fp_earned,
    'days_completed', v_days_completed,
    'challenge_completed', v_challenge_completed
  );
  
  IF v_challenge_completed THEN
    v_result := v_result || jsonb_build_object('bonus_fp', v_bonus_fp);
  END IF;
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return error information
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- Create a function to fix burn streak calculations
CREATE OR REPLACE FUNCTION public.recalculate_burn_streaks()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_record RECORD;
  v_dates DATE[];
  v_current_streak INTEGER;
  v_updated_count INTEGER := 0;
  v_result JSONB;
  v_last_date DATE;
  v_current_date DATE;
  v_gap BOOLEAN;
BEGIN
  FOR v_user_record IN 
    SELECT DISTINCT user_id 
    FROM daily_fp
    WHERE fp_earned > 0
  LOOP
    -- Get all dates where user earned FP, ordered by date
    SELECT array_agg(date ORDER BY date) INTO v_dates
    FROM daily_fp
    WHERE user_id = v_user_record.user_id
    AND fp_earned > 0;
    
    -- Calculate current streak
    v_current_streak := 0;
    v_gap := FALSE;
    v_last_date := NULL;
    
    -- Start from the most recent date and go backwards
    FOR i IN REVERSE array_length(v_dates, 1)..1 LOOP
      v_current_date := v_dates[i];
      
      -- If this is the first date we're checking
      IF v_last_date IS NULL THEN
        v_last_date := v_current_date;
        v_current_streak := 1;
      ELSE
        -- Check if there's a gap of more than 1 day
        IF v_current_date + 1 < v_last_date THEN
          v_gap := TRUE;
          EXIT; -- Break the loop, streak is broken
        ELSE
          -- Increment streak only if it's a different date
          IF v_current_date != v_last_date THEN
            v_current_streak := v_current_streak + 1;
          END IF;
          v_last_date := v_current_date;
        END IF;
      END IF;
    END LOOP;
    
    -- Update user's burn streak if it's different
    UPDATE users
    SET burn_streak = v_current_streak
    WHERE id = v_user_record.user_id
    AND burn_streak != v_current_streak;
    
    IF FOUND THEN
      v_updated_count := v_updated_count + 1;
    END IF;
  END LOOP;
  
  v_result := jsonb_build_object(
    'success', TRUE,
    'users_updated', v_updated_count
  );
  
  RETURN v_result;
END;
$$;

-- Create a function to fix a specific user's burn streak
CREATE OR REPLACE FUNCTION public.fix_user_burn_streak(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_dates DATE[];
  v_current_streak INTEGER;
  v_result JSONB;
  v_last_date DATE;
  v_current_date DATE;
  v_gap BOOLEAN;
  v_old_streak INTEGER;
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
  -- Get current streak
  SELECT burn_streak INTO v_old_streak
  FROM users
  WHERE id = p_user_id;

  -- Get all dates where user earned FP, ordered by date
  SELECT array_agg(date ORDER BY date) INTO v_dates
  FROM daily_fp
  WHERE user_id = p_user_id
  AND fp_earned > 0;
  
  -- If no dates found, return 0 streak
  IF v_dates IS NULL OR array_length(v_dates, 1) = 0 THEN
    UPDATE users SET burn_streak = 0 WHERE id = p_user_id;
    
    RETURN jsonb_build_object(
      'success', TRUE,
      'user_id', p_user_id,
      'old_streak', v_old_streak,
      'new_streak', 0,
      'reason', 'No FP earning dates found'
    );
  END IF;
  
  -- Calculate current streak
  v_current_streak := 0;
  v_gap := FALSE;
  v_last_date := NULL;
  
  -- Start from the most recent date and go backwards
  FOR i IN REVERSE array_length(v_dates, 1)..1 LOOP
    v_current_date := v_dates[i];
    
    -- If this is the first date we're checking
    IF v_last_date IS NULL THEN
      -- Only count if it's today or yesterday (streak is still active)
      IF v_current_date = v_today OR v_current_date = v_yesterday THEN
        v_last_date := v_current_date;
        v_current_streak := 1;
      ELSE
        -- Streak is broken because most recent FP was not today or yesterday
        v_current_streak := 0;
        EXIT;
      END IF;
    ELSE
      -- Check if there's a gap of more than 1 day
      IF v_current_date + 1 < v_last_date THEN
        v_gap := TRUE;
        EXIT; -- Break the loop, streak is broken
      ELSE
        -- Increment streak only if it's a different date
        IF v_current_date != v_last_date THEN
          v_current_streak := v_current_streak + 1;
        END IF;
        v_last_date := v_current_date;
      END IF;
    END IF;
  END LOOP;
  
  -- Update user's burn streak
  UPDATE users
  SET burn_streak = v_current_streak
  WHERE id = p_user_id;
  
  v_result := jsonb_build_object(
    'success', TRUE,
    'user_id', p_user_id,
    'old_streak', v_old_streak,
    'new_streak', v_current_streak,
    'dates_found', array_length(v_dates, 1),
    'most_recent_date', v_dates[array_length(v_dates, 1)]
  );
  
  RETURN v_result;
END;
$$;