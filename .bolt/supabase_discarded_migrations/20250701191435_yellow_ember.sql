/*
  # Fix Completed Contests Query
  
  1. New Functions
    - Create improved get_user_completed_contests function
    - Add get_user_completed_contests_v2 function with better error handling
  
  2. Changes
    - Fix GROUP BY clause issue in the query
    - Ensure proper handling of empty result sets
    - Maintain backward compatibility with existing code
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.get_user_completed_contests;

-- Create the fixed function with proper GROUP BY clause
CREATE OR REPLACE FUNCTION public.get_user_completed_contests(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_contests JSONB;
BEGIN
  -- Get completed contests with proper GROUP BY clause
  WITH completed_contests AS (
    SELECT 
      cc.id,
      cc.user_id,
      cc.contest_id,
      cc.challenge_id,
      cc.verification_count,
      cc.verifications_required,
      cc.all_verifications_completed,
      cc.started_at,
      cc.completed_at,
      cc.name,
      cc.description,
      cc.category,
      cc.fuel_points,
      cc.duration,
      cc.entry_fee,
      cc.created_at
    FROM 
      completed_contests cc
    WHERE 
      cc.user_id = p_user_id
    ORDER BY 
      cc.completed_at DESC
  )
  SELECT 
    jsonb_build_object(
      'success', TRUE,
      'contests', COALESCE(jsonb_agg(cc.*), '[]'::jsonb)
    ) INTO v_contests
  FROM 
    completed_contests cc;

  RETURN v_contests;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a more robust version of the function that handles the case when there are no contests
CREATE OR REPLACE FUNCTION public.get_user_completed_contests_v2(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_contests JSONB;
BEGIN
  -- Get completed contests with proper handling
  SELECT 
    jsonb_build_object(
      'success', TRUE,
      'contests', COALESCE(
        (
          SELECT jsonb_agg(row_to_json(cc))
          FROM (
            SELECT 
              cc.id,
              cc.user_id,
              cc.contest_id,
              cc.challenge_id,
              cc.verification_count,
              cc.verifications_required,
              cc.all_verifications_completed,
              cc.started_at,
              cc.completed_at,
              cc.name,
              cc.description,
              cc.category,
              cc.fuel_points,
              cc.duration,
              cc.entry_fee,
              cc.created_at
            FROM 
              completed_contests cc
            WHERE 
              cc.user_id = p_user_id
            ORDER BY 
              cc.completed_at DESC
          ) cc
        ),
        '[]'::jsonb
      )
    ) INTO v_contests;

  RETURN v_contests;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;