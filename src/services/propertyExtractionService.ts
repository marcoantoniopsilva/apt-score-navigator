
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
    
    // Usar o wrapper com gestão automática de sessão
    const data = await supabaseFunction<any>('extract-property-data', { url }, {
      retries: 2,
      timeout: 180000, // 3 minutos para permitir processamento da IA
      refreshOnAuth: true
    });

    console.log('propertyExtractionService: Resposta da edge function:', { data });

    if (!data.success) {
      console.error('propertyExtractionService: Extração falhou:', data.error);
      
      // Se é erro de validação, propagar os detalhes
      if (data.details) {
        const error = new Error(data.error || 'Falha na extração dos dados');
        (error as any).details = data.details;
        throw error;
      }
      
      throw new Error(data.error || 'Falha na extração dos dados');
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

// Função para extrair imagens (ainda usando placeholder até implementarmos com Firecrawl)
export const extractImagesFromUrl = async (url: string): Promise<string[]> => {
  console.log('propertyExtractionService: Extraindo imagens (placeholder) para:', url);
  
  // Em uma implementação futura, isso poderia usar Firecrawl para extrair imagens reais
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Retorna imagens de exemplo por enquanto
  return [
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400'
  ];
};
