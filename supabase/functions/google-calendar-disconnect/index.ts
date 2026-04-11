import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  corsHeaders,
  getAuthenticatedUser,
  getServiceRoleClient,
} from "../_shared/google-calendar.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const user = await getAuthenticatedUser(req);
    const supabase = getServiceRoleClient();

    const { data: connection } = await supabase
      .from("google_calendar_connections")
      .select("access_token")
      .eq("user_id", user.id)
      .maybeSingle();

    if (connection?.access_token) {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(connection.access_token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
    }

    await supabase.from("google_calendar_syncs").delete().eq("user_id", user.id);
    await supabase.from("google_calendar_connections").delete().eq("user_id", user.id);
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
