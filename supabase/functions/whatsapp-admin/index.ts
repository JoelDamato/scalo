import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  corsHeaders,
  fetchEvolution,
  getLatestIntegration,
  normalizeEvolutionUrl,
  requireAdminUser,
  sanitizeIntegration,
  type WhatsAppIntegrationRow,
} from "../_shared/whatsapp.ts";

type Action =
  | "status"
  | "save_config"
  | "connect_instance"
  | "refresh_instance"
  | "send_test";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user, supabase } = await requireAdminUser(req);
    const body = req.method === "GET" ? {} : await req.json().catch(() => ({}));
    const action = (body.action || "status") as Action;

    if (action === "status") {
      const integration = await getLatestIntegration(supabase);
      return jsonResponse({ ok: true, integration: sanitizeIntegration(integration) });
    }

    if (action === "save_config") {
      const integration = await getLatestIntegration(supabase);
      const nextUrl = typeof body.evolution_api_url === "string" ? normalizeEvolutionUrl(body.evolution_api_url) : "";
      const nextApiKey = typeof body.evolution_api_key === "string" ? body.evolution_api_key.trim() : "";
      const nextInstanceName = typeof body.instance_name === "string" ? body.instance_name.trim() : "";
      const nextLabel = typeof body.label === "string" && body.label.trim() ? body.label.trim() : "Principal";
      const nextPhone = typeof body.instance_phone_number === "string" ? body.instance_phone_number.trim() : null;
      const nextToken = typeof body.instance_token === "string" ? body.instance_token.trim() : null;

      if (!integration) {
        if (!nextUrl || !nextApiKey || !nextInstanceName) {
          throw new Error("Completá URL de Evolution, API key e instancia.");
        }

        const { data, error } = await supabase
          .from("whatsapp_integrations")
          .insert({
            label: nextLabel,
            evolution_api_url: nextUrl,
            evolution_api_key: nextApiKey,
            instance_name: nextInstanceName,
            instance_phone_number: nextPhone,
            instance_token: nextToken,
            created_by: user.id,
            status: "draft",
          })
          .select("*")
          .single();

        if (error) throw error;
        return jsonResponse({ ok: true, integration: sanitizeIntegration(data as WhatsAppIntegrationRow) });
      }

      const { data, error } = await supabase
        .from("whatsapp_integrations")
        .update({
          label: nextLabel,
          evolution_api_url: nextUrl || integration.evolution_api_url,
          evolution_api_key: nextApiKey || integration.evolution_api_key,
          instance_name: nextInstanceName || integration.instance_name,
          instance_phone_number: nextPhone || integration.instance_phone_number,
          instance_token: nextToken || integration.instance_token,
          last_error: null,
        })
        .eq("id", integration.id)
        .select("*")
        .single();

      if (error) throw error;
      return jsonResponse({ ok: true, integration: sanitizeIntegration(data as WhatsAppIntegrationRow) });
    }

    const integration = await getLatestIntegration(supabase);
    if (!integration) {
      throw new Error("Primero guardá la configuración de Evolution API.");
    }

    if (action === "connect_instance") {
      try {
        await fetchEvolution(integration, "/instance/create", {
          method: "POST",
          body: {
            instanceName: integration.instance_name,
            token: integration.instance_token || undefined,
            qrcode: true,
            number: integration.instance_phone_number || undefined,
            integration: "WHATSAPP-BAILEYS",
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : "";
        if (!message.includes("already") && !message.includes("exists") && !message.includes("duplicate")) {
          throw error;
        }
      }

      const connectData = await fetchEvolution<{ pairingCode?: string; code?: string }>(
        integration,
        `/instance/connect/${integration.instance_name}`,
      );

      const { data, error } = await supabase
        .from("whatsapp_integrations")
        .update({
          status: "connecting",
          qr_code: connectData.code || null,
          pairing_code: connectData.pairingCode || null,
          last_error: null,
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", integration.id)
        .select("*")
        .single();

      if (error) throw error;
      return jsonResponse({ ok: true, integration: sanitizeIntegration(data as WhatsAppIntegrationRow) });
    }

    if (action === "refresh_instance") {
      const instances = await fetchEvolution<Array<{ instance?: Record<string, unknown> }>>(
        integration,
        "/instance/fetchInstances",
      );

      const current = instances.find(
        (entry) => entry?.instance?.instanceName === integration.instance_name,
      )?.instance;

      let nextStatus = current && typeof current.status === "string" ? current.status : "disconnected";
      let nextQrCode = integration.qr_code;
      let nextPairingCode = integration.pairing_code;

      if (nextStatus !== "open") {
        try {
          const connectData = await fetchEvolution<{ pairingCode?: string; code?: string }>(
            integration,
            `/instance/connect/${integration.instance_name}`,
          );
          nextQrCode = connectData.code || null;
          nextPairingCode = connectData.pairingCode || null;
          nextStatus = "connecting";
        } catch (error) {
          await supabase
            .from("whatsapp_integrations")
            .update({
              status: "error",
              last_error: error instanceof Error ? error.message : "No pude refrescar la instancia",
              last_synced_at: new Date().toISOString(),
            })
            .eq("id", integration.id);
          throw error;
        }
      } else {
        nextQrCode = null;
        nextPairingCode = null;
      }

      const { data, error } = await supabase
        .from("whatsapp_integrations")
        .update({
          status: nextStatus === "open" ? "connected" : nextStatus,
          connected_phone: typeof current?.owner === "string" ? current.owner : null,
          profile_name: typeof current?.profileName === "string" ? current.profileName : null,
          qr_code: nextQrCode,
          pairing_code: nextPairingCode,
          last_error: null,
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", integration.id)
        .select("*")
        .single();

      if (error) throw error;
      return jsonResponse({ ok: true, integration: sanitizeIntegration(data as WhatsAppIntegrationRow) });
    }

    if (action === "send_test") {
      const phoneNumber = typeof body.phone_number === "string" ? body.phone_number.trim() : "";
      const message = typeof body.message === "string" ? body.message.trim() : "";

      if (!phoneNumber || !message) {
        throw new Error("Necesito número y mensaje para la prueba.");
      }

      const normalizedPhone = phoneNumber.replace(/\D/g, "");

      const response = await fetchEvolution(
        integration,
        `/message/sendText/${integration.instance_name}`,
        {
          method: "POST",
          body: {
            number: normalizedPhone,
            text: message,
          },
        },
      );

      return jsonResponse({
        ok: true,
        sent: true,
        normalized_phone: normalizedPhone,
        response,
      });
    }

    throw new Error("Acción inválida");
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      400,
    );
  }
});

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
