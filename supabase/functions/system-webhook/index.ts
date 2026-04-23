import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AppRole = "admin" | "dev" | "client";
type TaskStatus = "backlog" | "in-progress" | "review" | "done";
type ProjectStatus = "active" | "completed" | "on-hold";

type WebhookAction =
  | "create_task"
  | "update_task"
  | "read_project"
  | "update_project"
  | "create_report"
  | "read_report"
  | "list_reports"
  | "add_report_addendum";

type WebhookRequest = {
  action: WebhookAction;
  payload?: Record<string, unknown>;
};

type SupabaseClient = ReturnType<typeof createClient>;

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getString(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getBoolean(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "boolean" ? value : null;
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return ["backlog", "in-progress", "review", "done"].includes(String(value));
}

function isProjectStatus(value: unknown): value is ProjectStatus {
  return ["active", "completed", "on-hold"].includes(String(value));
}

function requirePayload(body: WebhookRequest) {
  if (!body.payload || typeof body.payload !== "object" || Array.isArray(body.payload)) {
    throw new ResponseError("payload es requerido", 400);
  }

  return body.payload;
}

class ResponseError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function resolveProject(supabase: SupabaseClient, payload: Record<string, unknown>) {
  const projectId = getString(payload, "project_id");
  const projectName = getString(payload, "project_name");

  if (projectId) {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .maybeSingle();

    if (error) throw new ResponseError(error.message, 400);
    if (!data) throw new ResponseError("Proyecto no encontrado o sin acceso", 404);
    return data;
  }

  if (projectName) {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .ilike("name", `%${projectName}%`)
      .limit(2);

    if (error) throw new ResponseError(error.message, 400);
    if (!data || data.length === 0) throw new ResponseError("Proyecto no encontrado o sin acceso", 404);
    if (data.length > 1) {
      throw new ResponseError("Hay más de un proyecto que coincide. Enviá project_id.", 409);
    }

    return data[0];
  }

  throw new ResponseError("project_id o project_name es requerido", 400);
}

async function createTask(supabase: SupabaseClient, payload: Record<string, unknown>) {
  const title = getString(payload, "title");

  if (!title) throw new ResponseError("title es requerido", 400);

  const isInternalTask = payload.internal === true || payload.project_id === null;
  const project = isInternalTask ? null : await resolveProject(supabase, payload);

  const statusValue = payload.status;
  const status = isTaskStatus(statusValue) ? statusValue : "backlog";

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: project?.id ?? null,
      title,
      description: getString(payload, "description"),
      status,
      assignee_id: getString(payload, "assignee_id"),
      scheduled_date: getString(payload, "scheduled_date"),
      scheduled_time: getString(payload, "scheduled_time"),
      scheduled_end_time: getString(payload, "scheduled_end_time"),
      is_client_visible: getBoolean(payload, "is_client_visible") ?? false,
      client_input_required: getBoolean(payload, "client_input_required") ?? false,
    })
    .select("*")
    .single();

  if (error) throw new ResponseError(error.message, 400);
  return { task: data, project };
}

async function updateTask(supabase: SupabaseClient, payload: Record<string, unknown>) {
  const taskId = getString(payload, "task_id");
  const taskTitle = getString(payload, "task_title");

  let task;

  if (taskId) {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .maybeSingle();

    if (error) throw new ResponseError(error.message, 400);
    task = data;
  } else if (taskTitle) {
    const project = await resolveProject(supabase, payload);
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", project.id)
      .ilike("title", `%${taskTitle}%`)
      .limit(2);

    if (error) throw new ResponseError(error.message, 400);
    if (data && data.length > 1) {
      throw new ResponseError("Hay más de una tarea que coincide. Enviá task_id.", 409);
    }
    task = data?.[0] ?? null;
  } else {
    throw new ResponseError("task_id o task_title es requerido", 400);
  }

  if (!task) throw new ResponseError("Tarea no encontrada o sin acceso", 404);

  const updates: Record<string, unknown> = {};
  const title = getString(payload, "title");
  const description = typeof payload.description === "string" ? payload.description : undefined;
  const status = payload.status;

  if (title) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (isTaskStatus(status)) updates.status = status;
  if (typeof payload.is_client_visible === "boolean") updates.is_client_visible = payload.is_client_visible;
  if (typeof payload.client_input_required === "boolean") updates.client_input_required = payload.client_input_required;
  if (typeof payload.scheduled_date === "string" || payload.scheduled_date === null) updates.scheduled_date = payload.scheduled_date;
  if (typeof payload.scheduled_time === "string" || payload.scheduled_time === null) updates.scheduled_time = payload.scheduled_time;
  if (typeof payload.scheduled_end_time === "string" || payload.scheduled_end_time === null) updates.scheduled_end_time = payload.scheduled_end_time;

  if (Object.keys(updates).length === 0) {
    throw new ResponseError("No hay campos válidos para actualizar", 400);
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", task.id)
    .select("*")
    .single();

  if (error) throw new ResponseError(error.message, 400);
  return { task: data };
}

async function readProject(supabase: SupabaseClient, payload: Record<string, unknown>) {
  const project = await resolveProject(supabase, payload);
  const includeTasks = payload.include_tasks !== false;

  if (!includeTasks) return { project };

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  if (error) throw new ResponseError(error.message, 400);
  return { project, tasks: tasks ?? [] };
}

async function updateProject(supabase: SupabaseClient, payload: Record<string, unknown>) {
  const project = await resolveProject(supabase, payload);
  const updates: Record<string, unknown> = {};
  const name = getString(payload, "name");
  const description = typeof payload.description === "string" ? payload.description : undefined;
  const status = payload.status;

  if (name) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (isProjectStatus(status)) updates.status = status;
  if (typeof payload.support_active === "boolean") updates.support_active = payload.support_active;
  if (typeof payload.customer_id === "string" || payload.customer_id === null) updates.customer_id = payload.customer_id;

  if (Object.keys(updates).length === 0) {
    throw new ResponseError("No hay campos válidos para actualizar", 400);
  }

  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", project.id)
    .select("*")
    .single();

  if (error) throw new ResponseError(error.message, 400);
  return { project: data };
}

async function createReport(supabase: SupabaseClient, userId: string, payload: Record<string, unknown>) {
  const title = getString(payload, "title");
  const content = getString(payload, "content");

  if (!title) throw new ResponseError("title es requerido", 400);
  if (!content) throw new ResponseError("content es requerido", 400);

  const { data, error } = await supabase
    .from("reports")
    .insert({
      title,
      content,
      report_date: getString(payload, "report_date") ?? new Date().toISOString().slice(0, 10),
      created_by: userId,
    })
    .select("*")
    .single();

  if (error) throw new ResponseError(error.message, 400);
  return { report: data };
}

async function readReport(supabase: SupabaseClient, payload: Record<string, unknown>) {
  const reportId = getString(payload, "report_id");
  if (!reportId) throw new ResponseError("report_id es requerido", 400);

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .maybeSingle();

  if (error) throw new ResponseError(error.message, 400);
  if (!data) throw new ResponseError("Reporte no encontrado o sin acceso", 404);
  return { report: data };
}

async function listReports(supabase: SupabaseClient, payload: Record<string, unknown>) {
  const limit = Math.min(Number(payload.limit ?? 20) || 20, 100);
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("report_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new ResponseError(error.message, 400);
  return { reports: data ?? [] };
}

async function addReportAddendum(supabase: SupabaseClient, userId: string, payload: Record<string, unknown>) {
  const reportId = getString(payload, "report_id");
  const content = getString(payload, "content");

  if (!reportId) throw new ResponseError("report_id es requerido", 400);
  if (!content) throw new ResponseError("content es requerido", 400);

  const { data, error } = await supabase
    .from("report_addendums")
    .insert({
      report_id: reportId,
      author_id: userId,
      title: getString(payload, "title"),
      content,
    })
    .select("*")
    .single();

  if (error) throw new ResponseError(error.message, 400);
  return { addendum: data };
}

async function executeAction(
  supabase: SupabaseClient,
  userId: string,
  action: WebhookAction,
  payload: Record<string, unknown>,
) {
  switch (action) {
    case "create_task":
      return createTask(supabase, payload);
    case "update_task":
      return updateTask(supabase, payload);
    case "read_project":
      return readProject(supabase, payload);
    case "update_project":
      return updateProject(supabase, payload);
    case "create_report":
      return createReport(supabase, userId, payload);
    case "read_report":
      return readReport(supabase, payload);
    case "list_reports":
      return listReports(supabase, payload);
    case "add_report_addendum":
      return addReportAddendum(supabase, userId, payload);
    default:
      throw new ResponseError("Acción no soportada", 400);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método no permitido" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const bearerToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    const headerWebhookKey = req.headers.get("x-webhook-key")?.trim() ?? "";
    const token = headerWebhookKey || bearerToken;

    if (!token) {
      return jsonResponse({ error: "Authorization Bearer token o x-webhook-key es requerido" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new ResponseError("Supabase env vars no configuradas", 500);
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    let userId: string | null = null;
    let role: AppRole | undefined;
    let authMode: "session" | "api_key" = "session";

    const { data: userData, error: userError } = await serviceClient.auth.getUser(token);
    const user = userData.user;

    if (!userError && user) {
      userId = user.id;
      const { data: roleData, error: roleError } = await serviceClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleError) throw new ResponseError(roleError.message, 400);
      role = roleData?.role as AppRole | undefined;
    } else {
      const tokenHash = await sha256Hex(token);
      const { data: apiKey, error: apiKeyError } = await serviceClient
        .from("webhook_api_keys")
        .select("id, created_by")
        .eq("token_hash", tokenHash)
        .is("revoked_at", null)
        .maybeSingle();

      if (apiKeyError) throw new ResponseError(apiKeyError.message, 400);
      if (!apiKey) {
        return jsonResponse({ error: "Token no válido" }, 401);
      }

      authMode = "api_key";
      userId = apiKey.created_by;

      const { data: roleData, error: roleError } = await serviceClient
        .from("user_roles")
        .select("role")
        .eq("user_id", apiKey.created_by)
        .maybeSingle();

      if (roleError) throw new ResponseError(roleError.message, 400);
      role = roleData?.role as AppRole | undefined;

      await serviceClient
        .from("webhook_api_keys")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", apiKey.id);
    }

    if (!role || role === "client") {
      return jsonResponse({ error: "Este endpoint es solo para usuarios internos" }, 403);
    }

    const body = (await req.json()) as WebhookRequest;
    const payload = requirePayload(body);

    if (!body.action) {
      throw new ResponseError("action es requerido", 400);
    }

    const actorClient = authMode === "session"
      ? userClient
      : createClient(supabaseUrl, supabaseServiceKey);

    const result = await executeAction(actorClient, userId!, body.action, payload);

    return jsonResponse({
      ok: true,
      action: body.action,
      role,
      auth_mode: authMode,
      result,
    });
  } catch (error) {
    if (error instanceof ResponseError) {
      return jsonResponse({ ok: false, error: error.message }, error.status);
    }

    console.error("system-webhook error:", error);
    return jsonResponse(
      { ok: false, error: error instanceof Error ? error.message : "Error interno" },
      500,
    );
  }
});
