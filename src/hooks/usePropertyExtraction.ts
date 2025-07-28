import { useState, useEffect, useCallback } from 'react';
import { extractPropertyFromUrl } from '@/services/propertyExtractionService';
import { useToast } from '@/hooks/use-toast';
import { useTabVisibility } from '@/hooks/useTabVisibility';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para gerenciar extração de propriedades com tratamento de tab switching
 */
export const usePropertyExtraction = () => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [lastExtractionUrl, setLastExtractionUrl] = useState<string>('');
  const { toast } = useToast();
  const { onTabReactivated } = useTabVisibility();

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
    if (!url.trim()) {
      toast({
        title: "URL obrigatória",
        description: "Por favor, insira uma URL válida.",
        variant: "destructive"
      });
      return null;
    }

    if (isExtracting) {
      console.log('⚠️ Extração já em andamento, ignorando nova tentativa');
      return null;
    }

    setIsExtracting(true);
    setLastExtractionUrl(url);
    
    try {
      console.log('🔄 Iniciando extração de propriedade:', url);
      
      // Verificar se a sessão ainda é válida antes de extrair
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Sessão expirada. Por favor, atualize a página e tente novamente.');
      }

      const propertyData = await extractPropertyFromUrl(url);
      
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
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na extração';
      
      toast({
        title: "Erro na extração",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setIsExtracting(false);
    }
  }, [isExtracting, toast]);

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