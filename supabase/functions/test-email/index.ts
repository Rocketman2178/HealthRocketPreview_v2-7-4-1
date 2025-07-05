import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    // Check environment variables
    const envVars = {
      RESEND_API_KEY: RESEND_API_KEY ? '✅ Set' : '❌ Missing',
      SUPABASE_URL: SUPABASE_URL ? '✅ Set' : '❌ Missing',
      SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing',
    }

    // Try to send a test email
    let emailResult = { success: false, error: null, response: null }
    
    if (RESEND_API_KEY) {
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            from: 'Health Rocket Support <support@healthrocket.app>',
            to: ['test@example.com'], // Replace with a test email if needed
            subject: 'Test Email from Health Rocket Support',
            html: '<p>This is a test email from the Health Rocket support system.</p>',
            text: 'This is a test email from the Health Rocket support system.'
          })
        })

        const resendData = await resendResponse.json()
        emailResult = {
          success: resendResponse.ok,
          error: !resendResponse.ok ? JSON.stringify(resendData) : null,
          response: resendResponse.ok ? resendData : null
        }
      } catch (error) {
        emailResult = {
          success: false,
          error: error.message || 'Unknown error sending test email',
          response: null
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Email API Test Results',
        timestamp: new Date().toISOString(),
        environment: envVars,
        emailTest: emailResult,
        denoEnv: {
          version: Deno.version,
          pid: Deno.pid,
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error in test-email function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: 'Failed to run email test'
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})