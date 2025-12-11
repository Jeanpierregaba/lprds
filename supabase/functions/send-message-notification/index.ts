import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MessageNotificationRequest {
  recipient_id: string;
  sender_name: string;
  message_content: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipient_id, sender_name, message_content }: MessageNotificationRequest = await req.json();

    console.log('Processing message notification:', { recipient_id, sender_name });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get recipient information
    const { data: recipient, error: recipientError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name')
      .eq('id', recipient_id)
      .single();

    if (recipientError || !recipient) {
      throw new Error('Recipient not found');
    }

    // Get recipient email from auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(
      recipient.user_id
    );

    if (authError || !authData?.user?.email) {
      console.log('No email found for recipient:', recipient_id);
      return new Response(
        JSON.stringify({ message: 'No email found for recipient' }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const recipientEmail = authData.user.email;
    console.log('Sending email to:', recipientEmail);

    // Send email
    const { error: emailError } = await resend.emails.send({
      from: "Les Petits Rayons de Soleil <info@lapetitsrayonsdesoleil.com>",
      to: [recipientEmail],
      subject: `Nouveau message de ${sender_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">💬 Nouveau Message</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Bonjour ${recipient.first_name},
            </p>
            
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Vous avez reçu un nouveau message de <strong>${sender_name}</strong>.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0; color: #374151; font-style: italic;">
                "${message_content.substring(0, 150)}${message_content.length > 150 ? '...' : ''}"
              </p>
            </div>
            
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Connectez-vous à votre espace pour lire le message complet et répondre.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://lespetitsrayonsdesoleil.lovable.app/parent/dashboard/messages" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 12px 30px; 
                        text-decoration: none; 
                        border-radius: 6px; 
                        display: inline-block;
                        font-weight: bold;">
                Lire le message
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            
            <p style="font-size: 14px; color: #6b7280; text-align: center; margin: 0;">
              La Petite Rose des Sables<br/>
              <a href="mailto:contact@lapetiterosedesables.com" style="color: #667eea; text-decoration: none;">contact@lapetiterosedesables.com</a>
            </p>
          </div>
        </div>
      `,
    });

    if (emailError) {
      throw emailError;
    }

    console.log('Email sent successfully');

    return new Response(
      JSON.stringify({ message: 'Email sent successfully' }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-message-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
