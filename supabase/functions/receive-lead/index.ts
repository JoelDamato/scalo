import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface LeadPayload {
  booking_id?: string | number;
  event_type?: string;
  start_time?: string;
  end_time?: string;
  name: string;
  email: string;
  phone?: string;
  timezone?: string;
  company?: string;
  budget?: string;
  project_type?: string;
  urgency?: string;
  ready_to_invest?: string;
  description?: string;
  client_type?: string;
  custom_questions?: Array<{
    identifier: string;
    label: string;
    value: string;
  }>;
  metadata?: {
    location?: string;
    description?: string;
  };
  ready_to_invest_value?: string;
  qualified?: boolean;
  stage?: string;
  created_at?: string;
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  fbclid?: string;
}

type CustomerStage = 'lead' | 'prospect' | 'negotiation' | 'client' | 'churned';

function determineStage(payload: LeadPayload): CustomerStage {
  const readyToInvest = (payload.ready_to_invest || payload.ready_to_invest_value || '').toLowerCase();
  
  // Si contiene "si" (case insensitive) → Negociación
  if (payload.qualified === true || readyToInvest.includes('si')) {
    return 'negotiation';
  }
  
  // Si contiene "cuotas" → Prospecto
  if (readyToInvest.includes('cuotas')) {
    return 'prospect';
  }
  
  // Por defecto → Lead
  return 'lead';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Verificar API Key
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = Deno.env.get('CRM_API_KEY');
    
    console.log('Received API key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'none');
    console.log('Expected API key exists:', !!expectedApiKey);
    
    if (!expectedApiKey) {
      console.error('CRM_API_KEY not configured in environment');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (apiKey !== expectedApiKey) {
      console.error('API key mismatch');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: LeadPayload = await req.json();
    console.log('Received payload:', JSON.stringify(payload, null, 2));

    // Validación básica
    if (!payload.name || !payload.email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Name and email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Crear cliente Supabase con service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determinar stage automáticamente
    const stage = determineStage(payload);
    console.log('Determined stage:', stage);

    // Convertir booking_id a string si es número
    const bookingId = payload.booking_id ? String(payload.booking_id) : null;

    // Preparar datos para insertar/actualizar
    const customerData = {
      name: payload.name,
      email: payload.email,
      phone: payload.phone || null,
      company: payload.company || null,
      booking_id: bookingId,
      budget: payload.budget || null,
      project_type: payload.project_type || payload.description || null,
      urgency: payload.urgency || null,
      ready_to_invest: payload.ready_to_invest || payload.ready_to_invest_value || null,
      scheduled_call_time: payload.start_time || null,
      qualified: payload.qualified ?? false,
      source: payload.source || 'cal.com',
      notes: payload.description || null,
      client_type: payload.client_type || null,
      utm_source: payload.utm_source || null,
      utm_medium: payload.utm_medium || null,
      utm_campaign: payload.utm_campaign || null,
      fbclid: payload.fbclid || null,
      stage: stage,
      updated_at: new Date().toISOString(),
    };

    // Verificar si ya existe un lead con el mismo email
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', payload.email)
      .maybeSingle();

    if (existingCustomer) {
      // Actualizar el lead existente
      const { data: updated, error: updateError } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', existingCustomer.id)
        .select('id')
        .single();

      if (updateError) {
        console.error('Error updating lead:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to update lead', details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Lead updated: ${updated?.id} - Stage: ${stage}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          lead_id: updated?.id,
          message: 'Lead actualizado exitosamente',
          stage: stage,
          action: 'updated'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Crear nuevo lead
    const { data: newLead, error: insertError } = await supabase
      .from('customers')
      .insert(customerData)
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating lead:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create lead', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Lead created: ${newLead?.id} - Stage: ${stage}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        lead_id: newLead?.id,
        message: 'Lead creado exitosamente',
        stage: stage,
        action: 'created'
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
