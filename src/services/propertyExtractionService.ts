
import { supabase } from '@/integrations/supabase/client';
import { ExtractedPropertyData } from '@/types/extractedProperty';
import { supabaseFunction } from '@/utils/apiUtils';

export const extractPropertyFromUrl = async (url: string): Promise<ExtractedPropertyData> => {
  console.log('propertyExtractionService: Iniciando extração para URL:', url);
  
  // Validação básica da URL
  try {
    const urlObj = new URL(url);
    console.log('propertyExtractionService: URL válida detectada, domínio:', urlObj.hostname);
  } catch (error) {
    console.error('propertyExtractionService: URL inválida:', error);
    throw new Error('URL inválida. Por favor, verifique o link e tente novamente.');
  }

  try {
    console.log('propertyExtractionService: Iniciando processo de extração');
    console.log('propertyExtractionService: URL para extração:', url);
    
    // Chamada direta para debug
    console.log('propertyExtractionService: Fazendo chamada direta para edge function...');
    const { data, error } = await supabase.functions.invoke('extract-property-data', {
      body: { url }
    });

    console.log('propertyExtractionService: Resposta direta da edge function:', { 
      data, 
      error,
      success: data?.success, 
      hasData: !!data?.data,
      errorDetails: data?.error 
    });

    if (error) {
      console.error('propertyExtractionService: Erro do Supabase:', error);
      throw new Error(`Erro na comunicação: ${error.message}`);
    }

    if (!data || !data.success) {
      console.error('propertyExtractionService: Extração falhou:', data?.error || 'Resposta inválida');
      
      // Se é erro de validação, propagar os detalhes
      if (data?.details) {
        const error = new Error(data.error || 'Falha na extração dos dados');
        (error as any).details = data.details;
        throw error;
      }
      
      throw new Error(data?.error || 'Falha na extração dos dados - resposta inválida');
    }

    console.log('propertyExtractionService: Dados extraídos com sucesso (apenas para preenchimento):', data.data);
    
    // Retornar os dados APENAS para preenchimento do formulário
    // NÃO há mais salvamento automático no banco
    return {
      ...data.data,
      parkingSpaces: data.data.parkingSpaces || data.data.parking_spaces || 0,
      fireInsurance: data.data.fireInsurance || data.data.fire_insurance || 50,
      otherFees: data.data.otherFees || data.data.other_fees || 0
    };

  } catch (error) {
    console.error('propertyExtractionService: Erro ao extrair dados:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Não foi possível extrair dados deste site. Verifique se a URL está correta e se o site permite extração automática.');
  }
};

// Função para extrair imagens reais usando a edge function
export const extractImagesFromUrl = async (url: string): Promise<string[]> => {
  console.log('propertyExtractionService: Extraindo imagens reais para:', url);
  
  // As imagens já são extraídas pela edge function extract-property-data
  // Esta função será removida em favor da extração integrada
  return [];
};
