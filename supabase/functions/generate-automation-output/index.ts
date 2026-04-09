import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type OutputType = 'executive_summary' | 'system_prompt' | 'knowledge_base_md' | 'flow_map' | 'n8n_workflow' | 'integration_sheet' | 'user_guide' | 'delivery_certificate' | 'monthly_report';

interface GenerateRequest {
  type: OutputType;
  knowledgeBase: Record<string, any>;
  projectName: string;
  extra?: Record<string, any>;
}

const SYSTEM_PROMPTS: Record<OutputType, string> = {
  executive_summary: `Eres un consultor de automatización e IA. Genera un Resumen Ejecutivo interno (NO para el cliente) en español argentino.

El resumen debe tener exactamente estas secciones:
1. **Negocio**: Qué es, dónde está, qué hace (2-3 líneas)
2. **Problema que resuelve el chatbot**: Qué dolor del negocio ataca (2-3 líneas)
3. **Integraciones necesarias**: Sistemas a conectar y complejidad estimada
4. **Riesgos identificados**: Técnicos o de negocio
5. **Timeline estimado**: Semanas por fase
6. **Notas internas**: Observaciones para el equipo

Sé directo, técnico y conciso. Máximo 1 página. No uses lenguaje de marketing.`,

  system_prompt: `Eres un experto en diseño de prompts para asistentes de IA conversacionales por WhatsApp.

Genera un System Prompt completo y listo para producción basado en los datos del negocio. El prompt debe:
- Definir identidad (nombre, género, tono)
- Establecer qué puede y qué NO puede hacer
- Incluir toda la información del negocio (horarios, servicios, precios, ubicación)
- Definir flujos: bienvenida, consulta info, pedir turno, cancelar turno, urgencia, derivación humana, fuera de horario
- Incluir reglas de comportamiento y limitaciones
- Estar en español argentino
- Ser copy-pasteable directamente en Evolution API / n8n

No uses placeholders. Usa los datos reales del negocio.`,

  knowledge_base_md: `Eres un especialista en documentación técnica. Genera un documento Markdown estructurado con TODA la información del negocio, optimizado para ser consumido por un LLM como fuente de verdad.

Estructura:
# Knowledge Base — [Nombre del Negocio]
## Información General
## Horarios de Atención
## Equipo / Profesionales
## Servicios y Precios
## Medios de Pago
## Protocolo de Urgencias
## Preguntas Frecuentes

Usa datos reales. Formato limpio. Sin opiniones ni recomendaciones.`,

  flow_map: `Eres un arquitecto de chatbots conversacionales. Genera un mapa de flujos en JSON que represente todos los nodos de conversación del asistente.

Formato JSON:
{
  "flows": [
    {
      "id": "string",
      "name": "string",
      "trigger": "string (keyword o condición)",
      "nodes": [
        {
          "id": "string",
          "type": "message | question | condition | action | handoff",
          "content": "string",
          "next": "string | null",
          "options": [{ "label": "string", "next": "string" }]
        }
      ]
    }
  ]
}

Flujos obligatorios: bienvenida, consulta_info, pedir_turno, cancelar_turno, urgencia, derivacion_humana, fuera_de_horario.
Usa datos reales del negocio para los contenidos.`,

  n8n_workflow: `Eres un experto en n8n (workflow automation). Genera un JSON de workflow n8n exportable que conecte:
1. Webhook de WhatsApp (Evolution API)
2. Nodo de LLM (con system prompt)
3. Nodo de integración con sistema de gestión
4. Nodo de respuesta por WhatsApp

Incluye nodos para: consulta de disponibilidad, creación de turno, cancelación, y recordatorio 24hs.
Usa los datos del sistema de gestión del cliente. Donde falten credenciales, usa placeholders marcados como {{CREDENTIAL_NAME}}.
El JSON debe ser importable directamente en n8n.`,

  integration_sheet: `Eres un project manager técnico. Genera una Ficha de Integración con:
1. **Sistema del cliente**: Nombre, versión, URL
2. **Tipo de integración**: API REST, webhook, scraping, manual
3. **Endpoints configurados**: Lista con método, URL, propósito
4. **Credenciales necesarias**: Lista de keys (SIN valores)
5. **Estado**: Configurado / Pendiente / No aplica
6. **Fallback manual**: Qué hacer si la integración falla

Formato Markdown limpio. Para archivo interno del equipo.`,

  user_guide: `Eres un redactor de documentación para usuarios finales no técnicos. Genera una Guía de Uso de 1 página en español argentino para el cliente.

La guía debe incluir:
1. **Qué es [nombre del asistente]**: Descripción simple
2. **Qué puede hacer**: Lista de capacidades
3. **Cómo ver conversaciones**: Paso a paso
4. **Cómo intervenir manualmente**: Cuándo y cómo tomar el control
5. **Cómo actualizar información**: Horarios, servicios, etc.
6. **Contacto de soporte**: A quién contactar si hay problemas

Tono amigable, profesional. Sin jerga técnica. Máximo 1 página A4.`,

  delivery_certificate: `Eres un consultor de proyectos. Genera un Acta de Entrega formal en español con:
1. **Datos del proyecto**: Nombre, cliente, fecha de inicio, fecha de entrega
2. **Scope entregado**: Lista de lo que se implementó
3. **Capacitación**: Fecha, duración, participantes
4. **Documentación entregada**: Lista de documentos
5. **Período de soporte**: Duración y condiciones
6. **Firma**: Espacio para firma digital (placeholder)

Formato formal pero conciso.`,

  monthly_report: `Eres un analista de operaciones. Genera un Reporte Mensual de servicio de chatbot con:
1. **Período**: Mes y año
2. **Métricas**: Conversaciones atendidas, turnos generados, derivaciones humanas, uptime
3. **Incidencias**: Problemas detectados y resolución
4. **Cambios realizados**: Actualizaciones al KB o flujos
5. **Próximos pasos**: Mejoras planificadas

El admin carga los números, el documento se genera automáticamente. Usa los datos proporcionados.`,
};

function buildUserPrompt(type: OutputType, kb: Record<string, any>, projectName: string, extra?: Record<string, any>): string {
  const sections = Object.entries(kb)
    .filter(([key]) => !key.startsWith('phase_checklist_') && !key.startsWith('output_'))
    .map(([key, value]) => `### ${key}\\\\n${JSON.stringify(value, null, 2)}`)
    .join('\\\\n\\\\n');

  let prompt = `Proyecto: ${projectName}\\\\n\\\\nDatos del negocio (Knowledge Base):\\\\n${sections}`;

  if (extra) {
    prompt += `\\\\n\\\\nDatos adicionales:\\\\n${JSON.stringify(extra, null, 2)}`;
  }

  return prompt;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, knowledgeBase, projectName, extra } = await req.json() as GenerateRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = SYSTEM_PROMPTS[type];
    if (!systemPrompt) {
      throw new Error(`Unknown output type: ${type}`);
    }

    const userPrompt = buildUserPrompt(type, knowledgeBase, projectName, extra);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Intentá más tarde." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA agotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";

    // For flow_map and n8n_workflow, try to parse as JSON
    if (type === 'flow_map' || type === 'n8n_workflow') {
      try {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : content;
        content = JSON.parse(jsonStr);
      } catch {
        // Keep as string if JSON parsing fails
      }
    }

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
