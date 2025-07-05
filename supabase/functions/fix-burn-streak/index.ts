import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase environment variables are not configured");
    }

    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body
    const { userId, email, fixAll } = await req.json();

    let result;

    if (fixAll) {
      // Fix all users' burn streaks
      const { data, error } = await supabase.rpc("fix_all_user_burn_streaks");
      
      if (error) throw error;
      result = data;
    } else if (email) {
      // Fix a specific user's burn streak by email
      const { data, error } = await supabase.rpc("fix_specific_user_burn_streak", {
        p_email: email
      });
      
      if (error) throw error;
      result = data;
    } else if (userId) {
      // Fix a specific user's burn streak by ID
      const { data, error } = await supabase.rpc("recalculate_burn_streak", {
        p_user_id: userId
      });
      
      if (error) throw error;
      result = data;
    } else {
      throw new Error("Missing required parameter: userId, email, or fixAll");
    }

    return new Response(
      JSON.stringify({
        success: true,
        result
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error("Error in fix-burn-streak function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
        details: "Failed to fix burn streak",
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
});