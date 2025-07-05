-- First, drop all conflicting burn streak triggers with CASCADE to handle dependencies
DROP TRIGGER IF EXISTS update_burn_streak_on_daily_fp_trigger ON public.daily_fp CASCADE;
DROP TRIGGER IF EXISTS update_burn_streak_on_daily_fp_trigger_v2 ON public.daily_fp CASCADE;
DROP TRIGGER IF EXISTS update_burn_streak_on_fp_earned_trigger ON public.fp_earnings CASCADE;
DROP TRIGGER IF EXISTS update_burn_streak_on_fp_earned_trigger_v2 ON public.fp_earnings CASCADE;
DROP TRIGGER IF EXISTS update_burn_streak_on_boost_trigger ON public.completed_boosts CASCADE;
DROP TRIGGER IF EXISTS update_burn_streak_on_boost_trigger_v2 ON public.completed_boosts CASCADE;
DROP TRIGGER IF EXISTS update_burn_streak_consolidated_trigger ON public.completed_boosts CASCADE;
DROP TRIGGER IF EXISTS update_burn_streak_from_boosts_trigger ON public.completed_boosts CASCADE;
DROP TRIGGER IF EXISTS update_burn_streak_from_completed_boosts_trigger ON public.completed_boosts CASCADE;

-- Drop any existing burn streak functions with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS public.update_burn_streak_consolidated() CASCADE;
DROP FUNCTION IF EXISTS public.update_burn_streak_consolidated_v2() CASCADE;
DROP FUNCTION IF EXISTS public.update_burn_streak_consolidated_v3() CASCADE;
DROP FUNCTION IF EXISTS public.update_burn_streak_from_boosts() CASCADE;
DROP FUNCTION IF EXISTS public.update_burn_streak_from_completed_boosts() CASCADE;
DROP FUNCTION IF EXISTS public.update_burn_streak_on_boost() CASCADE;
DROP FUNCTION IF EXISTS public.update_burn_streak_on_daily_fp() CASCADE;
DROP FUNCTION IF EXISTS public.update_burn_streak_on_fp_earned() CASCADE;

-- Create a new function to calculate burn streak based on consecutive days with completed boosts
CREATE OR REPLACE FUNCTION public.calculate_burn_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_current_date DATE := CURRENT_DATE;
  v_check_date DATE := CURRENT_DATE;
  v_has_boost BOOLEAN;
  v_max_days_to_check INTEGER := 100; -- Safety limit to prevent infinite loops
  v_days_checked INTEGER := 0;
BEGIN
  -- Start with today and work backwards
  LOOP
    -- Check if user has any completed boosts for the current check date
    SELECT EXISTS (
      SELECT 1 
      FROM completed_boosts 
      WHERE user_id = p_user_id 
      AND completed_date = v_check_date
    ) INTO v_has_boost;
    
    -- If no boost for this day, break the loop (streak is broken)
    IF NOT v_has_boost THEN
      EXIT;
    END IF;
    
    -- Increment streak counter
    v_streak := v_streak + 1;
    
    -- Move to previous day
    v_check_date := v_check_date - INTERVAL '1 day';
    
    -- Safety check to prevent infinite loops
    v_days_checked := v_days_checked + 1;
    IF v_days_checked >= v_max_days_to_check THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to recalculate burn streak for a specific user
CREATE OR REPLACE FUNCTION public.recalculate_burn_streak(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_old_streak INTEGER;
  v_new_streak INTEGER;
  v_longest_streak INTEGER;
BEGIN
  -- Get current streak value
  SELECT burn_streak, longest_burn_streak INTO v_old_streak, v_longest_streak
  FROM users
  WHERE id = p_user_id;
  
  -- Calculate new streak
  v_new_streak := public.calculate_burn_streak(p_user_id);
  
  -- Update user's burn streak
  UPDATE users
  SET 
    burn_streak = v_new_streak,
    -- Update longest streak if new streak is higher
    longest_burn_streak = GREATEST(COALESCE(longest_burn_streak, 0), v_new_streak)
  WHERE id = p_user_id;
  
  -- Log the change for debugging
  INSERT INTO manual_burn_streak_fixes (
    user_id, 
    previous_streak, 
    new_streak, 
    previous_longest,
    new_longest,
    reason
  ) VALUES (
    p_user_id,
    v_old_streak,
    v_new_streak,
    v_longest_streak,
    GREATEST(COALESCE(v_longest_streak, 0), v_new_streak),
    'Automatic recalculation via recalculate_burn_streak function'
  );
  
  -- Return the results
  RETURN jsonb_build_object(
    'success', TRUE,
    'user_id', p_user_id,
    'previous_streak', v_old_streak,
    'new_streak', v_new_streak,
    'previous_longest', v_longest_streak,
    'new_longest', GREATEST(COALESCE(v_longest_streak, 0), v_new_streak)
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM,
    'user_id', p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to recalculate burn streaks for all users
CREATE OR REPLACE FUNCTION public.recalculate_all_burn_streaks()
RETURNS JSONB AS $$
DECLARE
  v_user RECORD;
  v_success_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_results JSONB := '[]'::JSONB;
  v_result JSONB;
BEGIN
  -- Process each user
  FOR v_user IN SELECT id FROM users LOOP
    -- Recalculate streak for this user
    v_result := public.recalculate_burn_streak(v_user.id);
    
    -- Add to results array
    v_results := v_results || v_result;
    
    -- Count successes and errors
    IF (v_result->>'success')::BOOLEAN THEN
      v_success_count := v_success_count + 1;
    ELSE
      v_error_count := v_error_count + 1;
    END IF;
  END LOOP;
  
  -- Return summary
  RETURN jsonb_build_object(
    'success', TRUE,
    'total_users', v_success_count + v_error_count,
    'success_count', v_success_count,
    'error_count', v_error_count,
    'results', v_results
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to fix a specific user's burn streak by email
CREATE OR REPLACE FUNCTION public.fix_specific_user_burn_streak(p_email TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- Find user by email
  SELECT id INTO v_user_id
  FROM users
  WHERE email = p_email;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'User not found with email: ' || p_email
    );
  END IF;
  
  -- Recalculate streak for this user
  v_result := public.recalculate_burn_streak(v_user_id);
  
  -- Return result
  RETURN jsonb_build_object(
    'success', TRUE,
    'user_email', p_email,
    'user_id', v_user_id,
    'result', v_result
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM,
    'email', p_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to fix all user burn streaks
CREATE OR REPLACE FUNCTION public.fix_all_user_burn_streaks()
RETURNS JSONB AS $$
BEGIN
  RETURN public.recalculate_all_burn_streaks();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger function to update burn streak when a boost is completed
CREATE OR REPLACE FUNCTION public.update_burn_streak_on_boost_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate and update the user's burn streak
  PERFORM public.recalculate_burn_streak(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add the trigger to the completed_boosts table
CREATE TRIGGER update_burn_streak_on_boost_completion_trigger
AFTER INSERT ON public.completed_boosts
FOR EACH ROW
EXECUTE FUNCTION public.update_burn_streak_on_boost_completion();

-- Create a function to reset burn streaks for users who missed a day
CREATE OR REPLACE FUNCTION public.reset_missed_burn_streaks()
RETURNS JSONB AS $$
DECLARE
  v_user RECORD;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_reset_count INTEGER := 0;
  v_results JSONB := '[]'::JSONB;
BEGIN
  -- Find users who have a burn streak > 0 but no completed boosts yesterday
  FOR v_user IN 
    SELECT u.id, u.burn_streak
    FROM users u
    WHERE u.burn_streak > 0
    AND NOT EXISTS (
      SELECT 1 
      FROM completed_boosts cb 
      WHERE cb.user_id = u.id 
      AND cb.completed_date = v_yesterday
    )
  LOOP
    -- Reset burn streak to 0
    UPDATE users
    SET burn_streak = 0
    WHERE id = v_user.id;
    
    -- Log the reset
    INSERT INTO manual_burn_streak_fixes (
      user_id, 
      previous_streak, 
      new_streak, 
      reason
    ) VALUES (
      v_user.id,
      v_user.burn_streak,
      0,
      'Automatic reset due to missed day'
    );
    
    -- Add to results
    v_results := v_results || jsonb_build_object(
      'user_id', v_user.id,
      'previous_streak', v_user.burn_streak,
      'new_streak', 0
    );
    
    v_reset_count := v_reset_count + 1;
  END LOOP;
  
  -- Return summary
  RETURN jsonb_build_object(
    'success', TRUE,
    'reset_count', v_reset_count,
    'date_checked', v_yesterday,
    'results', v_results
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the specific user mentioned in the issue
SELECT public.recalculate_burn_streak('9e0569eb-68d5-45df-9358-791dd0ec565f');

-- Run the fix for all users to correct existing data
SELECT public.fix_all_user_burn_streaks();