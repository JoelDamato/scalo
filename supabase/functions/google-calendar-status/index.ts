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

    const { data, error } = await supabase
      .from("google_calendar_connections")
      .select("google_email, calendar_id, calendar_summary, token_expires_at, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        connected: !!data,
        connection: data || null,
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
