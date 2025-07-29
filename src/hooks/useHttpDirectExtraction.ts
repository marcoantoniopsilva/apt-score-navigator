import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { ExtractedPropertyData } from '@/types/extractedProperty';

interface ExtractionResult {
  success: boolean;
  data?: ExtractedPropertyData;
  error?: string;
}

/**
 * Hook simplificado - apenas usa o token já disponível no AuthContext
 * Não tenta fazer refresh de sessão que pode travar
 */
export const useHttpDirectExtraction = () => {
  const [isExtracting, setIsExtracting] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  const extractPropertyData = async (url: string): Promise<ExtractionResult> => {
    setIsExtracting(true);

    try {
      console.log('🚀 EXTRAÇÃO SIMPLIFICADA - usando token direto do AuthContext');
      
      if (!url || !url.trim()) {
        const error = 'URL é obrigatória';
        toast({
          title: "URL inválida", 
          description: error,
          variant: "destructive",
        });
        return { success: false, error };
      }

      // Usa APENAS o token do AuthContext - sem getSession()
      const accessToken = session?.access_token;
      
      if (!accessToken) {
        const error = 'Token não disponível no AuthContext';
        console.error('❌ Sem token no AuthContext:', session);
        toast({
          title: "Erro de autenticação",
          description: error,
          variant: "destructive",
        });
        return { success: false, error };
      }

      console.log('✅ Token encontrado no AuthContext');
      console.log('📍 URL:', url);

      const projectId = 'eepkixxqvelppxzfwoin';
      const functionUrl = `https://${projectId}.supabase.co/functions/v1/extract-property-data`;
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcGtpeHhxdmVscHB4emZ3b2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzNTQ3MDIsImV4cCI6MjA2MDkzMDcwMn0.fPkjY979Pr2fKjVds0Byq3UAQ6Z5w0bBGaS48_LTBA4';
      
      console.log('⏳ Fazendo chamada HTTP direta...');

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ url })
      });

      console.log('📡 Resposta recebida - Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro HTTP:', errorText);
        throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Dados extraídos:', data);

      toast({
        title: "Propriedade extraída com sucesso!",
        description: `Dados de ${data.title || 'propriedade'} foram processados`,
      });

      return { success: true, data };

    } catch (error) {
      console.error('❌ Erro completo:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: "Erro na extração",
        description: `Falha: ${errorMessage}`,
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