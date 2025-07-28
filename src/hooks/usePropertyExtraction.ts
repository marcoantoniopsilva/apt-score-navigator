import { useState, useEffect, useCallback, useRef } from 'react';
import { extractPropertyFromUrl } from '@/services/propertyExtractionService';
import { useToast } from '@/hooks/use-toast';
import { useTabVisibility } from '@/hooks/useTabVisibility';
import { useSessionMonitor } from '@/hooks/useSessionMonitor';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para gerenciar extração de propriedades com tratamento de tab switching
 */
export const usePropertyExtraction = () => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [lastExtractionUrl, setLastExtractionUrl] = useState<string>('');
  const { toast } = useToast();
  const { onTabReactivated } = useTabVisibility();
  const { validateSession } = useSessionMonitor();
  const extractionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset extraction state when tab is reactivated
  useEffect(() => {
    const cleanup = onTabReactivated(() => {
      console.log('🔄 Tab reactivated - resetting extraction state');
      if (isExtracting) {
        setIsExtracting(false);
        toast({
          title: "Reativação de aba detectada",
          description: "Por favor, tente a extração novamente se necessário.",
          variant: "default"
        });
      }
    });

    return cleanup;
  }, [onTabReactivated, isExtracting, toast]);

  const extractPropertyData = useCallback(async (url: string) => {
    // Debounce: cancelar extração anterior se uma nova for iniciada rapidamente
    if (extractionTimeoutRef.current) {
      clearTimeout(extractionTimeoutRef.current);
      extractionTimeoutRef.current = null;
    }

    if (!url.trim()) {
      toast({
        title: "URL obrigatória",
        description: "Por favor, insira uma URL válida.",
        variant: "destructive"
      });
      return null;
    }

    if (isExtracting) {
      console.log('⚠️ Extração já em andamento, cancelando tentativa anterior');
      setIsExtracting(false);
      
      // Aguardar um pouco antes de iniciar nova extração
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsExtracting(true);
    setLastExtractionUrl(url);
    
    // Timeout de segurança para evitar que a extração trave
    extractionTimeoutRef.current = setTimeout(() => {
      if (isExtracting) {
        console.error('⏰ Timeout na extração - forçando reset');
        setIsExtracting(false);
        toast({
          title: "Timeout na extração",
          description: "A extração demorou muito. Tente novamente.",
          variant: "destructive"
        });
      }
    }, 180000); // 3 minutos de timeout
    
    try {
      console.log('🔄 Iniciando extração de propriedade:', url);
      
      // Validação robusta de sessão com o monitor
      console.log('🔐 Validando sessão com monitor...');
      const sessionValid = await validateSession();
      
      if (!sessionValid) {
        throw new Error('Sessão inválida ou expirada. Por favor, atualize a página e faça login novamente.');
      }
      
      console.log('✅ Sessão validada pelo monitor');

      console.log('📡 Chamando edge function extract-property-data...');
      const propertyData = await extractPropertyFromUrl(url);
      console.log('✅ Dados extraídos da edge function:', propertyData);
      
      if (!propertyData) {
        throw new Error('Não foi possível extrair dados da propriedade');
      }
      
      // Avaliar o imóvel com IA
      let evaluationData = null;
      try {
        console.log('🤖 Avaliando propriedade com IA...');
        const { data: aiEvaluation, error: evaluationError } = await supabase.functions.invoke('evaluate-property-scores', {
          body: { propertyData }
        });

        if (evaluationError) {
          console.warn('⚠️ Erro na avaliação da IA:', evaluationError);
          toast({
            title: "Aviso",
            description: "Propriedade extraída sem avaliação da IA. Você pode inserir os scores manualmente.",
            variant: "default"
          });
        } else if (aiEvaluation?.success && aiEvaluation?.scores) {
          evaluationData = aiEvaluation;
          console.log('✅ Avaliação da IA recebida:', evaluationData);
        }
      } catch (aiError) {
        console.warn('⚠️ Falha na avaliação da IA:', aiError);
        toast({
          title: "Aviso",
          description: "Propriedade extraída sem avaliação da IA. Você pode inserir os scores manualmente.",
          variant: "default"
        });
      }

      // Combinar dados extraídos com avaliação da IA
      const finalPropertyData = {
        ...propertyData,
        ...(evaluationData?.scores && { scores: evaluationData.scores }),
        ...(evaluationData?.finalScore && { finalScore: evaluationData.finalScore }),
        extractedAt: new Date().toISOString()
      };

      console.log('✅ Extração concluída com sucesso:', finalPropertyData);
      
      toast({
        title: "Dados extraídos com sucesso!",
        description: evaluationData 
          ? "Propriedade extraída e avaliada pela IA."
          : "Propriedade extraída. Configure os scores manualmente.",
      });

      return finalPropertyData;

    } catch (error) {
      console.error('❌ Erro na extração:', error);
      
      let errorMessage = 'Erro desconhecido na extração';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Erro na extração",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      // Limpar timeout
      if (extractionTimeoutRef.current) {
        clearTimeout(extractionTimeoutRef.current);
        extractionTimeoutRef.current = null;
      }
      setIsExtracting(false);
    }
  }, [isExtracting, toast]);

  // Cleanup do timeout quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (extractionTimeoutRef.current) {
        clearTimeout(extractionTimeoutRef.current);
      }
    };
  }, []);

  const retryLastExtraction = useCallback(() => {
    if (lastExtractionUrl && !isExtracting) {
      console.log('🔄 Tentando novamente a última extração:', lastExtractionUrl);
      return extractPropertyData(lastExtractionUrl);
    }
    return Promise.resolve(null);
  }, [lastExtractionUrl, isExtracting, extractPropertyData]);

  return {
    extractPropertyData,
    retryLastExtraction,
    isExtracting,
    lastExtractionUrl
  };
};