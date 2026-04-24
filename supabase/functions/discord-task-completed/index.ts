import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, requireInternalUser } from "../_shared/whatsapp.ts";

const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1497044997760094248/Qa2rlH9YjYG2Wkfc0BZehM9MstAg9kBA_u3Arq8YB8N9hQx3GPmMMf6021HTEIVjPO88";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user, supabase } = await requireInternalUser(req);
    const body = await req.json().catch(() => ({}));
    const taskId = typeof body.task_id === "string" ? body.task_id : "";
    const taskTitle = typeof body.task_title === "string" ? body.task_title : "";
    const projectName = typeof body.project_name === "string" ? body.project_name : "Sin proyecto";

    if (!taskId || !taskTitle) {
      throw new Error("Falta task_id o task_title.");
    }

    const actorProfile = await supabase
      .from("profiles")
      .select("name, email")
      .eq("user_id", user.id)
      .maybeSingle();

    const actorName = actorProfile.data?.name || actorProfile.data?.email || "Alguien del equipo";

    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Scalo Portal",
        embeds: [
          {
            title: "Tarea finalizada",
            description: `${actorName} marcó como finalizada la tarea "${taskTitle}".`,
            color: 0x57f287,
            fields: [
              { name: "Proyecto", value: projectName, inline: true },
              { name: "Tarea", value: taskTitle, inline: true },
              { name: "Abrir", value: `/my-tasks?task=${taskId}`, inline: false },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Discord webhook rechazado");
    }

    return new Response(JSON.stringify({ ok: true, sent: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unexpected error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
