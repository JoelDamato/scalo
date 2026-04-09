import { useConversation } from "@elevenlabs/react";
import { useState, useCallback } from "react";
import { Phone, PhoneOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export function ElevenLabsAssistant() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { isAdmin, loading: roleLoading } = useAuth();

  const conversation = useConversation({
    onConnect: () => {
      console.log("ElevenLabs: Connected to agent");
      toast.success("Asistente conectado. ¡Hablá!");
    },
    onDisconnect: () => {
      console.log("ElevenLabs: Disconnected from agent");
      toast.info("Llamada finalizada");
    },
    onMessage: (message) => {
      console.log("ElevenLabs message:", message);
    },
    onError: (error) => {
      console.error("ElevenLabs error:", error);
      toast.error("Error en la conexión de voz");
    },
    clientTools: {
      // Create a task in a project
      create_task: async (params: { project_name: string; title: string; description?: string }) => {
        console.log("Client tool: create_task", params);
        try {
          const { data, error } = await supabase.functions.invoke("assistant-execute", {
            body: { tool: "create_task", args: params },
          });
          
          if (error) throw error;
          
          toast.success(data.message);
          return data.message;
        } catch (err) {
          console.error("create_task error:", err);
          return "Error al crear la tarea";
        }
      },
      
      // Create a new customer
      create_customer: async (params: { name: string; email?: string; phone?: string; company?: string; stage?: string }) => {
        console.log("Client tool: create_customer", params);
        try {
          const { data, error } = await supabase.functions.invoke("assistant-execute", {
            body: { tool: "create_customer", args: params },
          });
          
          if (error) throw error;
          
          toast.success(data.message);
          return data.message;
        } catch (err) {
          console.error("create_customer error:", err);
          return "Error al crear el cliente";
        }
      },
      
      // Move customer to a different stage
      move_customer_stage: async (params: { customer_name: string; new_stage: string }) => {
        console.log("Client tool: move_customer_stage", params);
        try {
          const { data, error } = await supabase.functions.invoke("assistant-execute", {
            body: { tool: "move_customer_stage", args: params },
          });
          
          if (error) throw error;
          
          toast.success(data.message);
          return data.message;
        } catch (err) {
          console.error("move_customer_stage error:", err);
          return "Error al mover el cliente";
        }
      },
      
      // Get pipeline status
      get_pipeline_status: async () => {
        console.log("Client tool: get_pipeline_status");
        try {
          const { data: customers, error } = await supabase
            .from("customers")
            .select("stage");
          
          if (error) throw error;
          
          const counts = {
            lead: 0,
            prospect: 0,
            negotiation: 0,
            client: 0,
            churned: 0,
          };
          
          customers?.forEach((c) => {
            if (c.stage in counts) {
              counts[c.stage as keyof typeof counts]++;
            }
          });
          
          const message = `Pipeline: ${counts.lead} leads, ${counts.prospect} prospectos, ${counts.negotiation} en negociación, ${counts.client} clientes, ${counts.churned} perdidos`;
          return message;
        } catch (err) {
          console.error("get_pipeline_status error:", err);
          return "Error al obtener el estado del pipeline";
        }
      },
    },
  });

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get token from edge function
      const { data, error } = await supabase.functions.invoke("elevenlabs-conversation-token");

      if (error || !data?.token) {
        throw new Error(error?.message || "No se pudo obtener el token");
      }

      // Start the conversation with WebRTC
      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Error al iniciar la conversación"
      );
    } finally {
      setIsConnecting(false);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  // Don't render for non-admins
  if (roleLoading || !isAdmin) {
    return null;
  }

  const isConnected = conversation.status === "connected";
  const isSpeaking = conversation.isSpeaking;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Status indicator when connected */}
      {isConnected && (
        <div className="absolute -top-16 right-0 bg-card border rounded-lg px-3 py-2 shadow-lg animate-fade-in">
          <div className="flex items-center gap-2 text-sm">
            <div 
              className={cn(
                "w-2 h-2 rounded-full",
                isSpeaking ? "bg-primary animate-pulse" : "bg-green-500"
              )} 
            />
            <span className="text-muted-foreground">
              {isSpeaking ? "Portal hablando..." : "Escuchando..."}
            </span>
          </div>
        </div>
      )}

      {/* Main button */}
      <Button
        size="lg"
        onClick={isConnected ? stopConversation : startConversation}
        disabled={isConnecting}
        className={cn(
          "h-14 w-14 rounded-full shadow-lg transition-all",
          isConnected 
            ? "bg-destructive hover:bg-destructive/90" 
            : "bg-primary hover:bg-primary/90",
          isSpeaking && "ring-4 ring-primary/30 animate-pulse"
        )}
      >
        {isConnecting ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : isConnected ? (
          <PhoneOff className="h-6 w-6" />
        ) : (
          <Phone className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
