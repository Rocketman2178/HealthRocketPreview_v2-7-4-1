import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase environment variables are not configured')
    }

    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Parse request body
    const { messageId, responseText, adminName, adminEmail } = await req.json()

    if (!messageId || !responseText) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: messageId, responseText' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch the original support message
    const { data: message, error: fetchError } = await supabase
      .from('support_messages')
      .select('*')
      .eq('id', messageId)
      .single()

    if (fetchError || !message) {
      console.error('Error fetching support message:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Support message not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Health Rocket Support Response</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px 20px; border: 1px solid #e1e5e9; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e1e5e9; border-top: none; }
            .original-message { background: #f8f9fa; padding: 15px; border-left: 4px solid #ff6b35; margin: 20px 0; border-radius: 4px; }
            .response { background: #fff; padding: 20px; border: 1px solid #e1e5e9; border-radius: 8px; margin: 20px 0; }
            .btn { display: inline-block; background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .btn:hover { background: #e55a2b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 Health Rocket Support</h1>
              <p>We've responded to your message</p>
            </div>
            
            <div class="content">
              <h2>Hi ${message.user_name || 'there'}!</h2>
              
              <p>Thank you for reaching out to Health Rocket support. We've reviewed your message and have a response for you.</p>
              
              <div class="original-message">
                <h4>Your Original Message:</h4>
                <p><strong>Category:</strong> ${message.category}</p>
                <p>${message.message}</p>
                <small>Submitted on ${new Date(message.created_at).toLocaleDateString()}</small>
              </div>
              
              <div class="response">
                <h4>Our Response:</h4>
                <p>${responseText.replace(/\n/g, '<br>')}</p>
                <small>- ${adminName || 'Health Rocket Support Team'}</small>
              </div>
              
              <p>If you have any additional questions or need further assistance, please don't hesitate to reach out to us again.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://healthrocket.app" class="btn">Visit Health Rocket</a>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>Health Rocket</strong><br>
              Adding 20+ Years of Healthy Life</p>
              <p style="font-size: 12px; color: #666;">
                This email was sent in response to your support request. 
                If you didn't expect this email, please contact us at support@healthrocket.app
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    const emailText = `
Health Rocket Support Response

Hi ${message.user_name || 'there'}!

Thank you for reaching out to Health Rocket support. We've reviewed your message and have a response for you.

Your Original Message:
Category: ${message.category}
${message.message}
Submitted on ${new Date(message.created_at).toLocaleDateString()}

Our Response:
${responseText}

- ${adminName || 'Health Rocket Support Team'}

If you have any additional questions or need further assistance, please don't hesitate to reach out to us again.

Best regards,
Health Rocket Support Team
https://healthrocket.app
    `

    // Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        from: 'Health Rocket Support <support@healthrocket.app>',
        to: [message.user_email],
        subject: `Re: Your Health Rocket Support Request (${message.category})`,
        html: emailHtml,
        text: emailText,
        reply_to: adminEmail || 'support@healthrocket.app'
      })
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Resend API error:', JSON.stringify(resendData))
      throw new Error(`Resend API error: ${resendData?.message || resendData?.error?.message || 'Unknown error'}`)
    }

    // Update the support message with email tracking info
    const { error: updateError } = await supabase
      .from('support_messages')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
        email_id: resendData.id
      })
      .eq('id', messageId)

    if (updateError) {
      console.error('Error updating support message:', updateError)
      // Don't fail the entire operation if tracking update fails
    }

    console.log(`Support response email sent successfully to ${message.user_email}, Resend ID: ${resendData.id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: resendData.id,
        message: 'Support response email sent successfully'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in send-support-response function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error', 
        details: 'Failed to send support response email',
        timestamp: new Date().toISOString()
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