import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BroadcastNotificationRequest {
  parent_ids: string[];
  subject: string;
  content: string;
  sender_name: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { parent_ids, subject, content, sender_name }: BroadcastNotificationRequest = await req.json();

    console.log('Processing broadcast notification:', { parent_count: parent_ids.length, subject, sender_name });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get parent information
    const { data: parents, error: parentsError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name')
      .in('id', parent_ids);

    if (parentsError) {
      throw new Error('Failed to fetch parents');
    }

    if (!parents || parents.length === 0) {
      console.log('No parents found');
      return new Response(
        JSON.stringify({ message: 'No parents found' }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get parent emails from auth.users
    const parentEmails: { email: string; firstName: string }[] = [];
    for (const parent of parents) {
      const { data: authData, error: authError } = await supabase.auth.admin.getUserById(
        parent.user_id
      );

      if (!authError && authData?.user?.email) {
        parentEmails.push({
          email: authData.user.email,
          firstName: parent.first_name
        });
      }
    }

    if (parentEmails.length === 0) {
      console.log('No parent emails found');
      return new Response(
        JSON.stringify({ message: 'No parent emails found' }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log('Sending emails to:', parentEmails.length, 'parents');

    // Send email to all parents
    const emailPromises = parentEmails.map(parent => 
      resend.emails.send({
        from: "Les Petits Rayons de Soleil <info@lapetitsrayonsdesoleil.com>",
        to: [parent.email],
        subject: `📢 ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">📢 ${subject}</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                Bonjour ${parent.firstName},
              </p>
              
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                L'administration de la crèche vous envoie un message important :
              </p>
              
              <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #374151; white-space: pre-wrap; line-height: 1.6;">
                  ${content}
                </p>
              </div>
              
              <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>📌 Note :</strong> Ce message a été envoyé à tous les parents.
                </p>
              </div>
              
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                Pour toute question, n'hésitez pas à nous contacter via votre espace parent.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${supabaseUrl.replace('.supabase.co',)}/admin/dashboard/messages" 
                   style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
                          color: white; 
                          padding: 12px 30px; 
                          text-decoration: none; 
                          border-radius: 6px; 
                          display: inline-block;
                          font-weight: bold;">
                  Accéder à mon espace
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
              
              <p style="font-size: 14px; color: #6b7280; text-align: center; margin: 0;">
                Les Petits Rayons de Soleil<br/>
                Message envoyé par ${sender_name}<br/>
                <a href="mailto:info@lespetitsrayonsdesoleil.fr" style="color: #f59e0b; text-decoration: none;">info@lespetitsrayonsdesoleil.fr</a>
              </p>
            </div>
          </div>
        `,
      })
    );

    const results = await Promise.allSettled(emailPromises);
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;

    console.log('Broadcast email results:', { successCount, failureCount });

    if (failureCount > 0) {
      console.error('Some emails failed to send:', results.filter(r => r.status === 'rejected'));
    }

    return new Response(
      JSON.stringify({ 
        message: `Broadcast emails sent to ${successCount} parent(s)`,
        success: successCount,
        failed: failureCount
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-broadcast-notification function:", error);
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
