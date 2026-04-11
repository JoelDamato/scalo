import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  corsHeaders,
  getAuthenticatedUser,
  getGoogleOAuthConfig,
  getServiceRoleClient,
} from "../_shared/google-calendar.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const user = await getAuthenticatedUser(req);
    const supabase = getServiceRoleClient();
    const { code, state } = await req.json();

    if (!code || !state) {
      throw new Error("Faltan code o state");
    }

    const { data: storedState, error: stateError } = await supabase
      .from("google_calendar_oauth_states")
      .select("*")
      .eq("user_id", user.id)
      .eq("state", state)
      .maybeSingle();

    if (stateError) {
      throw stateError;
    }

    if (!storedState || new Date(storedState.expires_at).getTime() < Date.now()) {
      throw new Error("La autorización expiró. Vuelve a intentar conectar Google Calendar.");
    }

    const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig(req.headers.get("origin"));

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || tokenData.error || "No pude completar la conexión con Google");
    }

    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profileData = await profileResponse.json();

    const calendarResponse = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList/primary", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const calendarData = await calendarResponse.json();

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + Number(tokenData.expires_in) * 1000).toISOString()
      : null;

    const { error: upsertError } = await supabase.from("google_calendar_connections").upsert(
      {
        user_id: user.id,
        google_email: profileData.email ?? user.email ?? null,
        calendar_id: calendarData.id || "primary",
        calendar_summary: calendarData.summary || "Google Calendar",
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        token_expires_at: expiresAt,
      },
      { onConflict: "user_id" },
    );

    if (upsertError) {
      throw upsertError;
    }

    await supabase.from("google_calendar_oauth_states").delete().eq("user_id", user.id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unexpected error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
