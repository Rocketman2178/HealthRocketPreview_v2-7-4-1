-- Create a one-time function with a unique name to fix a specific user's burn streak
CREATE OR REPLACE FUNCTION fix_user_burn_streak_20250624(
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_streak INTEGER;
  v_longest_streak INTEGER;
  v_new_streak INTEGER := 22; -- Set to 22 as requested
BEGIN
  -- Get current values
  SELECT burn_streak, longest_burn_streak 
  INTO v_old_streak, v_longest_streak
  FROM users
  WHERE id = p_user_id;
  
  -- Update the user's burn streak
  UPDATE users
  SET 
    burn_streak = v_new_streak,
    longest_burn_streak = GREATEST(COALESCE(longest_burn_streak, 0), v_new_streak)
  WHERE id = p_user_id;
  
  -- Return the result
  RETURN jsonb_build_object(
    'success', TRUE,
    'user_id', p_user_id,
    'old_streak', v_old_streak,
    'new_streak', v_new_streak,
    'longest_streak', v_longest_streak,
    'updated_longest_streak', GREATEST(COALESCE(v_longest_streak, 0), v_new_streak)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', SQLERRM
    );
END;
$$;

-- Fix the specific user mentioned with explicit type cast
DO $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT fix_user_burn_streak_20250624('82ecf5cb-7b60-4ea7-9c3c-c31655cd1964'::UUID) INTO v_result;
  
  -- Log the result
  INSERT INTO public.debug_logs (
    operation,
    table_name,
    record_id,
    details,
    success
  ) VALUES (
    'fix_user_burn_streak',
    'users',
    '82ecf5cb-7b60-4ea7-9c3c-c31655cd1964',
    v_result,
    (v_result->>'success')::BOOLEAN
  );
END $$;

-- Clean up the function after use
DROP FUNCTION IF EXISTS fix_user_burn_streak_20250624(UUID);