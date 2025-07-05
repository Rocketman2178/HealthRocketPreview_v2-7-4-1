/*
  # Fix New Users and Health Assessments Calculation

  1. Changes
     - Fix new_users calculation to count users created on the specific date
     - Fix health_assessments calculation to count all assessments including initial onboarding ones
  
  2. No other changes to the function
*/

-- Update the function to properly calculate new_users and health_assessments
CREATE OR REPLACE FUNCTION calculate_daily_user_insights(p_date date)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_users integer;
  v_active_users integer;
  v_new_users integer;
  v_average_health_score numeric(4,2);
  v_average_healthspan_years numeric(4,2);
  v_total_healthspan_years numeric(8,2);
  v_category_averages jsonb;
  v_total_fp_earned integer;
  v_average_fp_per_user numeric(8,2);
  v_total_boosts_completed integer;
  v_total_challenges_completed integer;
  v_total_quests_completed integer;
  v_total_contests_active integer;
  v_total_chat_messages integer;
  v_total_verification_posts integer;
  v_device_connection_stats jsonb;
  v_total_lifetime_fp integer;
  v_average_level numeric(4,2);
  v_highest_level integer;
  v_total_lifetime_boosts integer;
  v_total_lifetime_challenges integer;
  v_total_lifetime_quests integer;
  v_total_lifetime_chat_messages integer;
  v_total_lifetime_verification_posts integer;
  v_challenge_actions integer;
  v_contest_registrations integer;
  v_challenge_registrations integer;
  v_cosmo_chats integer;
  v_contest_verifications integer;
  v_health_assessments integer;
  v_existing_record_id uuid;
  v_morning_basics_actions integer;
  v_other_challenge_actions integer;
BEGIN
  -- Calculate total users
  SELECT COUNT(*) INTO v_total_users FROM users;
  
  -- Calculate active users (users who earned FP on this date)
  SELECT COUNT(DISTINCT user_id) INTO v_active_users 
  FROM daily_fp 
  WHERE date = p_date AND fp_earned > 0;
  
  -- UPDATED: Calculate new users created on this date - using DATE() function to match the exact date
  SELECT COUNT(*) INTO v_new_users 
  FROM users 
  WHERE DATE(created_at) = p_date;
  
  -- Calculate average health score and healthspan years
  SELECT 
    AVG(health_score),
    AVG(healthspan_years),
    SUM(healthspan_years)
  INTO 
    v_average_health_score,
    v_average_healthspan_years,
    v_total_healthspan_years
  FROM users;
  
  -- Calculate category averages - Using a subquery to get the latest assessment per user
  WITH latest_assessments AS (
    SELECT DISTINCT ON (user_id) 
      user_id,
      mindset_score,
      sleep_score,
      exercise_score,
      nutrition_score,
      biohacking_score
    FROM health_assessments
    WHERE DATE(created_at) <= p_date
    ORDER BY user_id, created_at DESC
  )
  SELECT jsonb_build_object(
    'mindset', AVG(mindset_score),
    'sleep', AVG(sleep_score),
    'exercise', AVG(exercise_score),
    'nutrition', AVG(nutrition_score),
    'biohacking', AVG(biohacking_score)
  ) INTO v_category_averages
  FROM latest_assessments;
  
  -- Calculate total FP earned on this date
  SELECT COALESCE(SUM(fp_earned), 0) INTO v_total_fp_earned 
  FROM daily_fp 
  WHERE date = p_date;
  
  -- Calculate average FP per user
  SELECT CASE WHEN v_active_users > 0 THEN v_total_fp_earned::numeric / v_active_users ELSE 0 END 
  INTO v_average_fp_per_user;
  
  -- Calculate total boosts completed on this date
  SELECT COUNT(*) INTO v_total_boosts_completed 
  FROM completed_boosts 
  WHERE completed_date = p_date;
  
  -- Calculate total challenges completed on this date
  SELECT COUNT(*) INTO v_total_challenges_completed 
  FROM completed_challenges 
  WHERE DATE(completed_at) = p_date;
  
  -- Calculate total quests completed on this date
  SELECT COUNT(*) INTO v_total_quests_completed 
  FROM completed_quests 
  WHERE DATE(completed_at) = p_date;
  
  -- Calculate total active contests
  SELECT COUNT(*) INTO v_total_contests_active 
  FROM active_contests 
  WHERE status = 'active' AND 
        (DATE(created_at) = p_date OR DATE(updated_at) = p_date);
  
  -- Calculate total chat messages on this date
  SELECT COUNT(*) INTO v_total_chat_messages 
  FROM chat_messages 
  WHERE DATE(created_at) = p_date;
  
  -- Calculate total verification posts on this date
  SELECT COUNT(*) INTO v_total_verification_posts 
  FROM chat_messages 
  WHERE DATE(created_at) = p_date AND is_verification = true;
  
  -- Calculate device connection stats
  SELECT jsonb_build_object(
    'total_connected', COUNT(*),
    'by_provider', COALESCE(jsonb_object_agg(provider, provider_count) FILTER (WHERE provider IS NOT NULL), '{}'::jsonb)
  ) INTO v_device_connection_stats
  FROM (
    SELECT provider, COUNT(*) as provider_count
    FROM user_devices
    WHERE status = 'active'
    GROUP BY provider
  ) as provider_stats;
  
  -- Calculate lifetime metrics
  SELECT 
    SUM(lifetime_fp),
    AVG(level),
    MAX(level)
  INTO 
    v_total_lifetime_fp,
    v_average_level,
    v_highest_level
  FROM users;
  
  -- Calculate total lifetime boosts
  SELECT COUNT(*) INTO v_total_lifetime_boosts FROM completed_boosts;
  
  -- Calculate total lifetime challenges
  SELECT COUNT(*) INTO v_total_lifetime_challenges FROM completed_challenges;
  
  -- Calculate total lifetime quests
  SELECT COUNT(*) INTO v_total_lifetime_quests FROM completed_quests;
  
  -- Calculate total lifetime chat messages
  SELECT COUNT(*) INTO v_total_lifetime_chat_messages FROM chat_messages;
  
  -- Calculate total lifetime verification posts
  SELECT COUNT(*) INTO v_total_lifetime_verification_posts 
  FROM chat_messages 
  WHERE is_verification = true;
  
  -- Calculate challenge actions for this date
  -- First, count Morning Basics Challenge daily actions
  SELECT COUNT(*) INTO v_morning_basics_actions
  FROM completed_actions
  WHERE completed_date = p_date
    AND action_id = 'morning_basics_daily';
  
  -- Then count any other challenge daily actions
  SELECT COUNT(*) INTO v_other_challenge_actions
  FROM completed_actions
  WHERE completed_date = p_date
    AND action_id != 'morning_basics_daily';
  
  -- Sum up all challenge actions
  v_challenge_actions := v_morning_basics_actions + v_other_challenge_actions;
  
  -- Calculate contest registrations for this date
  SELECT COUNT(*) INTO v_contest_registrations
  FROM contest_registrations
  WHERE DATE(registered_at) = p_date;
  
  -- Calculate challenge registrations for this date
  SELECT COUNT(*) INTO v_challenge_registrations
  FROM challenges
  WHERE DATE(started_at) = p_date;
  
  -- Calculate Cosmo chats for this date
  SELECT COUNT(*) INTO v_cosmo_chats
  FROM cosmo_chat_messages
  WHERE DATE(created_at) = p_date;
  
  -- Calculate contest verifications for this date
  SELECT COUNT(*) INTO v_contest_verifications
  FROM chat_messages cm
  JOIN active_contests ac ON cm.chat_id = CONCAT('c_', ac.challenge_id) AND cm.user_id = ac.user_id
  WHERE DATE(cm.created_at) = p_date AND cm.is_verification = true;
  
  -- UPDATED: Calculate health assessments completed on this date - count ALL assessments including initial ones
  SELECT COUNT(*) INTO v_health_assessments
  FROM health_assessments
  WHERE DATE(created_at) = p_date;
  
  -- Check if a record already exists for this date
  SELECT id INTO v_existing_record_id
  FROM all_user_insights
  WHERE date = p_date;
  
  -- Insert or update the record
  IF v_existing_record_id IS NULL THEN
    -- Insert new record
    INSERT INTO all_user_insights (
      date, total_users, active_users, new_users, average_health_score, 
      average_healthspan_years, total_healthspan_years, category_averages, 
      total_fp_earned, average_fp_per_user, total_boosts_completed, 
      total_challenges_completed, total_quests_completed, total_contests_active, 
      total_chat_messages, total_verification_posts, device_connection_stats,
      total_lifetime_fp, average_level, highest_level, total_lifetime_boosts,
      total_lifetime_challenges, total_lifetime_quests, total_lifetime_chat_messages,
      total_lifetime_verification_posts, challenge_actions, contest_registrations,
      challenge_registrations, cosmo_chats, contest_verifications, health_assessments
    ) VALUES (
      p_date, v_total_users, v_active_users, v_new_users, v_average_health_score,
      v_average_healthspan_years, v_total_healthspan_years, v_category_averages,
      v_total_fp_earned, v_average_fp_per_user, v_total_boosts_completed,
      v_total_challenges_completed, v_total_quests_completed, v_total_contests_active,
      v_total_chat_messages, v_total_verification_posts, v_device_connection_stats,
      v_total_lifetime_fp, v_average_level, v_highest_level, v_total_lifetime_boosts,
      v_total_lifetime_challenges, v_total_lifetime_quests, v_total_lifetime_chat_messages,
      v_total_lifetime_verification_posts, v_challenge_actions, v_contest_registrations,
      v_challenge_registrations, v_cosmo_chats, v_contest_verifications, v_health_assessments
    );
  ELSE
    -- Update existing record
    UPDATE all_user_insights
    SET 
      total_users = v_total_users,
      active_users = v_active_users,
      new_users = v_new_users,
      average_health_score = v_average_health_score,
      average_healthspan_years = v_average_healthspan_years,
      total_healthspan_years = v_total_healthspan_years,
      category_averages = v_category_averages,
      total_fp_earned = v_total_fp_earned,
      average_fp_per_user = v_average_fp_per_user,
      total_boosts_completed = v_total_boosts_completed,
      total_challenges_completed = v_total_challenges_completed,
      total_quests_completed = v_total_quests_completed,
      total_contests_active = v_total_contests_active,
      total_chat_messages = v_total_chat_messages,
      total_verification_posts = v_total_verification_posts,
      device_connection_stats = v_device_connection_stats,
      total_lifetime_fp = v_total_lifetime_fp,
      average_level = v_average_level,
      highest_level = v_highest_level,
      total_lifetime_boosts = v_total_lifetime_boosts,
      total_lifetime_challenges = v_total_lifetime_challenges,
      total_lifetime_quests = v_total_lifetime_quests,
      total_lifetime_chat_messages = v_total_lifetime_chat_messages,
      total_lifetime_verification_posts = v_total_lifetime_verification_posts,
      challenge_actions = v_challenge_actions,
      contest_registrations = v_contest_registrations,
      challenge_registrations = v_challenge_registrations,
      cosmo_chats = v_cosmo_chats,
      contest_verifications = v_contest_verifications,
      health_assessments = v_health_assessments
    WHERE id = v_existing_record_id;
  END IF;
  
  RETURN true;
END;
$$;

-- Now, recalculate the data for June 6-8, 2025
DO $$
DECLARE
  v_date date;
BEGIN
  -- June 6, 2025
  v_date := '2025-06-06'::date;
  PERFORM calculate_daily_user_insights(v_date);
  
  -- June 7, 2025
  v_date := '2025-06-07'::date;
  PERFORM calculate_daily_user_insights(v_date);
  
  -- June 8, 2025
  v_date := '2025-06-08'::date;
  PERFORM calculate_daily_user_insights(v_date);
  
  -- Also calculate for today to ensure current data is up-to-date
  PERFORM calculate_daily_user_insights(CURRENT_DATE);
END;
$$;

-- Log that the migration was successful
INSERT INTO app_config (key, value, description)
VALUES (
  'migration_fix_user_metrics', 
  'completed', 
  'Fixed new_users and health_assessments calculation in all_user_insights'
)
ON CONFLICT (key) DO UPDATE
SET value = 'completed';