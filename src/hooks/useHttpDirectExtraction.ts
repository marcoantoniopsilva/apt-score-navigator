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
    setIsExtracting(true);

    try {
      console.log('🔄 Verificando e atualizando sessão antes da extração...');

      if (!url || !url.trim()) {
        const error = 'URL é obrigatória';
        toast({
          title: "URL inválida", 
          description: error,
          variant: "destructive",
        });
        return { success: false, error };
      }

      // Estratégia robusta: tenta diferentes formas de obter o token
      let accessToken: string | undefined;

      try {
        // Tentativa 1: getSession() com timeout de 3 segundos
        console.log('🔍 Tentativa 1: getSession() com timeout...');
        
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout na getSession')), 3000)
        );
        
        const sessionResult = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (sessionResult?.data?.session?.access_token) {
          accessToken = sessionResult.data.session.access_token;
          console.log('✅ Token obtido via getSession()');
        }
      } catch (error) {
        console.log('⚠️ getSession() falhou:', error);
      }

      // Tentativa 2: usar token da sessão em cache do AuthContext  
      if (!accessToken && session?.access_token) {
        accessToken = session.access_token;
        console.log('✅ Token obtido via AuthContext cache');
      }

      // Tentativa 3: verificar localStorage diretamente
      if (!accessToken) {
        try {
          console.log('🔍 Tentativa 3: verificando localStorage...');
          const projectId = 'eepkixxqvelppxzfwoin';
          const supabaseAuth = localStorage.getItem(`sb-${projectId}-auth-token`);
          if (supabaseAuth) {
            const authData = JSON.parse(supabaseAuth);
            if (authData?.access_token) {
              accessToken = authData.access_token;
              console.log('✅ Token obtido via localStorage');
            }
          }
        } catch (error) {
          console.log('⚠️ localStorage falhou:', error);
        }
      }

      if (!accessToken) {
        const error = 'Não foi possível obter token de acesso. Faça login novamente.';
        console.error('❌ Todas as tentativas de obter token falharam');
        toast({
          title: "Erro de autenticação",
          description: error,
          variant: "destructive",
        });
        return { success: false, error };
      }

      console.log('🚀 useHttpDirectExtraction: Iniciando extração direta via HTTP');
      console.log('📍 URL:', url);
      console.log('🔑 Token obtido com sucesso');

      // Construir URL da função usando o project ID
      const projectId = 'eepkixxqvelppxzfwoin';
      const functionUrl = `https://${projectId}.supabase.co/functions/v1/extract-property-data`;
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcGtpeHhxdmVscHB4emZ3b2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzNTQ3MDIsImV4cCI6MjA2MDkzMDcwMn0.fPkjY979Pr2fKjVds0Byq3UAQ6Z5w0bBGaS48_LTBA4';
      
      console.log('🌐 Function URL:', functionUrl);
      console.log('⏳ Fazendo chamada HTTP...');

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
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