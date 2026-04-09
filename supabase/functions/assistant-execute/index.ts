import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientType = ReturnType<typeof createClient<any>>;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Usuario no válido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleData?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Solo admins pueden ejecutar comandos de voz" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { tool, args } = await req.json();

    let result: { success: boolean; message: string; data?: unknown };

    switch (tool) {
      case "create_task":
        result = await createTask(supabase, args);
        break;
      case "create_customer":
        result = await createCustomer(supabase, args);
        break;
      case "move_customer_stage":
        result = await moveCustomerStage(supabase, args);
        break;
      default:
        result = { success: false, message: "Acción no reconocida" };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Execute error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error instanceof Error ? error.message : "Error al ejecutar" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function createTask(
  supabase: SupabaseClientType,
  args: { project_name: string; title: string; description?: string }
) {
  // Find project by name (case insensitive partial match)
  const { data: projects, error: projectError } = await supabase
    .from("projects")
    .select("id, name")
    .ilike("name", `%${args.project_name}%`)
    .limit(1);

  if (projectError || !projects?.length) {
    return { 
      success: false, 
      message: `No encontré el proyecto "${args.project_name}". Verificá el nombre.` 
    };
  }

  const project = projects[0];

  // Create task
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .insert({
      project_id: project.id,
      title: args.title,
      description: args.description || null,
      status: "backlog",
    })
    .select()
    .single();

  if (taskError) {
    console.error("Task creation error:", taskError);
    return { success: false, message: "Error al crear la tarea" };
  }

  return { 
    success: true, 
    message: `Tarea "${args.title}" creada en ${project.name}`,
    data: task 
  };
}

async function createCustomer(
  supabase: SupabaseClientType,
  args: { name: string; email?: string; phone?: string; company?: string; stage?: string }
) {
  const { data: customer, error } = await supabase
    .from("customers")
    .insert({
      name: args.name,
      email: args.email || null,
      phone: args.phone || null,
      company: args.company || null,
      stage: args.stage || "lead",
    })
    .select()
    .single();

  if (error) {
    console.error("Customer creation error:", error);
    return { success: false, message: "Error al crear el cliente" };
  }

  const stageLabels: Record<string, string> = {
    lead: "Lead",
    prospect: "Prospecto", 
    negotiation: "Negociación",
    client: "Cliente",
  };

  return { 
    success: true, 
    message: `${args.name} agregado como ${stageLabels[args.stage || "lead"]}`,
    data: customer 
  };
}

async function moveCustomerStage(
  supabase: SupabaseClientType,
  args: { customer_name: string; new_stage: string }
) {
  // Find customer by name (case insensitive partial match)
  const { data: customers, error: findError } = await supabase
    .from("customers")
    .select("id, name, stage")
    .ilike("name", `%${args.customer_name}%`)
    .limit(1);

  if (findError || !customers?.length) {
    return { 
      success: false, 
      message: `No encontré al cliente "${args.customer_name}". Verificá el nombre.` 
    };
  }

  const customer = customers[0];

  // Update stage
  const { error: updateError } = await supabase
    .from("customers")
    .update({ stage: args.new_stage })
    .eq("id", customer.id);

  if (updateError) {
    console.error("Customer update error:", updateError);
    return { success: false, message: "Error al mover el cliente" };
  }

  const stageLabels: Record<string, string> = {
    lead: "Lead",
    prospect: "Prospecto", 
    negotiation: "Negociación",
    client: "Cliente",
    churned: "Perdido",
  };

  return { 
    success: true, 
    message: `${customer.name} movido a ${stageLabels[args.new_stage]}` 
  };
}
