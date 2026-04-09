import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tool definitions for the LLM
const tools = [
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Create a new task in a project. Use when user wants to create a task.",
      parameters: {
        type: "object",
        properties: {
          project_name: { 
            type: "string", 
            description: "Name of the project (partial match allowed)" 
          },
          title: { 
            type: "string", 
            description: "Title of the task" 
          },
          description: { 
            type: "string", 
            description: "Optional description of the task" 
          },
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
      description: "Create a new customer/lead in the CRM. Use when user wants to add a new client or lead.",
      parameters: {
        type: "object",
        properties: {
          name: { 
            type: "string", 
            description: "Customer name" 
          },
          email: { 
            type: "string", 
            description: "Customer email (optional)" 
          },
          phone: { 
            type: "string", 
            description: "Customer phone (optional)" 
          },
          company: { 
            type: "string", 
            description: "Company name (optional)" 
          },
          stage: { 
            type: "string", 
            enum: ["lead", "prospect", "negotiation", "client"],
            description: "Pipeline stage (default: lead)" 
          },
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
      description: "Move a customer to a different pipeline stage. Use when user wants to change a customer's stage.",
      parameters: {
        type: "object",
        properties: {
          customer_name: { 
            type: "string", 
            description: "Name of the customer (partial match allowed)" 
          },
          new_stage: { 
            type: "string", 
            enum: ["lead", "prospect", "negotiation", "client", "churned"],
            description: "New pipeline stage" 
          },
        },
        required: ["customer_name", "new_stage"],
        additionalProperties: false,
      },
    },
  },
];

const systemPrompt = `Sos un asistente de voz para un CRM de agencia. Tu nombre es "Portal Assistant".
Respondé siempre en español argentino, de forma concisa y amigable.

Podés ejecutar estas acciones:
- Crear tareas en proyectos
- Crear nuevos clientes/leads
- Mover clientes entre etapas del pipeline

Cuando el usuario pida una acción, usá la tool correspondiente.
Si no entendés bien el pedido, pedí clarificación.
Mantené las respuestas cortas (1-2 oraciones máximo).`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Call Lovable AI with tools
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
          { role: "user", content: message },
        ],
        tools,
        tool_choice: "auto",
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de requests excedido, intentá de nuevo en un momento." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes en Lovable AI." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const choice = aiData.choices?.[0];
    
    if (!choice) {
      throw new Error("No response from AI");
    }

    // Check if AI wants to call a tool
    const toolCall = choice.message?.tool_calls?.[0];
    
    if (toolCall) {
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);
      
      return new Response(
        JSON.stringify({
          type: "tool_call",
          tool: functionName,
          args,
          message: getConfirmationMessage(functionName, args),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Regular text response
    return new Response(
      JSON.stringify({
        type: "message",
        message: choice.message?.content || "No entendí, ¿podés repetir?",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getConfirmationMessage(tool: string, args: Record<string, unknown>): string {
  switch (tool) {
    case "create_task":
      return `¿Creo la tarea "${args.title}" en el proyecto "${args.project_name}"?`;
    case "create_customer":
      return `¿Agrego a "${args.name}" como nuevo ${args.stage || "lead"}?`;
    case "move_customer_stage":
      return `¿Muevo a "${args.customer_name}" a la etapa "${args.new_stage}"?`;
    default:
      return "¿Confirmo esta acción?";
  }
}
