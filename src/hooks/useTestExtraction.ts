import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useTestExtraction = () => {
  const { toast } = useToast();

  const testExtract = useCallback(async (url: string) => {
    console.log('🧪 TESTE FUNÇÃO SIMPLES: Iniciando...');
    console.log('🧪 URL:', url);
    
    try {
      const startTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke('test-extract', {
        body: { url }
      });
      
      const endTime = Date.now();
      console.log(`🧪 TESTE FUNÇÃO SIMPLES: Tempo: ${endTime - startTime}ms`);
      console.log('🧪 TESTE FUNÇÃO SIMPLES: Resposta:', JSON.stringify({ data, error }, null, 2));
      
      if (error) {
        console.error('🧪 TESTE FUNÇÃO SIMPLES: Erro:', error);
        toast({
          title: "Erro na função de teste",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }
      
      if (data?.success) {
        console.log('🧪 TESTE FUNÇÃO SIMPLES: Sucesso!', data.data);
        toast({
          title: "Função de teste funcionou!",
          description: "A comunicação com Supabase está OK",
        });
        return data.data;
      } else {
        console.error('🧪 TESTE FUNÇÃO SIMPLES: Falha:', data?.error);
        toast({
          title: "Função de teste falhou",
          description: data?.error || "Erro desconhecido",
          variant: "destructive"
        });
        return null;
      }
      
    } catch (error) {
      console.error('🧪 TESTE FUNÇÃO SIMPLES: Erro capturado:', error);
      toast({
        title: "Erro na função de teste",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
      return null;
    }
  }, [toast]);

  return { testExtract };
};