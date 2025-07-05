import { supabase } from '../supabase/client';

/**
 * Recalculates burn streak for a specific user
 */
export async function recalculateUserBurnStreak(userId: string) {
  try {
    console.log("Recalculating burn streak for user:", userId, new Date().toISOString());
    const { data, error } = await supabase.rpc('recalculate_burn_streak', {
      p_user_id: userId
    });
    
    if (error) {
      console.error('Error recalculating burn streak:', JSON.stringify(error, null, 2));
      return { success: false, error };
    }
    
    console.log('Burn streak recalculation result:', JSON.stringify(data, null, 2));
    return { success: true, data };
  } catch (err) {
    console.error('Failed to recalculate burn streak:', JSON.stringify(err, null, 2));
    return { success: false, error: err };
  }
}

/**
 * Fixes burn streak for a specific user by email
 */
export async function fixUserBurnStreakByEmail(email: string) {
  try {
    console.log("Fixing burn streak for user with email:", email, new Date().toISOString());
    const { data, error } = await supabase.rpc('fix_specific_user_burn_streak', {
      p_email: email
    });
    
    if (error) {
      console.error('Error fixing burn streak:', JSON.stringify(error, null, 2));
      return { success: false, error };
    }
    
    console.log('Burn streak fix result:', JSON.stringify(data, null, 2));
    return { success: true, data };
  } catch (err) {
    console.error('Failed to fix burn streak:', JSON.stringify(err, null, 2));
    return { success: false, error: err };
  }
}

/**
 * Fixes burn streaks for all users
 */
export async function fixAllUserBurnStreaks() {
  try {
    console.log("Fixing burn streaks for all users", new Date().toISOString());
    const { data, error } = await supabase.rpc('fix_all_user_burn_streaks');
    
    if (error) {
      console.error('Error fixing all burn streaks:', JSON.stringify(error, null, 2));
      return { success: false, error };
    }
    
    console.log('All burn streaks fix result:', JSON.stringify(data, null, 2));
    return { success: true, data };
  } catch (err) {
    console.error('Failed to fix all burn streaks:', JSON.stringify(err, null, 2));
    return { success: false, error: err };
  }
}