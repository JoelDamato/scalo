import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  corsHeaders,
  getLatestIntegration,
  requireAdminUser,
} from "../_shared/whatsapp.ts";

type Action = "list" | "upsert" | "delete" | "toggle" | "run_now";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user, supabase } = await requireAdminUser(req);
    const body = req.method === "GET" ? {} : await req.json().catch(() => ({}));
    const action = (body.action || "list") as Action;

    if (action === "list") {
      const integration = await getLatestIntegration(supabase);
      const { data: reminders, error: remindersError } = await supabase
        .from("whatsapp_reminders")
        .select("*")
        .order("created_at", { ascending: false });

      if (remindersError) throw remindersError;

      const { data: runs, error: runsError } = await supabase
        .from("whatsapp_reminder_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(25);

      if (runsError) throw runsError;

      return jsonResponse({
        ok: true,
        integration_id: integration?.id || null,
        reminders: reminders || [],
        runs: runs || [],
      });
    }

    const integration = await getLatestIntegration(supabase);
    if (!integration) {
      throw new Error("Primero conectá WhatsApp para poder programar recordatorios.");
    }

    if (action === "upsert") {
      const id = typeof body.id === "string" ? body.id : null;
      const title = typeof body.title === "string" ? body.title.trim() : "";
      const phoneNumber = typeof body.phone_number === "string" ? body.phone_number.trim() : "";
      const messageTemplate = typeof body.message_template === "string" ? body.message_template.trim() : "";
      const cronExpression = typeof body.cron_expression === "string" ? body.cron_expression.trim() : "";
      const timezone = typeof body.timezone === "string" && body.timezone.trim()
        ? body.timezone.trim()
        : "America/Argentina/Buenos_Aires";
      const sendDelayMs = typeof body.send_delay_ms === "number" ? Math.max(0, body.send_delay_ms) : 0;
      const active = body.active !== false;

      if (!title || !phoneNumber || !messageTemplate || !cronExpression) {
        throw new Error("Completá título, teléfono, mensaje y cron.");
      }

      const payload = {
        integration_id: integration.id,
        title,
        phone_number: phoneNumber,
        message_template: messageTemplate,
        cron_expression: cronExpression,
        timezone,
        send_delay_ms: sendDelayMs,
        active,
        created_by: user.id,
      };

      let reminderId = id;

      if (id) {
        const { error } = await supabase
          .from("whatsapp_reminders")
          .update(payload)
          .eq("id", id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("whatsapp_reminders")
          .insert(payload)
          .select("id")
          .single();

        if (error) throw error;
        reminderId = data.id as string;
      }

      const rpcName = active ? "schedule_whatsapp_reminder" : "unschedule_whatsapp_reminder";
      const { error: rpcError } = await supabase.rpc(rpcName, { p_reminder_id: reminderId });
      if (rpcError) throw rpcError;

      const { data: reminder, error: reminderError } = await supabase
        .from("whatsapp_reminders")
        .select("*")
        .eq("id", reminderId)
        .single();

      if (reminderError) throw reminderError;

      return jsonResponse({ ok: true, reminder });
    }

    if (action === "delete") {
      const id = typeof body.id === "string" ? body.id : "";
      if (!id) throw new Error("Falta el recordatorio.");

      const { error: unscheduleError } = await supabase.rpc("unschedule_whatsapp_reminder", { p_reminder_id: id });
      if (unscheduleError) throw unscheduleError;

      const { error } = await supabase
        .from("whatsapp_reminders")
        .delete()
        .eq("id", id);

      if (error) throw error;

      return jsonResponse({ ok: true, deleted: true });
    }

    if (action === "toggle") {
      const id = typeof body.id === "string" ? body.id : "";
      const active = body.active === true;
      if (!id) throw new Error("Falta el recordatorio.");

      const { error: updateError } = await supabase
        .from("whatsapp_reminders")
        .update({ active })
        .eq("id", id);

      if (updateError) throw updateError;

      const rpcName = active ? "schedule_whatsapp_reminder" : "unschedule_whatsapp_reminder";
      const { error: rpcError } = await supabase.rpc(rpcName, { p_reminder_id: id });
      if (rpcError) throw rpcError;

      return jsonResponse({ ok: true, active });
    }

    if (action === "run_now") {
      const id = typeof body.id === "string" ? body.id : "";
      if (!id) throw new Error("Falta el recordatorio.");

      const { error } = await supabase.rpc("dispatch_whatsapp_reminder", { p_reminder_id: id });
      if (error) throw error;

      return jsonResponse({ ok: true, queued: true });
    }

    throw new Error("Acción inválida");
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
