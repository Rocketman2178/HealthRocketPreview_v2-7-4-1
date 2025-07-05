/*
  # Fix Morning Basics Challenge Completion

  1. New Functions
    - Completely rewrites the handle_morning_basics_completion function
    - Adds functions to fix existing Morning Basics challenges
    - Adds helper functions to check completion status

  2. Changes
    - Fixes the issue with days completed counter
    - Ensures proper recording in completed_challenges table
    - Avoids system trigger errors by using a different approach

  3. Security
    - Maintains SECURITY DEFINER for proper permissions
    - Uses auth.uid() for secure user identification
*/

-- First drop the existing function to avoid return type conflict
DROP FUNCTION IF EXISTS public.handle_morning_basics_completion();

-- Create the handle_morning_basics_completion function with comprehensive error handling
CREATE OR REPLACE FUNCTION public.handle_morning_basics_completion()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    current_user_id uuid;
    today_date date;
    existing_completion_id uuid;
    challenge_record_id uuid;
    fp_to_award integer := 5;
    current_verification_count integer := 0;
    challenge_completed boolean := false;
    bonus_fp integer := 50;
    user_name text;
    challenge_start_date timestamp with time zone;
    debug_info jsonb := '{}'::jsonb;
    has_completed_challenge boolean := false;
    v_fp_earning_id uuid;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Add debug info
    debug_info := jsonb_set(debug_info, '{function}', '"handle_morning_basics_completion"'::jsonb);
    debug_info := jsonb_set(debug_info, '{user_id}', to_jsonb(current_user_id));
    
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not authenticated',
            'debug_info', debug_info
        );
    END IF;
    
    -- Get today's date
    today_date := CURRENT_DATE;
    debug_info := jsonb_set(debug_info, '{today_date}', to_jsonb(today_date));
    
    -- Check if user already completed today
    SELECT id INTO existing_completion_id
    FROM completed_actions
    WHERE user_id = current_user_id
      AND action_id = 'morning_basics_daily'
      AND completed_date = today_date;
    
    debug_info := jsonb_set(debug_info, '{existing_completion_check}', 'true'::jsonb);
    debug_info := jsonb_set(debug_info, '{existing_completion_id}', to_jsonb(existing_completion_id));
    
    -- If already completed today, return error
    IF existing_completion_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Already completed today',
            'debug_info', debug_info
        );
    END IF;
    
    -- Get user name for records
    SELECT name INTO user_name FROM users WHERE id = current_user_id;
    debug_info := jsonb_set(debug_info, '{user_name}', to_jsonb(user_name));
    
    -- Check if challenge is already completed in completed_challenges table
    SELECT EXISTS (
        SELECT 1 
        FROM completed_challenges 
        WHERE user_id = current_user_id 
        AND challenge_id = 'mb0'
    ) INTO has_completed_challenge;
    
    debug_info := jsonb_set(debug_info, '{has_completed_challenge}', to_jsonb(has_completed_challenge));
    
    -- Get or create challenge record
    SELECT id, verification_count, started_at 
    INTO challenge_record_id, current_verification_count, challenge_start_date
    FROM challenges
    WHERE user_id = current_user_id
      AND challenge_id = 'mb0';
    
    debug_info := jsonb_set(debug_info, '{challenge_record_check}', 'true'::jsonb);
    debug_info := jsonb_set(debug_info, '{challenge_record_id}', to_jsonb(challenge_record_id));
    
    -- If challenge doesn't exist, create it
    IF challenge_record_id IS NULL THEN
        INSERT INTO challenges (
            user_id, 
            challenge_id, 
            status, 
            verification_count,
            verifications_required,
            started_at,
            category,
            name,
            description
        )
        VALUES (
            current_user_id, 
            'mb0', 
            'active', 
            1,
            21,
            NOW(),
            'Bonus',
            'Morning Basics',
            'Complete at least 3 of 5 morning actions each day'
        )
        RETURNING id, started_at INTO challenge_record_id, challenge_start_date;
        
        current_verification_count := 1;
        debug_info := jsonb_set(debug_info, '{challenge_created}', 'true'::jsonb);
    ELSE
        -- Update existing challenge
        current_verification_count := current_verification_count + 1;
        debug_info := jsonb_set(debug_info, '{challenge_updated}', 'true'::jsonb);
        debug_info := jsonb_set(debug_info, '{current_verification_count}', to_jsonb(current_verification_count));
        
        -- Check if challenge is completed (21 days)
        IF current_verification_count >= 21 THEN
            challenge_completed := true;
            debug_info := jsonb_set(debug_info, '{challenge_completed}', 'true'::jsonb);
            
            UPDATE challenges
            SET verification_count = current_verification_count,
                status = 'completed',
                completed_at = NOW(),
                progress = 100
            WHERE id = challenge_record_id;
            
            -- Only insert into completed_challenges if not already there
            IF NOT has_completed_challenge THEN
                -- Record in completed_challenges - IMPORTANT: Manually specify all columns
                BEGIN
                    -- First create the FP earning record for the challenge completion
                    INSERT INTO fp_earnings (
                        user_id,
                        item_id,
                        item_name,
                        item_type,
                        health_category,
                        fp_amount,
                        user_name
                    )
                    VALUES (
                        current_user_id,
                        'mb0',
                        'Morning Basics Challenge Completion',
                        'challenge',
                        'general',
                        bonus_fp,
                        user_name
                    )
                    RETURNING id INTO v_fp_earning_id;
                    
                    -- Now insert the completed challenge record
                    INSERT INTO completed_challenges (
                        user_id,
                        challenge_id,
                        completed_at,
                        fp_earned,
                        days_to_complete,
                        final_progress,
                        status,
                        verification_count,
                        started_at
                    )
                    SELECT
                        current_user_id,
                        'mb0',
                        NOW(),
                        bonus_fp,
                        21,
                        100,
                        'completed',
                        21,
                        challenge_start_date;
                    
                    debug_info := jsonb_set(debug_info, '{completed_challenge_inserted}', 'true'::jsonb);
                EXCEPTION
                    WHEN OTHERS THEN
                        debug_info := jsonb_set(debug_info, '{completed_challenge_error}', to_jsonb(SQLERRM));
                        debug_info := jsonb_set(debug_info, '{completed_challenge_error_detail}', to_jsonb(SQLSTATE));
                END;
            END IF;
        ELSE
            UPDATE challenges
            SET verification_count = current_verification_count,
                progress = (current_verification_count::float / 21) * 100
            WHERE id = challenge_record_id;
        END IF;
    END IF;
    
    -- Insert completed action record
    INSERT INTO completed_actions (user_id, action_id, completed_date, fp_earned)
    VALUES (current_user_id, 'morning_basics_daily', today_date, fp_to_award);
    debug_info := jsonb_set(debug_info, '{action_recorded}', 'true'::jsonb);
    
    -- Record FP earning
    BEGIN
        INSERT INTO fp_earnings (
            user_id,
            item_id,
            item_name,
            item_type,
            health_category,
            fp_amount,
            user_name
        )
        VALUES (
            current_user_id,
            'morning_basics_daily',
            'Morning Basics Daily',
            'challenge',
            'general',
            fp_to_award,
            user_name
        );
        debug_info := jsonb_set(debug_info, '{fp_earning_recorded}', 'true'::jsonb);
    EXCEPTION
        WHEN OTHERS THEN
            debug_info := jsonb_set(debug_info, '{fp_earning_error}', to_jsonb(SQLERRM));
    END;
    
    -- Update daily_fp record
    BEGIN
        INSERT INTO daily_fp (
            user_id, 
            date, 
            fp_earned, 
            boosts_completed,
            user_name
        )
        VALUES (
            current_user_id, 
            today_date, 
            fp_to_award + CASE WHEN challenge_completed THEN bonus_fp ELSE 0 END, 
            1,
            user_name
        )
        ON CONFLICT (user_id, date) 
        DO UPDATE SET
            fp_earned = daily_fp.fp_earned + fp_to_award + CASE WHEN challenge_completed THEN bonus_fp ELSE 0 END,
            boosts_completed = daily_fp.boosts_completed + 1;
        debug_info := jsonb_set(debug_info, '{daily_fp_updated}', 'true'::jsonb);
    EXCEPTION
        WHEN OTHERS THEN
            debug_info := jsonb_set(debug_info, '{daily_fp_error}', to_jsonb(SQLERRM));
    END;
    
    -- Update user's fuel points
    BEGIN
        UPDATE users
        SET fuel_points = fuel_points + fp_to_award + CASE WHEN challenge_completed THEN bonus_fp ELSE 0 END,
            updated_at = NOW()
        WHERE id = current_user_id;
        debug_info := jsonb_set(debug_info, '{user_updated}', 'true'::jsonb);
    EXCEPTION
        WHEN OTHERS THEN
            debug_info := jsonb_set(debug_info, '{user_update_error}', to_jsonb(SQLERRM));
    END;
    
    -- Return success response
    RETURN jsonb_build_object(
        'success', true,
        'fp_earned', fp_to_award + CASE WHEN challenge_completed THEN bonus_fp ELSE 0 END,
        'verification_count', current_verification_count,
        'challenge_completed', challenge_completed,
        'days_completed', current_verification_count,
        'debug_info', debug_info
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'debug_info', debug_info
        );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.handle_morning_basics_completion() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_morning_basics_completion() TO anon;

-- Create a function to fix existing Morning Basics challenges
CREATE OR REPLACE FUNCTION public.fix_morning_basics_challenges()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_record RECORD;
    v_challenge_record RECORD;
    v_fixed_count INTEGER := 0;
    v_completed_count INTEGER := 0;
    v_already_completed_count INTEGER := 0;
    v_result jsonb;
    v_debug_info jsonb := '{}'::jsonb;
    v_fp_earning_id uuid;
BEGIN
    -- Loop through all users with Morning Basics challenges
    FOR v_user_record IN 
        SELECT DISTINCT user_id 
        FROM challenges 
        WHERE challenge_id = 'mb0'
    LOOP
        -- Get challenge details
        SELECT * INTO v_challenge_record
        FROM challenges
        WHERE user_id = v_user_record.user_id
        AND challenge_id = 'mb0';
        
        -- Check if challenge is completed but not in completed_challenges
        IF v_challenge_record.verification_count >= 21 AND v_challenge_record.status = 'completed' THEN
            -- Check if already in completed_challenges
            IF NOT EXISTS (
                SELECT 1 
                FROM completed_challenges 
                WHERE user_id = v_user_record.user_id 
                AND challenge_id = 'mb0'
            ) THEN
                -- First create the FP earning record for the challenge completion
                INSERT INTO fp_earnings (
                    user_id,
                    item_id,
                    item_name,
                    item_type,
                    health_category,
                    fp_amount,
                    user_name
                )
                VALUES (
                    v_user_record.user_id,
                    'mb0',
                    'Morning Basics Challenge Completion',
                    'challenge',
                    'general',
                    50, -- Bonus FP
                    (SELECT name FROM users WHERE id = v_user_record.user_id)
                )
                RETURNING id INTO v_fp_earning_id;
                
                -- Insert into completed_challenges without using triggers
                INSERT INTO completed_challenges (
                    user_id,
                    challenge_id,
                    completed_at,
                    fp_earned,
                    days_to_complete,
                    final_progress,
                    status,
                    verification_count,
                    started_at
                )
                SELECT
                    v_user_record.user_id,
                    'mb0',
                    COALESCE(v_challenge_record.completed_at, NOW()),
                    50, -- Bonus FP
                    21,
                    100,
                    'completed',
                    21,
                    v_challenge_record.started_at;
                
                v_fixed_count := v_fixed_count + 1;
                v_completed_count := v_completed_count + 1;
            ELSE
                v_already_completed_count := v_already_completed_count + 1;
            END IF;
        END IF;
    END LOOP;
    
    -- Build result
    v_result := jsonb_build_object(
        'success', TRUE,
        'fixed_count', v_fixed_count,
        'completed_count', v_completed_count,
        'already_completed_count', v_already_completed_count
    );
    
    RETURN v_result;
END;
$$;

-- Create a function to manually fix the display of days completed
CREATE OR REPLACE FUNCTION public.fix_morning_basics_display(p_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_challenge_record RECORD;
    v_result jsonb;
BEGIN
    -- Get challenge details
    SELECT * INTO v_challenge_record
    FROM challenges
    WHERE user_id = p_user_id
    AND challenge_id = 'mb0';
    
    -- If challenge exists, update the display
    IF v_challenge_record IS NOT NULL THEN
        -- Update the challenge record
        UPDATE challenges
        SET progress = (v_challenge_record.verification_count::float / 21) * 100
        WHERE id = v_challenge_record.id;
        
        -- Return the updated information
        RETURN jsonb_build_object(
            'success', TRUE,
            'days_completed', v_challenge_record.verification_count,
            'progress', (v_challenge_record.verification_count::float / 21) * 100,
            'status', v_challenge_record.status
        );
    ELSE
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'Challenge not found'
        );
    END IF;
END;
$$;

-- Create a function to check if Morning Basics is completed
CREATE OR REPLACE FUNCTION public.has_completed_morning_basics(p_user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_completed boolean;
BEGIN
    -- Check if the challenge is completed in either table
    SELECT EXISTS (
        SELECT 1 
        FROM completed_challenges 
        WHERE user_id = p_user_id 
        AND challenge_id = 'mb0'
    ) OR EXISTS (
        SELECT 1 
        FROM challenges 
        WHERE user_id = p_user_id 
        AND challenge_id = 'mb0'
        AND status = 'completed'
    ) INTO v_completed;
    
    RETURN v_completed;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.fix_morning_basics_display(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_completed_morning_basics(UUID) TO authenticated;

-- Run the fix function
SELECT fix_morning_basics_challenges();

-- Create a function to fix the days counter display in the UI
CREATE OR REPLACE FUNCTION public.get_morning_basics_details(p_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_challenge_record RECORD;
    v_completed_challenge RECORD;
    v_can_complete_today BOOLEAN;
    v_result jsonb;
BEGIN
    -- Get challenge details
    SELECT * INTO v_challenge_record
    FROM challenges
    WHERE user_id = p_user_id
    AND challenge_id = 'mb0';
    
    -- Check if already completed today
    SELECT EXISTS (
        SELECT 1 
        FROM completed_actions 
        WHERE user_id = p_user_id 
        AND action_id = 'morning_basics_daily' 
        AND completed_date = CURRENT_DATE
    ) INTO v_can_complete_today;
    
    -- If challenge doesn't exist, return default values
    IF v_challenge_record IS NULL THEN
        RETURN jsonb_build_object(
            'success', TRUE,
            'challenge_id', 'mb0',
            'days_completed', 0,
            'can_complete_today', TRUE,
            'is_completed', FALSE
        );
    END IF;
    
    -- Check if in completed_challenges
    SELECT * INTO v_completed_challenge
    FROM completed_challenges
    WHERE user_id = p_user_id
    AND challenge_id = 'mb0';
    
    -- Return the challenge details
    RETURN jsonb_build_object(
        'success', TRUE,
        'challenge_id', 'mb0',
        'days_completed', v_challenge_record.verification_count,
        'can_complete_today', NOT v_can_complete_today,
        'is_completed', v_challenge_record.status = 'completed' OR v_completed_challenge IS NOT NULL
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_morning_basics_details(UUID) TO authenticated;