import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AutomationOutputType =
  | 'executive_summary'
  | 'system_prompt'
  | 'knowledge_base_md'
  | 'flow_map'
  | 'n8n_workflow'
  | 'integration_sheet'
  | 'user_guide'
  | 'delivery_certificate'
  | 'monthly_report';

export function useAutomationOutput() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = async (
    type: AutomationOutputType,
    knowledgeBase: Record<string, any>,
    projectName: string,
    extra?: Record<string, any>
  ): Promise<string | null> => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-automation-output', {
        body: { type, knowledgeBase, projectName, extra },
      });

      if (error) {
        console.error('Generation error:', error);
        if (error.message?.includes('429')) {
          toast.error('Límite de IA excedido. Intentá más tarde.');
        } else if (error.message?.includes('402')) {
          toast.error('Créditos de IA agotados.');
        } else {
          toast.error('Error al generar contenido');
        }
        return null;
      }

      return typeof data.content === 'string' ? data.content : JSON.stringify(data.content, null, 2);
    } catch (err) {
      console.error('Generation error:', err);
      toast.error('Error al generar contenido');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generate, isGenerating };
}
