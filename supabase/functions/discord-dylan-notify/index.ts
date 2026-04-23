import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { requireInternalUser } from "../_shared/whatsapp.ts";
import { corsHeaders } from "../_shared/whatsapp.ts";

const DYLAN_USER_ID = "378759b2-7f24-4523-893c-d23bd3213484";
const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1496974779465334996/pge43L0-Gn8snI4z8sw7O2LfejtlZi--QNLKB8vunAe9NudqhJFVnDntkH1aADXx-y2I";

type EventType = "assignment" | "mention" | "task_comment";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user, supabase } = await requireInternalUser(req);
    const body = await req.json().catch(() => ({}));
    const eventType = body.event_type as EventType | undefined;
    const targetUserId = typeof body.target_user_id === "string" ? body.target_user_id : null;
    const relatedAssigneeIds = Array.isArray(body.related_assignee_ids)
      ? body.related_assignee_ids.filter((value): value is string => typeof value === "string")
      : [];

    const shouldNotify =
      targetUserId === DYLAN_USER_ID || relatedAssigneeIds.includes(DYLAN_USER_ID);

    if (!shouldNotify) {
      return jsonResponse({ ok: true, ignored: true, reason: "not_dylan" });
    }

    const actorProfile = await supabase
      .from("profiles")
      .select("name, email")
      .eq("user_id", user.id)
      .maybeSingle();

    const actorName = actorProfile.data?.name || actorProfile.data?.email || "Alguien del equipo";
    const taskTitle = typeof body.task_title === "string" ? body.task_title : "Sin título";
    const projectName = typeof body.project_name === "string" && body.project_name ? body.project_name : "Sin proyecto";
    const comment = typeof body.comment === "string" ? body.comment : "";
    const link = typeof body.link === "string" ? body.link : "";

    const titleByEvent: Record<EventType, string> = {
      assignment: "Nueva asignación para Dylan",
      mention: "Mención para Dylan",
      task_comment: "Comentario en tarea de Dylan",
    };

    const descriptionByEvent: Record<EventType, string> = {
      assignment: `${actorName} asignó a Dylan en la tarea "${taskTitle}".`,
      mention: `${actorName} mencionó a Dylan en "${taskTitle}".`,
      task_comment: `${actorName} comentó en una tarea donde Dylan está involucrado.`,
    };

    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Scalo Portal",
        content: null,
        embeds: [
          {
            title: titleByEvent[eventType || "assignment"],
            description: descriptionByEvent[eventType || "assignment"],
            color: 0x5865f2,
            fields: [
              { name: "Proyecto", value: projectName, inline: true },
              { name: "Tarea", value: taskTitle, inline: true },
              ...(comment
                ? [{ name: "Comentario", value: comment.slice(0, 1000), inline: false }]
                : []),
              ...(link ? [{ name: "Abrir", value: link, inline: false }] : []),
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

    return jsonResponse({ ok: true, sent: true });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      400,
    );
  }
});

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
