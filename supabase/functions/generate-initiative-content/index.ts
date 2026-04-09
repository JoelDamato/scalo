import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateRequest {
  type: 'brief' | 'features' | 'prd' | 'screens' | 'tech_docs' | 'implementation';
  context: {
    initiativeName: string;
    productType: string;
    brief?: Record<string, string | null>;
    features?: Array<{ name: string; description: string | null; priority: string; user_story: string | null }>;
    featureName?: string;
    featureDescription?: string;
  };
  field?: string;
}

const systemPrompts: Record<string, string> = {
  brief: `Eres un Product Manager experto. Genera contenido profesional para el brief de producto en español.
Responde SOLO con el contenido solicitado, sin explicaciones adicionales.
El contenido debe ser conciso, accionable y específico para el producto.`,

  features: `Eres un Product Manager experto en metodología MoSCoW. Genera features para el producto en español.
Responde en JSON con el formato: { "features": [{ "name": "string", "description": "string", "priority": "must|should|could|wont", "complexity": "easy|medium|hard", "user_story": "string" }] }
Genera 5-8 features relevantes basadas en el brief.`,

  prd: `Eres un Product Manager técnico. Genera documentación PRD detallada para features específicas en español.
Responde SOLO con el contenido solicitado, estructurado y profesional.
Incluye casos de uso, requisitos no funcionales, dependencias, casos edge y criterios de aceptación.`,

  screens: `Eres un UX Designer experto. Genera una lista de pantallas y flujos de usuario en español.
Responde en JSON con el formato: { "screens": [{ "name": "string", "description": "string", "screen_type": "page|modal|component", "flow_name": "string", "step_order": number }] }
Genera las pantallas necesarias para implementar las features Must y Should.`,

  tech_docs: `Eres un Tech Lead experto. Genera documentación técnica completa en español.
Responde en JSON con el formato exacto para cada campo solicitado.
Incluye stack tecnológico, estructura frontend/backend, rutas API, schema de base de datos, autenticación e integraciones.`,

  implementation: `Eres un Tech Lead experto en metodologías ágiles. Genera un plan de implementación en español.
Incluye fases, estimaciones, dependencias técnicas y recomendaciones para el equipo de desarrollo.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, context, field } = await req.json() as GenerateRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let userPrompt = "";
    
    switch (type) {
      case 'brief':
        userPrompt = `Producto: ${context.initiativeName}
Tipo: ${context.productType}
Campo a generar: ${field}

Genera contenido profesional para el campo "${field}" de este producto.`;
        break;
        
      case 'features':
        userPrompt = `Producto: ${context.initiativeName}
Tipo: ${context.productType}
Brief:
${Object.entries(context.brief || {})
  .filter(([_, v]) => v)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join('\n')}

Genera features con priorización MoSCoW basándote en el brief.`;
        break;
        
      case 'prd':
        userPrompt = `Producto: ${context.initiativeName}
Feature: ${context.featureName}
Descripción: ${context.featureDescription || 'No disponible'}

Genera la documentación PRD completa para esta feature, incluyendo:
1. Overview
2. Casos de uso (principales flujos)
3. Requisitos no funcionales
4. Dependencias
5. Casos edge
6. Criterios de aceptación
7. Guías de diseño`;
        break;
        
      case 'screens':
        userPrompt = `Producto: ${context.initiativeName}
Tipo: ${context.productType}
Features prioritarias:
${(context.features || [])
  .filter(f => f.priority === 'must' || f.priority === 'should')
  .map(f => `- ${f.name}: ${f.description || f.user_story || ''}`)
  .join('\n')}

Genera las pantallas y flujos de usuario necesarios para implementar estas features.
Organízalas en flujos lógicos (happy_path, onboarding, settings, etc.)`;
        break;
        
      case 'tech_docs':
        userPrompt = `Producto: ${context.initiativeName}
Tipo: ${context.productType}
Features:
${(context.features || []).map(f => `- ${f.name} (${f.priority})`).join('\n')}

Campo a generar: ${field || 'completo'}

Genera la documentación técnica. Si es tech_stack, responde con JSON de tecnologías recomendadas.
Si es api_routes, responde con JSON de rutas API.
Para otros campos, genera texto descriptivo profesional.`;
        break;
        
      case 'implementation':
        userPrompt = `Producto: ${context.initiativeName}
Tipo: ${context.productType}
Features:
${(context.features || []).map(f => `- ${f.name} (${f.priority})`).join('\n')}

Genera un plan de implementación detallado con:
1. Fases de desarrollo (sprints)
2. Orden de features por dependencias
3. Estimaciones de tiempo
4. Recomendaciones técnicas
5. Comandos/instrucciones para herramientas de AI coding (Lovable, Cursor, v0)`;
        break;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompts[type] },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Try to parse as JSON if applicable
    let parsedContent = content;
    if (type === 'features' || type === 'screens' || (type === 'tech_docs' && (field === 'tech_stack' || field === 'api_routes'))) {
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : content;
        parsedContent = JSON.parse(jsonStr);
      } catch {
        parsedContent = content;
      }
    }

    return new Response(JSON.stringify({ content: parsedContent }), {
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
