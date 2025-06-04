
import { supabase } from '@/integrations/supabase/client';

interface ExtractedPropertyData {
  title: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  area: number;
  floor: string;
  rent: number;
  condo: number;
  iptu: number;
}

export const extractPropertyFromUrl = async (url: string): Promise<ExtractedPropertyData> => {
  console.log('Iniciando extração para URL:', url);
  
  // Validação básica da URL
  try {
    const urlObj = new URL(url);
    console.log('URL válida detectada, domínio:', urlObj.hostname);
  } catch (error) {
    console.error('URL inválida:', error);
    throw new Error('URL inválida. Por favor, verifique o link e tente novamente.');
  }

  try {
    console.log('Chamando edge function para extração...');
    
    const { data, error } = await supabase.functions.invoke('extract-property-data', {
      body: { url }
    });

    if (error) {
      console.error('Erro na edge function:', error);
      throw new Error(`Erro ao extrair dados: ${error.message}`);
    }

    if (!data.success) {
      console.error('Extração falhou:', data.error);
      throw new Error(data.error || 'Falha na extração dos dados');
    }

    console.log('Dados extraídos e salvos com sucesso:', data.data);
    
    // Retornar os dados para preenchimento do formulário
    return {
      ...data.data,
      parkingSpaces: data.data.parking_spaces || 0 // Converter snake_case para camelCase
    };

  } catch (error) {
    console.error('Erro ao extrair dados:', error);
    
    // Se houve erro, lance uma exceção mais específica
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Não foi possível extrair dados deste site. Verifique se a URL está correta e se o site permite extração automática.');
  }
};

// Função para carregar propriedades salvas do banco
export const loadSavedProperties = async () => {
  try {
    console.log('Carregando propriedades salvas...');
    
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar propriedades:', error);
      throw new Error('Falha ao carregar propriedades salvas');
    }

    console.log('Propriedades carregadas:', properties);
    return properties || [];

  } catch (error) {
    console.error('Erro ao carregar propriedades:', error);
    throw error;
  }
};

// Função para extrair imagens (ainda usando placeholder até implementarmos com Firecrawl)
export const extractImagesFromUrl = async (url: string): Promise<string[]> => {
  console.log('Extraindo imagens (placeholder) para:', url);
  
  // Em uma implementação futura, isso poderia usar Firecrawl para extrair imagens reais
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Retorna imagens de exemplo por enquanto
  return [
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400'
  ];
};
