import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type WhatsAppProvider = "twilio" | "meta";

type MessagePayload =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "template";
      name: string;
      language: string;
      components?: unknown[];
    };

interface WhatsAppNotificationRequest {
  notification_type: string;
  child_id: string;
  entity_table?: string;
  entity_id?: string;
  deep_link_path?: string;
  message?: MessagePayload;
}

const normalizeE164 = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("+")) return trimmed;

  // If it's a French number like 06..., convert to +33...
  if (/^0\d{9}$/.test(trimmed)) {
    return `+33${trimmed.slice(1)}`;
  }

  // Otherwise keep digits and prefix +
  const digits = trimmed.replace(/\D/g, "");
  return digits ? `+${digits}` : trimmed;
};

const getAppBaseUrl = () => {
  return (
    Deno.env.get("APP_BASE_URL") ||
    "https://lespetitsrayonsdesoleil.fr"
  ).replace(/\/$/, "");
};

const getProviderFromSettings = async (supabase: any): Promise<WhatsAppProvider> => {
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "whatsapp_provider")
      .maybeSingle();

    if (error) throw error;

    const provider = (data?.value as any)?.provider;
    if (provider === "twilio" || provider === "meta") return provider;
  } catch (_) {
    // Ignore and fallback below
  }

  const envProvider = (Deno.env.get("WHATSAPP_PROVIDER") || "").toLowerCase();
  if (envProvider === "twilio" || envProvider === "meta") return envProvider;
  return "twilio";
};

const defaultMessageForType = (params: {
  notification_type: string;
  childFirstName: string;
  deepLinkUrl: string;
}): string => {
  switch (params.notification_type) {
    case "daily_report_available":
      return `Bonjour, le rapport quotidien de ${params.childFirstName} est disponible. ${params.deepLinkUrl}`;
    case "periodic_assessment_available":
      return `Bonjour, un bilan périodique de ${params.childFirstName} est disponible. ${params.deepLinkUrl}`;
    case "weekly_report_available":
      return `Bonjour, un rapport bi-mensuel de ${params.childFirstName} est disponible. ${params.deepLinkUrl}`;
    default:
      return `Bonjour, une nouvelle information est disponible pour ${params.childFirstName}. ${params.deepLinkUrl}`;
  }
};

const sendViaTwilio = async (args: {
  toE164: string;
  body: string;
}): Promise<{ provider: WhatsAppProvider; provider_message_id?: string; response: unknown }> => {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID") || "";
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN") || "";
  const fromWhatsApp = Deno.env.get("TWILIO_WHATSAPP_FROM") || "";

  if (!accountSid || !authToken || !fromWhatsApp) {
    throw new Error("Missing Twilio env vars (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM)");
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const payload = new URLSearchParams({
    From: `whatsapp:${fromWhatsApp}`,
    To: `whatsapp:${args.toE164}`,
    Body: args.body,
  });

  const auth = btoa(`${accountSid}:${authToken}`);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Twilio error: ${res.status} ${JSON.stringify(json)}`);
  }

  return {
    provider: "twilio",
    provider_message_id: (json as any)?.sid,
    response: json,
  };
};

const sendViaMeta = async (args: {
  toE164: string;
  message: MessagePayload;
}): Promise<{ provider: WhatsAppProvider; provider_message_id?: string; response: unknown }> => {
  const token = Deno.env.get("META_WHATSAPP_TOKEN") || "";
  const phoneNumberId = Deno.env.get("META_WHATSAPP_PHONE_NUMBER_ID") || "";

  if (!token || !phoneNumberId) {
    throw new Error("Missing Meta env vars (META_WHATSAPP_TOKEN, META_WHATSAPP_PHONE_NUMBER_ID)");
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  let payload: any = {
    messaging_product: "whatsapp",
    to: args.toE164.replace(/^\+/, ""),
  };

  if (args.message.type === "template") {
    payload = {
      ...payload,
      type: "template",
      template: {
        name: args.message.name,
        language: { code: args.message.language },
        components: args.message.components,
      },
    };
  } else {
    payload = {
      ...payload,
      type: "text",
      text: { body: args.message.text },
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Meta error: ${res.status} ${JSON.stringify(json)}`);
  }

  return {
    provider: "meta",
    provider_message_id: (json as any)?.messages?.[0]?.id,
    response: json,
  };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: WhatsAppNotificationRequest = await req.json();

    if (!payload.child_id) {
      return new Response(JSON.stringify({ error: "child_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!payload.notification_type) {
      return new Response(JSON.stringify({ error: "notification_type is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const provider = await getProviderFromSettings(supabase);

    const { data: child, error: childError } = await supabase
      .from("children")
      .select("first_name, last_name")
      .eq("id", payload.child_id)
      .single();

    if (childError || !child) {
      throw new Error("Child not found");
    }

    const { data: parentRelations, error: parentError } = await supabase
      .from("parent_children")
      .select(
        `
        parent_id,
        profiles!inner (
          id,
          first_name,
          last_name,
          phone,
          whatsapp_phone,
          whatsapp_opt_in
        )
      `,
      )
      .eq("child_id", payload.child_id);

    if (parentError) {
      throw new Error("Failed to fetch parent relations");
    }

    const deepLinkUrl = payload.deep_link_path
      ? `${getAppBaseUrl()}${payload.deep_link_path.startsWith("/") ? "" : "/"}${payload.deep_link_path}`
      : getAppBaseUrl();

    const message: MessagePayload =
      payload.message ||
      ({
        type: "text",
        text: defaultMessageForType({
          notification_type: payload.notification_type,
          childFirstName: child.first_name,
          deepLinkUrl,
        }),
      } satisfies MessagePayload);

    const parents = (parentRelations || [])
      .map((r: any) => r.profiles)
      .filter(Boolean);

    const eligibleParents = parents.filter((p: any) => !!p.whatsapp_opt_in);

    const results: Array<{
      recipient_profile_id: string;
      status: "skipped" | "sent" | "failed" | "duplicate";
      provider?: WhatsAppProvider;
      provider_message_id?: string;
      error?: string;
    }> = [];

    for (const parent of eligibleParents) {
      const rawPhone = parent.whatsapp_phone || parent.phone || "";
      const toE164 = normalizeE164(rawPhone);
      if (!toE164) {
        results.push({
          recipient_profile_id: parent.id,
          status: "skipped",
          error: "Missing phone",
        });
        continue;
      }

      const logInsert = {
        channel: "whatsapp",
        notification_type: payload.notification_type,
        entity_table: payload.entity_table || null,
        entity_id: payload.entity_id || null,
        recipient_profile_id: parent.id,
        status: "queued",
        provider,
        request_payload: {
          to: toE164,
          message,
          child_id: payload.child_id,
        },
      };

      const { data: logRow, error: logError } = await supabase
        .from("notification_logs")
        .insert(logInsert)
        .select("id")
        .single();

      if (logError) {
        // Unique constraint => already sent / already queued
        if ((logError as any)?.code === "23505") {
          results.push({
            recipient_profile_id: parent.id,
            status: "duplicate",
          });
          continue;
        }
        results.push({
          recipient_profile_id: parent.id,
          status: "failed",
          error: (logError as any)?.message || "Failed to insert log",
        });
        continue;
      }

      try {
        const sendResult =
          provider === "meta"
            ? await sendViaMeta({ toE164, message })
            : await sendViaTwilio({
                toE164,
                body: message.type === "text" ? message.text : JSON.stringify(message),
              });

        await supabase
          .from("notification_logs")
          .update({
            status: "sent",
            provider_message_id: sendResult.provider_message_id || null,
            response_payload: sendResult.response as any,
            updated_at: new Date().toISOString(),
          })
          .eq("id", logRow.id);

        results.push({
          recipient_profile_id: parent.id,
          status: "sent",
          provider: sendResult.provider,
          provider_message_id: sendResult.provider_message_id,
        });
      } catch (e: any) {
        await supabase
          .from("notification_logs")
          .update({
            status: "failed",
            error: e?.message || String(e),
            updated_at: new Date().toISOString(),
          })
          .eq("id", logRow.id);

        results.push({
          recipient_profile_id: parent.id,
          status: "failed",
          provider,
          error: e?.message || String(e),
        });
      }
    }

    return new Response(
      JSON.stringify({
        provider,
        attempted: eligibleParents.length,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error: any) {
    console.error("Error in send-whatsapp-notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
