import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-app-origin",
};

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

export function getSupabaseEnv() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    throw new Error("Supabase environment is not fully configured");
  }

  return { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey };
}

export async function getAuthenticatedUser(req: Request): Promise<AuthenticatedUser> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    throw new Error("No authorization header");
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return { id: user.id, email: user.email ?? undefined };
}

export function getServiceRoleClient() {
  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseEnv();
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function getGoogleOAuthConfig(originHeader: string | null) {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  const extraAllowedOrigins = (Deno.env.get("GOOGLE_ALLOWED_ORIGINS") || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
  const allowedOrigins = new Set([
    "http://localhost:8080",
    "https://scalo.tech",
    "https://www.scalo.tech",
    "https://portal-scalo.vercel.app",
    ...extraAllowedOrigins,
  ]);
  const normalizedOrigin = originHeader?.replace(/\/$/, "");
  const originRedirectUri =
    normalizedOrigin && allowedOrigins.has(normalizedOrigin)
      ? `${normalizedOrigin}/google-calendar/callback`
      : undefined;
  const redirectUri = originRedirectUri || Deno.env.get("GOOGLE_REDIRECT_URI");

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Google Calendar no está configurado. Faltan GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET o GOOGLE_REDIRECT_URI.",
    );
  }

  return { clientId, clientSecret, redirectUri };
}

export function getGoogleRequestOrigin(req: Request) {
  return req.headers.get("x-app-origin") || req.headers.get("origin");
}

export async function refreshGoogleAccessTokenIfNeeded(
  supabase: ReturnType<typeof getServiceRoleClient>,
  connection: {
    id: string;
    access_token: string;
    refresh_token: string | null;
    token_expires_at: string | null;
  },
  originHeader: string | null,
) {
  const now = Date.now();
  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : null;
  const stillValid = !expiresAt || expiresAt - now > 60_000;

  if (stillValid) {
    return connection.access_token;
  }

  if (!connection.refresh_token) {
    throw new Error("La conexión de Google Calendar expiró. Vuelve a conectarla.");
  }

  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig(originHeader);

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: connection.refresh_token,
      grant_type: "refresh_token",
      redirect_uri: redirectUri,
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok) {
    throw new Error(tokenData.error_description || tokenData.error || "No pude refrescar el acceso a Google Calendar");
  }

  const nextExpiresAt = tokenData.expires_in
    ? new Date(Date.now() + Number(tokenData.expires_in) * 1000).toISOString()
    : null;

  const { error } = await supabase
    .from("google_calendar_connections")
    .update({
      access_token: tokenData.access_token,
      token_expires_at: nextExpiresAt,
    })
    .eq("id", connection.id);

  if (error) {
    throw error;
  }

  return tokenData.access_token as string;
}

export function buildGoogleEventTimes({
  date,
  startTime,
  endTime,
  timeZone,
}: {
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  timeZone?: string | null;
}) {
  const resolvedTimeZone = timeZone || "America/Argentina/Buenos_Aires";

  if (!startTime) {
    return {
      start: { date, timeZone: resolvedTimeZone },
      end: { date, timeZone: resolvedTimeZone },
    };
  }

  const normalizedEndTime = endTime || addOneHour(startTime);

  return {
    start: {
      dateTime: `${date}T${startTime}:00`,
      timeZone: resolvedTimeZone,
    },
    end: {
      dateTime: `${date}T${normalizedEndTime}:00`,
      timeZone: resolvedTimeZone,
    },
  };
}

function addOneHour(timeValue: string) {
  const [hours, minutes] = timeValue.split(":").map(Number);
  const nextHour = (hours + 1) % 24;
  return `${String(nextHour).padStart(2, "0")}:${String(minutes || 0).padStart(2, "0")}`;
}
