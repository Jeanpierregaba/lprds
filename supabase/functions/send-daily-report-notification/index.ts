import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReportNotificationRequest {
  child_id: string;
  report_id: string;
  report_date: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { child_id, report_id, report_date }: ReportNotificationRequest = await req.json();

    console.log('Processing report notification:', { child_id, report_id, report_date });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get child information
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('first_name, last_name')
      .eq('id', child_id)
      .single();

    if (childError || !child) {
      throw new Error('Child not found');
    }

    // Get parent emails from parent_children and profiles
    const { data: parentRelations, error: parentError } = await supabase
      .from('parent_children')
      .select(`
        parent_id,
        profiles!inner (
          user_id,
          first_name,
          last_name
        )
      `)
      .eq('child_id', child_id);

    if (parentError) {
      throw new Error('Failed to fetch parent relations');
    }

    if (!parentRelations || parentRelations.length === 0) {
      console.log('No parents found for child:', child_id);
      return new Response(
        JSON.stringify({ message: 'No parents found for this child' }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get parent emails from auth.users
    const parentEmails: string[] = [];
    for (const relation of parentRelations) {
      const profileData = relation.profiles as any;
      const { data: authData, error: authError } = await supabase.auth.admin.getUserById(
        profileData.user_id
      );

      if (!authError && authData?.user?.email) {
        parentEmails.push(authData.user.email);
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

    console.log('Sending emails to:', parentEmails);

    // Format date for display
    const formattedDate = new Date(report_date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Send email to all parents
    const emailPromises = parentEmails.map(email => 
      resend.emails.send({
        from: "La Petite Rose des Sables <onboarding@resend.dev>",
        to: [email],
        subject: `Rapport quotidien pour ${child.first_name} ${child.last_name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">📋 Nouveau Rapport Quotidien</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                Bonjour,
              </p>
              
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                Un nouveau rapport quotidien est disponible pour <strong>${child.first_name} ${child.last_name}</strong>.
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                <p style="margin: 0; color: #6b7280;">
                  <strong style="color: #111827;">Date :</strong> ${formattedDate}
                </p>
              </div>
              
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                Vous pouvez consulter le rapport détaillé en vous connectant à votre espace parent.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${supabaseUrl.replace('.supabase.co', '.lovable.app')}/admin/dashboard/daily-reports" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 12px 30px; 
                          text-decoration: none; 
                          border-radius: 6px; 
                          display: inline-block;
                          font-weight: bold;">
                  Consulter le rapport
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
      })
    );

    const results = await Promise.allSettled(emailPromises);
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;

    console.log('Email sending results:', { successCount, failureCount });

    if (failureCount > 0) {
      console.error('Some emails failed to send:', results.filter(r => r.status === 'rejected'));
    }

    return new Response(
      JSON.stringify({ 
        message: `Emails sent to ${successCount} parent(s)`,
        success: successCount,
        failed: failureCount
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-daily-report-notification function:", error);
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
