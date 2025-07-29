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
      console.log('🔑 Session token (primeiros 50 chars):', session.access_token?.substring(0, 50) + '...');

      // Construir URL da função usando o project ID
      const projectId = 'eepkixxqvelppxzfwoin';
      const functionUrl = `https://${projectId}.supabase.co/functions/v1/extract-property-data`;
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcGtpeHhxdmVscHB4emZ3b2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzNTQ3MDIsImV4cCI6MjA2MDkzMDcwMn0.fPkjY979Pr2fKjVds0Byq3UAQ6Z5w0bBGaS48_LTBA4';
      
      console.log('🌐 Function URL:', functionUrl);
      console.log('🔐 Apikey (primeiros 50 chars):', supabaseAnonKey.substring(0, 50) + '...');

      const requestPayload = { url };
      console.log('📦 Payload:', requestPayload);

      const requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': supabaseAnonKey,
      };
      console.log('📋 Headers preparados (sem valores sensíveis)');

      console.log('⏳ Fazendo chamada HTTP...');

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
        description: `Dados de ${data.title || 'propriedade'} foram processados`,
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