import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { ExtractedPropertyData } from '@/types/extractedProperty';

interface ExtractionResult {
  success: boolean;
  data?: ExtractedPropertyData;
  error?: string;
}

/**
 * Hook for direct HTTP calls to extract-property-data edge function
 * Bypasses supabase.functions.invoke() for better session management
 */
export const useHttpDirectExtraction = () => {
  const [isExtracting, setIsExtracting] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  const extractPropertyData = async (url: string): Promise<ExtractionResult> => {
    if (!session?.access_token) {
      const error = 'Usuário não autenticado';
      toast({
        title: "Erro de autenticação",
        description: error,
        variant: "destructive",
      });
      return { success: false, error };
    }

    if (!url || !url.trim()) {
      const error = 'URL é obrigatória';
      toast({
        title: "URL inválida",
        description: error,
        variant: "destructive",
      });
      return { success: false, error };
    }

    setIsExtracting(true);

    try {
      console.log('🚀 useHttpDirectExtraction: Iniciando extração direta via HTTP');
      console.log('📍 URL:', url);
      console.log('🔑 Session token presente:', !!session.access_token);

      // Get Supabase URL and API key from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Configuração do Supabase não encontrada');
      }

      const functionUrl = `${supabaseUrl}/functions/v1/extract-property-data`;
      console.log('🌐 Function URL:', functionUrl);

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ url })
      });

      console.log('📡 HTTP Response status:', response.status);
      console.log('📡 HTTP Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error response:', errorText);
        throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Dados extraídos com sucesso:', data);

      toast({
        title: "Propriedade extraída com sucesso!",
        description: `Dados de ${data.titulo || 'propriedade'} foram processados`,
      });

      return { success: true, data };

    } catch (error) {
      console.error('❌ Erro na extração HTTP:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: "Erro na extração",
        description: `Falha ao extrair dados: ${errorMessage}`,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };

    } finally {
      setIsExtracting(false);
    }
  };

  return {
    extractPropertyData,
    isExtracting
  };
};