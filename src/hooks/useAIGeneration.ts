import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type GenerationType = 'brief' | 'features' | 'prd' | 'screens' | 'tech_docs' | 'implementation';

interface GenerationContext {
  initiativeName: string;
  productType: string;
  brief?: Record<string, string | null>;
  features?: Array<{ name: string; description: string | null; priority: string; user_story: string | null }>;
  featureName?: string;
  featureDescription?: string;
}

export function useAIGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = async (
    type: GenerationType,
    context: GenerationContext,
    field?: string
  ): Promise<string | Record<string, unknown> | null> => {
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-initiative-content', {
        body: { type, context, field },
      });

      if (error) {
        console.error('Generation error:', error);
        if (error.message?.includes('429')) {
          toast.error('Límite de IA excedido. Intenta más tarde.');
        } else if (error.message?.includes('402')) {
          toast.error('Créditos de IA agotados.');
        } else {
          toast.error('Error al generar contenido');
        }
        return null;
      }

      return data.content;
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
