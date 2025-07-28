import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useDirectFetch = () => {
  const { toast } = useToast();

  const directFetch = useCallback(async () => {
    console.log('🚀 FETCH DIRETO: Testando chamada HTTP direta...');
    
    try {
      const startTime = Date.now();
      
      // Chamada HTTP direta para a edge function
      const response = await fetch('https://eepkixxqvelppxzfwoin.supabase.co/functions/v1/ping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcGtpeHhxdmVscHB4emZ3b2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzNTQ3MDIsImV4cCI6MjA2MDkzMDcwMn0.fPkjY979Pr2fKjVds0Byq3UAQ6Z5w0bBGaS48_LTBA4'
        },
        body: JSON.stringify({})
      });
      
      const endTime = Date.now();
      console.log(`🚀 FETCH DIRETO: Tempo: ${endTime - startTime}ms`);
      console.log('🚀 FETCH DIRETO: Status:', response.status);
      
      const data = await response.json();
      console.log('🚀 FETCH DIRETO: Resposta:', JSON.stringify(data, null, 2));
      
      if (response.ok && data?.success) {
        console.log('🚀 FETCH DIRETO: Sucesso!');
        toast({
          title: "✅ Fetch direto funcionou!",
          description: "Edge function respondeu via HTTP direto",
        });
        return true;
      } else {
        console.error('🚀 FETCH DIRETO: Falha:', { status: response.status, data });
        toast({
          title: "❌ Fetch direto falhou",
          description: `Status: ${response.status}`,
          variant: "destructive"
        });
        return false;
      }
      
    } catch (error) {
      console.error('🚀 FETCH DIRETO: Erro:', error);
      toast({
        title: "❌ Erro no fetch direto",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  return { directFetch };
};