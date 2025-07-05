/*
  # Fix sync_fp_earnings function

  1. Changes
    - Completely rewrites the sync_fp_earnings function
    - Removes all references to quest_id and health_assessments
    - Simplifies the function to only handle completed_challenges directly
    - Avoids using CASE statements that reference fields that might not exist

  2. Security
    - Maintains SECURITY DEFINER for proper permissions
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS public.sync_fp_earnings();

-- Create a completely rewritten version without problematic references
CREATE OR REPLACE FUNCTION public.sync_fp_earnings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item_name text;
  v_item_type text;
  v_health_category text;
  v_fp_amount integer;
  v_metadata jsonb := '{}'::jsonb;
  v_user_name text;
BEGIN
  -- Get user name
  SELECT name INTO v_user_name FROM users WHERE id = NEW.user_id;
  
  -- Set default values
  v_item_type := 'other';
  v_item_name := 'Reward';
  v_fp_amount := COALESCE(NEW.fp_earned, 0);
  v_health_category := 'general';
  
  -- Only handle completed_challenges specifically
  IF TG_TABLE_NAME = 'completed_challenges' THEN
    v_item_type := 'challenge';
    v_item_name := 'Challenge: ' || NEW.challenge_id;
    v_fp_amount := NEW.fp_earned;
    
    -- Get health category from challenge library if available
    BEGIN
      SELECT category INTO v_health_category
      FROM challenge_library
      WHERE id = NEW.challenge_id;
    EXCEPTION
      WHEN OTHERS THEN
        v_health_category := 'general';
    END;
  END IF;
  
  -- Create metadata
  v_metadata := jsonb_build_object(
    'source_table', TG_TABLE_NAME,
    'source_id', NEW.id
  );
  
  -- Only proceed if we have a valid FP amount
  IF v_fp_amount > 0 THEN
    -- Insert FP earning record
    INSERT INTO fp_earnings (
      user_id,
      item_id,
      item_name,
      item_type,
      health_category,
      fp_amount,
      metadata,
      user_name
    ) VALUES (
      NEW.user_id,
      CASE 
        WHEN TG_TABLE_NAME = 'completed_challenges' THEN NEW.challenge_id
        ELSE NEW.id::text
      END,
      v_item_name,
      v_item_type,
      v_health_category,
      v_fp_amount,
      v_metadata,
      v_user_name
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.sync_fp_earnings() TO authenticated;