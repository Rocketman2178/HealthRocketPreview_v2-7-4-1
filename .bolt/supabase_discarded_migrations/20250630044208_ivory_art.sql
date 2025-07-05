/*
  # Fix Quest Eligibility Check

  1. New Functions
    - Create a simplified function to check if a user has completed any challenge
    - Update the quest eligibility logic to properly check completed challenges

  2. Security
    - No changes to security policies

  3. Changes
    - Fix the has_completed_any_challenge function to properly check all possible ways a challenge can be completed
    - Ensure the function doesn't try to filter by status in the completed_challenges table
*/

-- Create a simplified function to check if a user has completed any challenge
CREATE OR REPLACE FUNCTION has_completed_any_challenge(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_completed BOOLEAN := FALSE;
BEGIN
  -- Check completed_challenges table first (without filtering by status)
  SELECT EXISTS (
    SELECT 1 FROM completed_challenges
    WHERE user_id = p_user_id
    LIMIT 1
  ) INTO v_has_completed;
  
  -- If not found in completed_challenges, check challenges table for completed challenges
  IF NOT v_has_completed THEN
    SELECT EXISTS (
      SELECT 1 FROM challenges
      WHERE user_id = p_user_id
      AND status = 'completed'
      LIMIT 1
    ) INTO v_has_completed;
  END IF;
  
  -- If still not found, check for Morning Basics with verification_count >= 21
  IF NOT v_has_completed THEN
    SELECT EXISTS (
      SELECT 1 FROM challenges
      WHERE user_id = p_user_id
      AND challenge_id = 'mb0'
      AND verification_count >= 21
      LIMIT 1
    ) INTO v_has_completed;
  END IF;
  
  RETURN v_has_completed;
EXCEPTION
  WHEN OTHERS THEN
    -- On error, return false
    RETURN FALSE;
END;
$$;

-- Log the function creation
INSERT INTO debug_logs (
  operation,
  table_name,
  record_id,
  details,
  success
)
VALUES (
  'create_function',
  'functions',
  'has_completed_any_challenge',
  jsonb_build_object(
    'description', 'Created simplified function to check if a user has completed any challenge',
    'timestamp', NOW()
  ),
  TRUE
);