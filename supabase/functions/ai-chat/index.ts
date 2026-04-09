import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const tools = [
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Crear una nueva tarea en un proyecto.",
      parameters: {
        type: "object",
        properties: {
          project_name: { type: "string", description: "Nombre del proyecto (match parcial)" },
          title: { type: "string", description: "Título de la tarea" },
          description: { type: "string", description: "Descripción de la tarea" },
        },
        required: ["project_name", "title"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_customer",
      description: "Crear un nuevo cliente/lead en el CRM.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nombre del cliente" },
          email: { type: "string", description: "Email" },
          phone: { type: "string", description: "Teléfono" },
          company: { type: "string", description: "Empresa" },
          stage: { type: "string", enum: ["lead", "prospect", "negotiation", "client"], description: "Etapa del pipeline" },
        },
        required: ["name"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "move_customer_stage",
      description: "Mover un cliente a otra etapa del pipeline.",
      parameters: {
        type: "object",
        properties: {
          customer_name: { type: "string", description: "Nombre del cliente (match parcial)" },
          new_stage: { type: "string", enum: ["lead", "prospect", "negotiation", "client", "churned"], description: "Nueva etapa" },
        },
        required: ["customer_name", "new_stage"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_task_status",
      description: "Cambiar el estado de una tarea (backlog, todo, in_progress, review, done).",
      parameters: {
        type: "object",
        properties: {
          project_name: { type: "string", description: "Nombre del proyecto" },
          task_title: { type: "string", description: "Título de la tarea (match parcial)" },
          new_status: { type: "string", enum: ["backlog", "todo", "in_progress", "review", "done"], description: "Nuevo estado" },
        },
        required: ["project_name", "task_title", "new_status"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_project_summary",
      description: "Obtener resumen de un proyecto con sus tareas, iniciativas y knowledge base.",
      parameters: {
        type: "object",
        properties: {
          project_name: { type: "string", description: "Nombre del proyecto (match parcial)" },
        },
        required: ["project_name"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pipeline_status",
      description: "Ver estado del pipeline de CRM con conteo por etapa.",
      parameters: { type: "object", properties: {}, required: [], additionalProperties: false },
    },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuario no válido" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles").select("role").eq("user_id", user.id).single();
    
    if (roleData?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Solo admins pueden usar el asistente" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();

    // Fetch context data in parallel
    const [projectsRes, customersRes, tasksRes] = await Promise.all([
      supabase.from("projects").select("id, name, status, customer_id").limit(50),
      supabase.from("customers").select("id, name, email, phone, company, stage, source").limit(100),
      supabase.from("tasks").select("id, title, status, project_id").limit(200),
    ]);

    const projects = projectsRes.data || [];
    const customers = customersRes.data || [];
    const tasks = tasksRes.data || [];

    const contextSummary = `
## Contexto del Sistema

### Proyectos (${projects.length})
${projects.map(p => `- "${p.name}" (${p.status}) [ID: ${p.id}]`).join("\n")}

### Clientes CRM (${customers.length})
${customers.map(c => `- "${c.name}" | ${c.stage} | ${c.email || "sin email"} | ${c.company || "sin empresa"}`).join("\n")}

### Tareas recientes
${tasks.slice(0, 30).map(t => {
  const proj = projects.find(p => p.id === t.project_id);
  return `- "${t.title}" (${t.status}) en "${proj?.name || "?"}"`;
}).join("\n")}
`;

    const systemPrompt = `Sos "Portal IA", el asistente inteligente de esta agencia digital. Hablás en español argentino, sos directo, profesional y eficiente.

Tenés acceso completo al sistema y podés:
- Crear tareas, cambiar estados de tareas
- Crear clientes, moverlos de etapa en el pipeline
- Consultar info de proyectos, pipeline, knowledge base
- Dar recomendaciones estratégicas basadas en los datos

Cuando el usuario pida una acción, ejecutala directamente usando las tools disponibles.
Si necesitás clarificación, preguntá de forma concisa.
Usá markdown para formatear respuestas largas.

${contextSummary}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // First AI call
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools,
        tool_choice: "auto",
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Límite de IA excedido. Intentá en un momento." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA agotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI Gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const choice = aiData.choices?.[0];
    if (!choice) throw new Error("No AI response");

    const toolCalls = choice.message?.tool_calls;

    if (toolCalls && toolCalls.length > 0) {
      // Execute all tool calls
      const toolResults = [];
      for (const tc of toolCalls) {
        const args = JSON.parse(tc.function.arguments);
        const result = await executeTool(supabase, tc.function.name, args);
        toolResults.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }

      // Second AI call with tool results
      const followUpResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
            choice.message,
            ...toolResults,
          ],
          stream: true,
        }),
      });

      if (!followUpResponse.ok) throw new Error("Follow-up AI call failed");

      return new Response(followUpResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // No tool calls — stream directly (re-call with stream)
    const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!streamResponse.ok) throw new Error("Stream AI call failed");

    return new Response(streamResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("AI Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Error interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeTool(supabase: any, name: string, args: Record<string, any>) {
  switch (name) {
    case "create_task": {
      const { data: projects } = await supabase
        .from("projects").select("id, name").ilike("name", `%${args.project_name}%`).limit(1);
      if (!projects?.length) return { success: false, message: `Proyecto "${args.project_name}" no encontrado.` };
      const { data: task, error } = await supabase
        .from("tasks").insert({ project_id: projects[0].id, title: args.title, description: args.description || null, status: "backlog" }).select().single();
      if (error) return { success: false, message: "Error al crear tarea." };
      return { success: true, message: `Tarea "${args.title}" creada en ${projects[0].name}.`, data: task };
    }
    case "create_customer": {
      const { data: customer, error } = await supabase
        .from("customers").insert({ name: args.name, email: args.email || null, phone: args.phone || null, company: args.company || null, stage: args.stage || "lead" }).select().single();
      if (error) return { success: false, message: "Error al crear cliente." };
      return { success: true, message: `${args.name} agregado como ${args.stage || "lead"}.`, data: customer };
    }
    case "move_customer_stage": {
      const { data: customers } = await supabase
        .from("customers").select("id, name").ilike("name", `%${args.customer_name}%`).limit(1);
      if (!customers?.length) return { success: false, message: `Cliente "${args.customer_name}" no encontrado.` };
      const { error } = await supabase.from("customers").update({ stage: args.new_stage }).eq("id", customers[0].id);
      if (error) return { success: false, message: "Error al mover cliente." };
      return { success: true, message: `${customers[0].name} movido a ${args.new_stage}.` };
    }
    case "update_task_status": {
      const { data: projects } = await supabase
        .from("projects").select("id, name").ilike("name", `%${args.project_name}%`).limit(1);
      if (!projects?.length) return { success: false, message: `Proyecto "${args.project_name}" no encontrado.` };
      const { data: tasks } = await supabase
        .from("tasks").select("id, title").eq("project_id", projects[0].id).ilike("title", `%${args.task_title}%`).limit(1);
      if (!tasks?.length) return { success: false, message: `Tarea "${args.task_title}" no encontrada.` };
      const { error } = await supabase.from("tasks").update({ status: args.new_status }).eq("id", tasks[0].id);
      if (error) return { success: false, message: "Error al actualizar tarea." };
      return { success: true, message: `"${tasks[0].title}" movida a ${args.new_status}.` };
    }
    case "get_project_summary": {
      const { data: projects } = await supabase
        .from("projects").select("id, name, status, description").ilike("name", `%${args.project_name}%`).limit(1);
      if (!projects?.length) return { success: false, message: `Proyecto "${args.project_name}" no encontrado.` };
      const project = projects[0];
      const [tasksRes, initiativesRes, kbRes] = await Promise.all([
        supabase.from("tasks").select("title, status").eq("project_id", project.id),
        supabase.from("product_initiatives").select("name, product_type, current_step, status").eq("project_id", project.id),
        supabase.from("project_knowledge_base").select("responses, is_completed").eq("project_id", project.id).single(),
      ]);
      return {
        success: true,
        project: { name: project.name, status: project.status, description: project.description },
        tasks: tasksRes.data || [],
        initiatives: initiativesRes.data || [],
        knowledgeBase: kbRes.data || null,
      };
    }
    case "get_pipeline_status": {
      const { data: customers } = await supabase.from("customers").select("stage");
      const counts: Record<string, number> = { lead: 0, prospect: 0, negotiation: 0, client: 0, churned: 0 };
      customers?.forEach((c: { stage: string }) => { if (c.stage in counts) counts[c.stage]++; });
      return { success: true, counts, total: customers?.length || 0 };
    }
    default:
      return { success: false, message: "Acción no reconocida." };
  }
}
