import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-app-origin",
};

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

export interface WhatsAppIntegrationRow {
  id: string;
  label: string;
  evolution_api_url: string;
  evolution_api_key: string;
  instance_name: string;
  instance_token: string | null;
  instance_phone_number: string | null;
  status: string;
  qr_code: string | null;
  pairing_code: string | null;
  connected_phone: string | null;
  profile_name: string | null;
  last_error: string | null;
  last_synced_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
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

export async function requireAdminUser(req: Request) {
  const user = await getAuthenticatedUser(req);
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Unauthorized");

  return { user, supabase };
}

export async function requireInternalUser(req: Request) {
  const user = await getAuthenticatedUser(req);
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["admin", "dev"])
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Unauthorized");

  return { user, supabase, role: data.role as "admin" | "dev" };
}

export function normalizeEvolutionUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export function maskApiKey(apiKey: string | null) {
  if (!apiKey) return null;
  if (apiKey.length <= 8) return "********";
  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
}

export function sanitizeIntegration(row: WhatsAppIntegrationRow | null) {
  if (!row) return null;

  return {
    id: row.id,
    label: row.label,
    evolution_api_url: row.evolution_api_url,
    instance_name: row.instance_name,
    instance_token: row.instance_token,
    instance_phone_number: row.instance_phone_number,
    status: row.status,
    qr_code: row.qr_code,
    pairing_code: row.pairing_code,
    connected_phone: row.connected_phone,
    profile_name: row.profile_name,
    last_error: row.last_error,
    last_synced_at: row.last_synced_at,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    api_key_preview: maskApiKey(row.evolution_api_key),
    has_api_key: !!row.evolution_api_key,
  };
}

export async function getLatestIntegration(supabase: ReturnType<typeof getServiceRoleClient>) {
  const { data, error } = await supabase
    .from("whatsapp_integrations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as WhatsAppIntegrationRow | null) || null;
}

export async function fetchEvolution<T>(
  integration: Pick<WhatsAppIntegrationRow, "evolution_api_url" | "evolution_api_key" | "instance_name">,
  path: string,
  init: {
    method?: string;
    body?: Record<string, unknown>;
  } = {},
) {
  const response = await fetch(`${normalizeEvolutionUrl(integration.evolution_api_url)}${path}`, {
    method: init.method || "GET",
    headers: {
      "Content-Type": "application/json",
      apikey: integration.evolution_api_key,
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : typeof payload === "string" && payload
          ? payload
          : "No pude comunicarme con Evolution API";
    throw new Error(message);
  }

  return payload as T;
}
