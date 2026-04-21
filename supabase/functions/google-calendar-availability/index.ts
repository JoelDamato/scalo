import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
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
    const { start, end } = await req.json();

    if (!start || !end) {
      throw new Error("Faltan start o end");
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
      return new Response(
        JSON.stringify({ connected: false, events: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const accessToken = await refreshGoogleAccessTokenIfNeeded(
      supabase,
      connection,
      getGoogleRequestOrigin(req),
    );

    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(connection.calendar_id)}/events`,
    );
    url.searchParams.set("timeMin", start);
    url.searchParams.set("timeMax", end);
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("maxResults", "250");

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error?.message || "No pude leer Google Calendar");
    }

    const events = Array.isArray(responseData.items)
      ? responseData.items
          .filter((event) => event?.status !== "cancelled")
          .map((event) => ({
            id: event.id,
            title: event.summary || "Bloque ocupado",
            start: event.start?.dateTime || event.start?.date || null,
            end: event.end?.dateTime || event.end?.date || null,
            all_day: !!event.start?.date && !event.start?.dateTime,
            html_link: event.htmlLink || null,
          }))
      : [];

    return new Response(
      JSON.stringify({
        connected: true,
        events,
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
