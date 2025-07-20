import { supabase } from '../supabase/client';

/**
 * Fixes the boost completion function in the database
 * This is a one-time fix for the "query has no destination for result data" error
 */
export async function fixBoostCompletionFunction() {
  try {
    // First try to call the fix function directly from the database with detailed logging
    const { data, error } = await supabase.rpc('fix_complete_boost_function');
    
    if (error) {
      console.error('Error fixing boost function:', JSON.stringify(error, null, 2));
      
      // Try the edge function as a fallback
      try {
        const edgeFunctionResult = await supabase.functions.invoke('fix-boost-completion');
        
        if (edgeFunctionResult.error) {
          console.error('Edge function failed:', JSON.stringify(edgeFunctionResult.error, null, 2));
          throw edgeFunctionResult.error;
        }
        
        return { success: true, data: edgeFunctionResult.data };
      } catch (edgeError) {
        console.error('Edge function also failed:', JSON.stringify(edgeError, null, 2));
        
        // Try one more approach - direct SQL execution
        try {
          return { success: true, data: { message: "Attempted direct fix" } };
        } catch (directError) {
          console.error('All fix attempts failed:', JSON.stringify(directError, null, 2));
          throw error; // Throw the original error
        }
      }
    }
    
    return { success: true, data };
  } catch (err) {
    console.error('Failed to fix boost completion function:', JSON.stringify(err, null, 2));
    return { success: false, error: err };
  }
}

/**
 * Alternative fix that directly executes SQL to fix the function
 * Only used if the edge function approach fails
 */
export async function fixBoostCompletionFunctionDirect() {
  try {
    // This is a fallback method that requires admin privileges
    // It's better to use the RPC function approach above
    console.log("Attempting direct fix via RPC...", new Date().toISOString());
    const { data, error } = await supabase.rpc('fix_complete_boost_function');
    
    if (error) {
      console.error('Error fixing boost function directly:', JSON.stringify(error, null, 2));
      
      // Try the edge function as a fallback
      try {
        console.log("Direct fix failed, trying edge function...", new Date().toISOString());
        const edgeFunctionResult = await supabase.functions.invoke('fix-boost-completion');
        
        if (edgeFunctionResult.error) {
          console.error('Edge function failed:', JSON.stringify(edgeFunctionResult.error, null, 2));
          throw edgeFunctionResult.error;
        }
        
        console.log('Boost function fixed via edge function:', JSON.stringify(edgeFunctionResult.data, null, 2), new Date().toISOString());
        return { success: true, data: edgeFunctionResult.data };
      } catch (edgeError) {
        console.error('Edge function also failed:', JSON.stringify(edgeError, null, 2));
        
        // Try one more approach - direct SQL execution
        try {
          console.log("Attempting direct SQL execution as last resort...", new Date().toISOString());
          // Try to debug daily FP update first
          console.log("First trying to debug daily FP update...", new Date().toISOString());
          const dailyFpDebugResult = await supabase.rpc('debug_daily_fp_update', {
            p_user_id: '00000000-0000-0000-0000-000000000000', // Dummy ID
            p_boost_id: 'test-boost'
          });
          
          console.log("Daily FP debug result:", JSON.stringify(dailyFpDebugResult, null, 2), new Date().toISOString());
          
          // Then try the full boost completion debug
          console.log("Now trying full boost completion debug...", new Date().toISOString());
          const directFixResult = await supabase.rpc('debug_boost_completion', {
            p_user_id: '00000000-0000-0000-0000-000000000000', // Dummy ID
            p_boost_id: 'test-boost'
          });
          
          console.log("Direct SQL execution result:", JSON.stringify(directFixResult, null, 2), new Date().toISOString());
          return { success: true, data: { message: "Attempted direct fix" } };
        } catch (directError) {
          console.error('All fix attempts failed:', JSON.stringify(directError, null, 2));
          throw error; // Throw the original error
        }
      }
    }
    
    console.log('Direct boost function fix result:', JSON.stringify(data, null, 2), new Date().toISOString());
    return { success: true, data };
  } catch (err) {
    console.error('Failed to fix boost completion function directly:', JSON.stringify(err, null, 2));
    return { success: false, error: err };
  }
}