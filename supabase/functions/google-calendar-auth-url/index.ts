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
    const { clientId, redirectUri } = getGoogleOAuthConfig(req.headers.get("origin"));

    const state = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase.from("google_calendar_oauth_states").delete().eq("user_id", user.id);

    const { error } = await supabase.from("google_calendar_oauth_states").insert({
      user_id: user.id,
      state,
      expires_at: expiresAt,
    });

    if (error) {
      throw error;
    }

    const scope = "https://www.googleapis.com/auth/calendar";
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", scope);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("include_granted_scopes", "true");
    url.searchParams.set("state", state);

    return new Response(JSON.stringify({ authUrl: url.toString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unexpected error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
