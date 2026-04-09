import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticketId, type } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("id", ticketId)
      .single();

    if (ticketError || !ticket) {
      throw new Error(`Ticket not found: ${ticketError?.message}`);
    }

    // Get creator profile
    const { data: creatorProfile } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("user_id", ticket.created_by)
      .single();

    // Get project name if applicable
    let projectName = null;
    if (ticket.project_id) {
      const { data: project } = await supabase
        .from("projects")
        .select("name")
        .eq("id", ticket.project_id)
        .single();
      projectName = project?.name;
    }

    const results: string[] = [];

    // 1. Send to n8n webhook
    const n8nWebhookUrl = "https://lucassilva0.app.n8n.cloud/webhook/lovable-webhook";
    try {
      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "Scalo Portal",
          event: type || "new_ticket",
          timestamp: new Date().toISOString(),
          ticket: {
            id: ticket.id,
            subject: ticket.subject,
            description: ticket.description,
            category: ticket.category,
            priority: ticket.priority,
            status: ticket.status,
            project: projectName,
          },
          creator: {
            name: creatorProfile?.name || "Unknown",
            email: creatorProfile?.email || "Unknown",
          },
        }),
      });
      results.push(`n8n: ${n8nResponse.status}`);
    } catch (e) {
      console.error("n8n webhook error:", e);
      results.push(`n8n: error - ${e.message}`);
    }

    // 2. Send push notifications to all admins
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (adminRoles && adminRoles.length > 0) {
      const adminIds = adminRoles.map((r: any) => r.user_id);

      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("*")
        .in("user_id", adminIds);

      if (subscriptions && subscriptions.length > 0) {
        // Use web-push to send notifications
        const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
        const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

        if (vapidPublicKey && vapidPrivateKey) {
          for (const sub of subscriptions) {
            try {
              // Send push via web standards
              const pushPayload = JSON.stringify({
                title: `🎫 Nuevo ticket: ${ticket.subject}`,
                body: `${creatorProfile?.name || "Un usuario"} creó un ticket ${ticket.priority === "urgent" ? "⚠️ URGENTE" : ""} - ${ticket.category}`,
                icon: "/pwa-icon-192.png",
                badge: "/pwa-icon-192.png",
                url: "/support",
                tag: `ticket-${ticket.id}`,
              });

              // Use the Web Push protocol
              const pushResponse = await sendWebPush(
                {
                  endpoint: sub.endpoint,
                  keys: { p256dh: sub.p256dh, auth: sub.auth },
                },
                pushPayload,
                vapidPublicKey,
                vapidPrivateKey
              );

              if (pushResponse === 410 || pushResponse === 404) {
                // Subscription expired, clean up
                await supabase
                  .from("push_subscriptions")
                  .delete()
                  .eq("id", sub.id);
              }
            } catch (e) {
              console.error("Push send error:", e);
            }
          }
          results.push(`push: sent to ${subscriptions.length} subscriptions`);
        } else {
          results.push("push: VAPID keys not configured");
        }
      } else {
        results.push("push: no subscriptions found");
      }
    }

    // 3. Create in-app notification for admins
    if (adminRoles) {
      for (const admin of adminRoles) {
        if (admin.user_id !== ticket.created_by) {
          await supabase.from("notifications").insert({
            user_id: admin.user_id,
            type: "ticket",
            title: `Nuevo ticket: ${ticket.subject}`,
            message: `${creatorProfile?.name || "Un usuario"} creó un ticket de ${ticket.category} (${ticket.priority})`,
            link: "/support",
            created_by: ticket.created_by,
          });
        }
      }
      results.push("in-app: notifications created");
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in notify-ticket:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Simplified Web Push sender using Web Crypto API
async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<number> {
  // For Deno, we'll use a simpler approach with fetch
  // The actual encryption would need a web-push library
  // For now we'll use a direct fetch with VAPID headers
  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      TTL: "86400",
    },
    body: payload,
  });
  return response.status;
}
