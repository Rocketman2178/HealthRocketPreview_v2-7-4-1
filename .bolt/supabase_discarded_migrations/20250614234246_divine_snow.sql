-- Create debug table for burn streak calculation if it doesn't exist
CREATE TABLE IF NOT EXISTS public.burn_streak_debug_logs (
  user_id UUID PRIMARY KEY,
  calculated_streak INTEGER,
  debug_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create an improved function to calculate a user's burn streak based on fp_earnings records
CREATE OR REPLACE FUNCTION public.calculate_burn_streak_from_fp_earnings(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_streak INTEGER := 0;
  v_date_record RECORD;
  v_last_date DATE := NULL;
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_debug_info JSONB := '{}';
  v_dates_array TEXT[] := '{}';
BEGIN
  -- Get all dates where the user completed at least one boost, ordered by most recent first
  FOR v_date_record IN 
    SELECT DISTINCT DATE(earned_at) as date
    FROM fp_earnings
    WHERE user_id = p_user_id
      AND item_type = 'boost'
    ORDER BY date DESC
  LOOP
    -- Add date to debug array
    v_dates_array := array_append(v_dates_array, v_date_record.date::TEXT);
    
    -- If this is the first record we're processing
    IF v_last_date IS NULL THEN
      v_last_date := v_date_record.date;
      v_current_streak := 1;
    -- If this date is exactly one day before the last date, increment streak
    ELSIF v_date_record.date = v_last_date - INTERVAL '1 day' THEN
      v_current_streak := v_current_streak + 1;
      v_last_date := v_date_record.date;
    -- Otherwise, break the streak (gap in consecutive days)
    ELSE
      -- Add debug info about the break
      v_debug_info := jsonb_set(v_debug_info, '{streak_break}', to_jsonb(v_date_record.date));
      v_debug_info := jsonb_set(v_debug_info, '{last_date}', to_jsonb(v_last_date));
      EXIT;
    END IF;
  END LOOP;
  
  -- If the most recent date with boosts is before yesterday, streak should be 0
  -- (unless there's activity today, which would make it 1)
  IF v_last_date IS NOT NULL AND v_last_date < v_yesterday THEN
    -- Check if there's a record for today with boosts
    IF EXISTS (
      SELECT 1 
      FROM fp_earnings 
      WHERE user_id = p_user_id 
        AND DATE(earned_at) = v_today
        AND item_type = 'boost'
    ) THEN
      -- If there are boosts today but nothing yesterday, streak is 1
      v_current_streak := 1;
      v_debug_info := jsonb_set(v_debug_info, '{reset_reason}', '"Today active but gap before"'::jsonb);
    ELSE
      -- If no boosts today and last boost was before yesterday, streak is 0
      v_current_streak := 0;
      v_debug_info := jsonb_set(v_debug_info, '{reset_reason}', '"No recent activity"'::jsonb);
    END IF;
  END IF;
  
  -- Add final debug info
  v_debug_info := jsonb_set(v_debug_info, '{dates}', to_jsonb(v_dates_array));
  v_debug_info := jsonb_set(v_debug_info, '{final_streak}', to_jsonb(v_current_streak));
  v_debug_info := jsonb_set(v_debug_info, '{calculation_source}', '"fp_earnings"'::jsonb);
  
  -- Log debug info for troubleshooting
  INSERT INTO burn_streak_debug_logs (
    user_id, 
    calculated_streak, 
    debug_info
  ) VALUES (
    p_user_id, 
    v_current_streak, 
    v_debug_info
  ) ON CONFLICT (user_id) DO UPDATE 
    SET calculated_streak = v_current_streak,
        debug_info = v_debug_info,
        updated_at = now();
  
  RETURN v_current_streak;
END;
$$;

-- Create a function to fix all users' burn streaks using fp_earnings
CREATE OR REPLACE FUNCTION public.fix_all_burn_streaks_from_fp_earnings()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_record RECORD;
  v_correct_streak INTEGER;
  v_updated_count INTEGER := 0;
  v_result JSONB;
  v_start_time TIMESTAMP := clock_timestamp();
  v_end_time TIMESTAMP;
  v_duration INTERVAL;
BEGIN
  -- Process each user who has fp_earnings records with boost type
  FOR v_user_record IN 
    SELECT DISTINCT user_id 
    FROM fp_earnings
    WHERE item_type = 'boost'
  LOOP
    -- Calculate the correct burn streak
    v_correct_streak := calculate_burn_streak_from_fp_earnings(v_user_record.user_id);
    
    -- Update if different from current value
    UPDATE users
    SET burn_streak = v_correct_streak
    WHERE id = v_user_record.user_id
      AND COALESCE(burn_streak, 0) != v_correct_streak;
    
    IF FOUND THEN
      v_updated_count := v_updated_count + 1;
    END IF;
  END LOOP;
  
  -- Also check users who might have a burn streak but no fp_earnings records
  FOR v_user_record IN 
    SELECT id 
    FROM users
    WHERE burn_streak > 0
      AND NOT EXISTS (
        SELECT 1 
        FROM fp_earnings 
        WHERE user_id = users.id
          AND item_type = 'boost'
      )
  LOOP
    -- Reset streak to 0 since there are no fp_earnings records
    UPDATE users
    SET burn_streak = 0
    WHERE id = v_user_record.id;
    
    v_updated_count := v_updated_count + 1;
  END LOOP;
  
  -- Calculate execution time
  v_end_time := clock_timestamp();
  v_duration := v_end_time - v_start_time;
  
  -- Return result
  v_result := jsonb_build_object(
    'success', TRUE,
    'users_updated', v_updated_count,
    'execution_time_ms', extract(epoch from v_duration) * 1000
  );
  
  RETURN v_result;
END;
$$;

-- Create a function to fix a specific user's burn streak using fp_earnings
CREATE OR REPLACE FUNCTION public.fix_user_burn_streak_from_fp_earnings(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_correct_streak INTEGER;
  v_current_streak INTEGER;
  v_result JSONB;
  v_dates_with_boosts JSONB;
BEGIN
  -- Get current streak
  SELECT burn_streak INTO v_current_streak
  FROM users
  WHERE id = p_user_id;
  
  -- Get dates with boosts for debugging
  -- Fixed: Use a subquery to get the dates and then aggregate them
  SELECT jsonb_agg(subquery.date_str)
  INTO v_dates_with_boosts
  FROM (
    SELECT DISTINCT DATE(earned_at)::TEXT as date_str
    FROM fp_earnings
    WHERE user_id = p_user_id
      AND item_type = 'boost'
    ORDER BY date_str DESC
  ) subquery;
  
  -- Calculate correct streak
  v_correct_streak := calculate_burn_streak_from_fp_earnings(p_user_id);
  
  -- Update if different
  IF v_correct_streak != COALESCE(v_current_streak, 0) THEN
    UPDATE users
    SET burn_streak = v_correct_streak
    WHERE id = p_user_id;
    
    v_result := jsonb_build_object(
      'success', TRUE,
      'user_id', p_user_id,
      'old_streak', v_current_streak,
      'new_streak', v_correct_streak,
      'updated', TRUE,
      'dates_with_boosts', v_dates_with_boosts
    );
  ELSE
    v_result := jsonb_build_object(
      'success', TRUE,
      'user_id', p_user_id,
      'streak', v_current_streak,
      'updated', FALSE,
      'dates_with_boosts', v_dates_with_boosts
    );
  END IF;
  
  RETURN v_result;
END;
$$;

-- Improve the update_burn_streak trigger function to ALWAYS increment on first boost
CREATE OR REPLACE FUNCTION public.update_burn_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_streak INTEGER;
  v_today DATE := CURRENT_DATE;
  v_first_boost_today BOOLEAN;
BEGIN
  -- Check if this is the first boost completed today
  SELECT NOT EXISTS (
    SELECT 1 
    FROM completed_boosts 
    WHERE user_id = NEW.user_id 
      AND completed_date = NEW.completed_date 
      AND id != NEW.id
  ) INTO v_first_boost_today;
  
  -- Only proceed if this is the first boost of the day
  IF v_first_boost_today THEN
    -- Get the user's current burn streak
    SELECT burn_streak INTO v_current_streak
    FROM users
    WHERE id = NEW.user_id;
    
    v_current_streak := COALESCE(v_current_streak, 0);
    
    -- ALWAYS increment streak by 1 for the first boost of the day
    UPDATE users
    SET burn_streak = v_current_streak + 1
    WHERE id = NEW.user_id;
    
    -- Log this update for debugging
    INSERT INTO burn_streak_debug_logs (
      user_id, 
      calculated_streak, 
      debug_info
    ) VALUES (
      NEW.user_id, 
      v_current_streak + 1, 
      jsonb_build_object(
        'trigger_update', true,
        'previous_streak', v_current_streak,
        'new_streak', v_current_streak + 1,
        'boost_id', NEW.boost_id,
        'completed_date', NEW.completed_date,
        'source', 'trigger_function'
      )
    ) ON CONFLICT (user_id) DO UPDATE 
      SET calculated_streak = v_current_streak + 1,
          debug_info = jsonb_build_object(
            'trigger_update', true,
            'previous_streak', v_current_streak,
            'new_streak', v_current_streak + 1,
            'boost_id', NEW.boost_id,
            'completed_date', NEW.completed_date,
            'source', 'trigger_function'
          ),
          updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create a function to check and reset burn streaks for users who haven't earned FP today
CREATE OR REPLACE FUNCTION public.check_and_reset_burn_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_user_record RECORD;
BEGIN
  -- Find users who had activity yesterday but not today
  FOR v_user_record IN
    SELECT DISTINCT u.id, u.burn_streak
    FROM users u
    WHERE u.burn_streak > 0
      AND NOT EXISTS (
        -- No FP earnings today
        SELECT 1 
        FROM fp_earnings 
        WHERE user_id = u.id 
          AND DATE(earned_at) = CURRENT_DATE
      )
      AND EXISTS (
        -- Had FP earnings yesterday
        SELECT 1 
        FROM fp_earnings 
        WHERE user_id = u.id 
          AND DATE(earned_at) = v_yesterday
      )
  LOOP
    -- Reset burn streak to 0
    UPDATE users
    SET burn_streak = 0
    WHERE id = v_user_record.id;
    
    -- Log this reset for debugging
    INSERT INTO burn_streak_debug_logs (
      user_id, 
      calculated_streak, 
      debug_info
    ) VALUES (
      v_user_record.id, 
      0, 
      jsonb_build_object(
        'reset_reason', 'No activity today',
        'previous_streak', v_user_record.burn_streak,
        'reset_date', CURRENT_DATE,
        'source', 'reset_trigger'
      )
    ) ON CONFLICT (user_id) DO UPDATE 
      SET calculated_streak = 0,
          debug_info = jsonb_build_object(
            'reset_reason', 'No activity today',
            'previous_streak', v_user_record.burn_streak,
            'reset_date', CURRENT_DATE,
            'source', 'reset_trigger'
          ),
          updated_at = now();
  END LOOP;
  
  RETURN NULL;
END;
$$;

-- Create a scheduled trigger to run the check_and_reset_burn_streak function daily
DO $$
BEGIN
  -- Check if the trigger already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'daily_burn_streak_reset_trigger'
  ) THEN
    -- Create the trigger
    CREATE TRIGGER daily_burn_streak_reset_trigger
    AFTER INSERT ON daily_fp
    FOR EACH STATEMENT
    EXECUTE FUNCTION check_and_reset_burn_streak();
  END IF;
END
$$;

-- Fix the specific user mentioned in the issue
SELECT fix_user_burn_streak_from_fp_earnings('6cd3006b-22ba-4beb-8134-30a55899eaa1');

-- Run the fix for all users
SELECT fix_all_burn_streaks_from_fp_earnings();