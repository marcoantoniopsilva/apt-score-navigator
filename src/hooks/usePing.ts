import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const usePing = () => {
  const { toast } = useToast();

  const ping = useCallback(async () => {
    console.log('🏓 PING: Testando comunicação básica...');
    
    try {
      const startTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke('ping', {
        body: {}
      });
      
      const endTime = Date.now();
      console.log(`🏓 PING: Tempo: ${endTime - startTime}ms`);
      console.log('🏓 PING: Resposta:', JSON.stringify({ data, error }, null, 2));
      
      if (error) {
        console.error('🏓 PING: Erro:', error);
        toast({
          title: "❌ Ping falhou",
          description: `Erro: ${error.message}`,
          variant: "destructive"
        });
        return false;
      }
      
      if (data?.success) {
        console.log('🏓 PING: Sucesso!');
        toast({
          title: "✅ Ping funcionou!",
          description: "Edge functions estão operacionais",
        });
        return true;
      } else {
        console.error('🏓 PING: Resposta inválida:', data);
        toast({
          title: "❌ Ping com resposta inválida",
          description: "Edge function respondeu mas com erro",
          variant: "destructive"
        });
        return false;
      }
      
    } catch (error) {
      console.error('🏓 PING: Erro capturado:', error);
      toast({
        title: "❌ Erro na comunicação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  return { ping };
};