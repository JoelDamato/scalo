import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  corsHeaders,
  fetchEvolution,
  getLatestIntegration,
  requireInternalUser,
} from "../_shared/whatsapp.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { supabase } = await requireInternalUser(req);
    const body = await req.json().catch(() => ({}));
    const taskId = typeof body.task_id === "string" ? body.task_id : "";
    const assigneeUserId = typeof body.assignee_user_id === "string" ? body.assignee_user_id : "";

    if (!taskId || !assigneeUserId) {
      throw new Error("Falta task_id o assignee_user_id.");
    }

    const integration = await getLatestIntegration(supabase);
    if (!integration || integration.status !== "connected") {
      return jsonResponse({ ok: true, sent: false, reason: "whatsapp_not_connected" });
    }

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, title, project_id, scheduled_date, scheduled_time")
      .eq("id", taskId)
      .maybeSingle();

    if (taskError) throw taskError;
    if (!task) {
      return jsonResponse({ ok: true, sent: false, reason: "task_not_found" });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("name, phone_number")
      .eq("user_id", assigneeUserId)
      .maybeSingle();

    if (profileError) throw profileError;

    const normalizedPhone = (profile?.phone_number || "").replace(/\D/g, "");
    if (!normalizedPhone) {
      return jsonResponse({ ok: true, sent: false, reason: "missing_phone_number" });
    }

    let projectName = "Tarea interna";
    if (task.project_id) {
      const { data: project } = await supabase
        .from("projects")
        .select("name")
        .eq("id", task.project_id)
        .maybeSingle();

      if (project?.name) {
        projectName = project.name;
      }
    }

    const scheduleText = task.scheduled_date
      ? task.scheduled_time
        ? `\nAgenda: ${task.scheduled_date} ${task.scheduled_time.slice(0, 5)}`
        : `\nAgenda: ${task.scheduled_date}`
      : "";

    const message = [
      `Hola ${profile?.name || "equipo"}, te asignaron una tarea en Scalo.`,
      `Proyecto: ${projectName}`,
      `Tarea: ${task.title}`,
      scheduleText,
    ]
      .filter(Boolean)
      .join("\n");

    const response = await fetchEvolution(
      integration,
      `/message/sendText/${integration.instance_name}`,
      {
        method: "POST",
        body: {
          number: normalizedPhone,
          text: message,
        },
      },
    );

    const { data: existingConversation } = await supabase
      .from("whatsapp_conversations")
      .select("id")
      .eq("phone_number", normalizedPhone)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let conversationId = existingConversation?.id || null;
    if (!conversationId) {
      const { data: newConversation, error: conversationError } = await supabase
        .from("whatsapp_conversations")
        .insert({
          phone_number: normalizedPhone,
          contact_name: profile?.name || null,
        })
        .select("id")
        .single();

      if (conversationError) throw conversationError;
      conversationId = newConversation.id;
    }

    await supabase.from("whatsapp_messages").insert({
      conversation_id: conversationId,
      direction: "outbound",
      content: message,
      message_type: "text",
      status: "pending",
      sent_by: assigneeUserId,
      whatsapp_message_id:
        typeof response === "object" && response && "key" in response && response.key && typeof response.key === "object" && "id" in response.key
          ? String(response.key.id)
          : null,
    });

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
