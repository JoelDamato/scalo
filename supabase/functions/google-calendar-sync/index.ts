import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  buildGoogleEventTimes,
  corsHeaders,
  getAuthenticatedUser,
  getGoogleRequestOrigin,
  getServiceRoleClient,
  refreshGoogleAccessTokenIfNeeded,
} from "../_shared/google-calendar.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const user = await getAuthenticatedUser(req);
    const supabase = getServiceRoleClient();
    const { sourceType, sourceId, action, timeZone } = await req.json();

    if (!sourceType || !sourceId) {
      throw new Error("Faltan sourceType o sourceId");
    }

    const normalizedType = sourceType === "task" ? "task" : sourceType === "project_event" ? "project_event" : null;
    if (!normalizedType) {
      throw new Error("Tipo de fuente inválido");
    }

    const { data: connection, error: connectionError } = await supabase
      .from("google_calendar_connections")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (connectionError) {
      throw connectionError;
    }

    if (!connection) {
      throw new Error("Primero conecta tu Google Calendar");
    }

    const accessToken = await refreshGoogleAccessTokenIfNeeded(supabase, connection, getGoogleRequestOrigin(req));

    const { data: existingSync } = await supabase
      .from("google_calendar_syncs")
      .select("*")
      .eq("user_id", user.id)
      .eq("source_type", normalizedType)
      .eq("source_id", sourceId)
      .maybeSingle();

    if (action === "remove") {
      if (existingSync?.google_event_id) {
        await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(connection.calendar_id)}/events/${encodeURIComponent(existingSync.google_event_id)}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
      }

      await supabase
        .from("google_calendar_syncs")
        .delete()
        .eq("user_id", user.id)
        .eq("source_type", normalizedType)
        .eq("source_id", sourceId);

      return new Response(JSON.stringify({ success: true, removed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let payload: Record<string, unknown>;

    if (normalizedType === "task") {
      const { data: task, error } = await supabase
        .from("tasks")
        .select("id, title, description, scheduled_date, scheduled_time, scheduled_end_time, project_id")
        .eq("id", sourceId)
        .maybeSingle();

      if (error) throw error;
      if (!task) throw new Error("No encontré la tarea");
      if (!task.scheduled_date) throw new Error("La tarea necesita fecha para enviarse a Google Calendar");

      payload = {
        summary: task.title,
        description: task.description || "Tarea de Scalo",
        ...buildGoogleEventTimes({
          date: task.scheduled_date,
          startTime: task.scheduled_time,
          endTime: task.scheduled_end_time,
          timeZone,
        }),
        extendedProperties: {
          private: {
            scalo_source_type: "task",
            scalo_source_id: task.id,
          },
        },
      };
    } else {
      const { data: event, error } = await supabase
        .from("project_events")
        .select("id, title, description, event_date, event_time, event_end_time, project_id")
        .eq("id", sourceId)
        .maybeSingle();

      if (error) throw error;
      if (!event) throw new Error("No encontré el evento");

      payload = {
        summary: event.title,
        description: event.description || "Evento de proyecto en Scalo",
        ...buildGoogleEventTimes({
          date: event.event_date,
          startTime: event.event_time,
          endTime: event.event_end_time,
          timeZone,
        }),
        extendedProperties: {
          private: {
            scalo_source_type: "project_event",
            scalo_source_id: event.id,
          },
        },
      };
    }

    const eventMethod = existingSync?.google_event_id ? "PATCH" : "POST";
    const endpoint = existingSync?.google_event_id
      ? `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(connection.calendar_id)}/events/${encodeURIComponent(existingSync.google_event_id)}`
      : `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(connection.calendar_id)}/events`;

    const response = await fetch(endpoint, {
      method: eventMethod,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(responseData.error?.message || "No pude sincronizar el evento con Google Calendar");
    }

    const { error: upsertError } = await supabase.from("google_calendar_syncs").upsert(
      {
        user_id: user.id,
        source_type: normalizedType,
        source_id: sourceId,
        google_event_id: responseData.id,
        calendar_id: connection.calendar_id,
        synced_at: new Date().toISOString(),
      },
      { onConflict: "user_id,source_type,source_id" },
    );

    if (upsertError) {
      throw upsertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        googleEventId: responseData.id,
        htmlLink: responseData.htmlLink,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unexpected error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
