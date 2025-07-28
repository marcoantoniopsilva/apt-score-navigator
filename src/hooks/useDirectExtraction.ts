import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook simplificado para teste direto da edge function
 */
export const useDirectExtraction = () => {
  const { toast } = useToast();

  const extractDirectly = useCallback(async (url: string) => {
    console.log('🚨 TESTE DIRETO: Chamando edge function extract-property-data');
    console.log('🚨 URL:', url);
    
    try {
      const startTime = Date.now();
      console.log('🚨 TESTE DIRETO: Fazendo chamada para Supabase...');
      
      const { data, error } = await supabase.functions.invoke('extract-property-data', {
        body: { url }
      });
      
      const endTime = Date.now();
      console.log(`🚨 TESTE DIRETO: Tempo de resposta: ${endTime - startTime}ms`);
      console.log('🚨 TESTE DIRETO: Resposta raw:', JSON.stringify({ data, error }, null, 2));
      
      if (error) {
        console.error('🚨 TESTE DIRETO: Erro do Supabase:', JSON.stringify(error, null, 2));
        toast({
          title: "Erro na comunicação",
          description: `Erro do Supabase: ${error.message}`,
          variant: "destructive"
        });
        return null;
      }
      
      if (!data) {
        console.error('🚨 TESTE DIRETO: Nenhum dado retornado');
        toast({
          title: "Erro na extração",
          description: "Nenhum dado retornado da função",
          variant: "destructive"
        });
        return null;
      }
      
      console.log('🚨 TESTE DIRETO: Tipo do data:', typeof data);
      console.log('🚨 TESTE DIRETO: Propriedades do data:', Object.keys(data || {}));
      
      if (!data.success) {
        console.error('🚨 TESTE DIRETO: Extração falhou:', data.error || 'Erro desconhecido');
        toast({
          title: "Falha na extração",
          description: data.error || "Erro desconhecido na extração",
          variant: "destructive"
        });
        return null;
      }
      
      console.log('🚨 TESTE DIRETO: Sucesso! Dados extraídos:', JSON.stringify(data.data, null, 2));
      toast({
        title: "Sucesso na extração!",
        description: "Dados extraídos com sucesso via teste direto",
      });
      
      return data.data;
      
    } catch (error) {
      console.error('🚨 TESTE DIRETO: Erro capturado:', error);
      console.error('🚨 TESTE DIRETO: Stack trace:', error.stack);
      toast({
        title: "Erro no teste direto",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
      return null;
    }
  }, [toast]);

  return { extractDirectly };
};