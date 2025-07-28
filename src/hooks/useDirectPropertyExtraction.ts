import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useDirectPropertyExtraction = () => {
  const { toast } = useToast();

  const extractWithDirectFetch = useCallback(async (url: string) => {
    console.log('🚀 EXTRAÇÃO DIRETA: Iniciando...');
    console.log('🚀 URL:', url);
    
    try {
      const startTime = Date.now();
      
      // Chamar a função completa original via HTTP direto
      const response = await fetch('https://eepkixxqvelppxzfwoin.supabase.co/functions/v1/extract-property-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcGtpeHhxdmVscHB4emZ3b2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzNTQ3MDIsImV4cCI6MjA2MDkzMDcwMn0.fPkjY979Pr2fKjVds0Byq3UAQ6Z5w0bBGaS48_LTBA4'
        },
        body: JSON.stringify({ url })
      });
      
      const endTime = Date.now();
      console.log(`🚀 EXTRAÇÃO DIRETA: Tempo: ${endTime - startTime}ms`);
      console.log('🚀 EXTRAÇÃO DIRETA: Status:', response.status);
      
      const data = await response.json();
      console.log('🚀 EXTRAÇÃO DIRETA: Resposta:', JSON.stringify(data, null, 2));
      
      if (response.ok && data?.success) {
        console.log('🚀 EXTRAÇÃO DIRETA: Sucesso completo!');
        
        toast({
          title: "✅ Propriedade extraída e avaliada!",
          description: "Dados extraídos com Firecrawl e avaliados com IA",
        });
        return data.data;
      } else {
        console.error('🚀 EXTRAÇÃO DIRETA: Falha:', { status: response.status, data });
        toast({
          title: "❌ Falha na extração",
          description: data?.error || `Status: ${response.status}`,
          variant: "destructive"
        });
        return null;
      }
      
    } catch (error) {
      console.error('🚀 EXTRAÇÃO DIRETA: Erro:', error);
      toast({
        title: "❌ Erro na extração",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
      return null;
    }
  }, [toast]);

  return { extractWithDirectFetch };
};