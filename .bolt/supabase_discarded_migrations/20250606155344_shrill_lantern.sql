/*
  # Fix Challenge Actions Counter

  1. New Functions
    - `update_challenge_action_count()` - Trigger function to increment challenge_actions in all_user_insights
    - `recalculate_challenge_actions()` - Function to recalculate historical challenge action counts

  2. Triggers
    - Add trigger on chat_messages table to track verification posts
    
  3. Data Fix
    - Includes function to recalculate historical data
*/

-- Create or replace the trigger function to update challenge_actions count
CREATE OR REPLACE FUNCTION public.update_challenge_action_count()
RETURNS TRIGGER AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  insight_record RECORD;
BEGIN
  -- Only proceed if this is a verification message
  IF NEW.is_verification = TRUE THEN
    -- Get or create today's insight record
    SELECT * INTO insight_record 
    FROM all_user_insights 
    WHERE date = today_date;
    
    IF NOT FOUND THEN
      -- Create a new record for today if it doesn't exist
      INSERT INTO all_user_insights (date, challenge_actions)
      VALUES (today_date, 1);
    ELSE
      -- Update the existing record
      UPDATE all_user_insights
      SET challenge_actions = COALESCE(challenge_actions, 0) + 1
      WHERE date = today_date;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger on chat_messages to track verification posts
DROP TRIGGER IF EXISTS track_challenge_actions_trigger ON public.chat_messages;
CREATE TRIGGER track_challenge_actions_trigger
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_challenge_action_count();

-- Function to recalculate historical challenge actions
CREATE OR REPLACE FUNCTION public.recalculate_challenge_actions()
RETURNS VOID AS $$
DECLARE
  day_record RECORD;
  verification_count INTEGER;
BEGIN
  -- Loop through each day in all_user_insights
  FOR day_record IN SELECT date FROM all_user_insights ORDER BY date
  LOOP
    -- Count verification messages for that day
    SELECT COUNT(*) INTO verification_count
    FROM chat_messages
    WHERE 
      is_verification = TRUE AND
      DATE(created_at) = day_record.date;
    
    -- Update the record with the correct count
    UPDATE all_user_insights
    SET challenge_actions = verification_count
    WHERE date = day_record.date;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the recalculation function to fix historical data
SELECT public.recalculate_challenge_actions();

-- Add comment to the trigger function
COMMENT ON FUNCTION public.update_challenge_action_count() IS 
  'Increments the challenge_actions counter in all_user_insights when a verification message is posted';

-- Add comment to the recalculation function
COMMENT ON FUNCTION public.recalculate_challenge_actions() IS
  'Recalculates historical challenge action counts based on verification messages';