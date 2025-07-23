
import { supabase } from '@/integrations/supabase/client';
import { ExtractedPropertyData } from '@/types/extractedProperty';

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
    console.log('propertyExtractionService: Iniciando processo de extração');
    console.log('propertyExtractionService: Chamando edge function para extração...');
    
    // Obter o token de sessão atual
    console.log('propertyExtractionService: Buscando sessão do usuário...');
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('propertyExtractionService: Sessão obtida');
    
    console.log('propertyExtractionService: Verificando sessão:', {
      hasSession: !!session,
      sessionError: sessionError,
      userId: session?.user?.id,
      token: session?.access_token ? 'Present' : 'Missing'
    });
    
    if (sessionError) {
      console.error('propertyExtractionService: Erro ao obter sessão:', sessionError);
      throw new Error(`Erro de sessão: ${sessionError.message}`);
    }
    
    if (!session) {
      console.error('propertyExtractionService: Nenhuma sessão encontrada');
      throw new Error('Usuário não autenticado. Faça login para extrair propriedades.');
    }

    console.log('propertyExtractionService: Iniciando chamada para edge function...');
    
    // Criar uma Promise com timeout para evitar travamento
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: Operação demorou mais que 60 segundos')), 60000);
    });
    
    const extractionPromise = supabase.functions.invoke('extract-property-data', {
      body: { url },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });
    
    console.log('propertyExtractionService: Aguardando resposta da edge function...');
    const { data, error } = await Promise.race([extractionPromise, timeoutPromise]) as any;
    
    console.log('propertyExtractionService: Resposta recebida da edge function:', { data, error });

    console.log('Resposta da edge function:', { data, error });

    if (error) {
      console.error('Erro na edge function:', error);
      throw new Error(`Erro ao extrair dados: ${error.message}`);
    }

    if (!data.success) {
      console.error('Extração falhou:', data.error);
      throw new Error(data.error || 'Falha na extração dos dados');
    }

    console.log('Dados extraídos com sucesso:', data.data);
    
    // Corrigir o mapeamento dos dados para garantir que os nomes dos campos estejam corretos
    const extractedData = data.data;
    
    const mappedData = {
      title: extractedData.title || '',
      address: extractedData.address || '',
      bedrooms: Number(extractedData.bedrooms) || 0,
      bathrooms: Number(extractedData.bathrooms) || 0,
      // Corrigir o mapeamento do parkingSpaces - a edge function retorna parking_spaces
      parkingSpaces: Number(extractedData.parking_spaces || extractedData.parkingSpaces) || 0,
      area: Number(extractedData.area) || 0,
      floor: extractedData.floor || '',
      rent: Number(extractedData.rent) || 0,
      condo: Number(extractedData.condo) || 0,
      iptu: Number(extractedData.iptu) || 0,
      // Corrigir o mapeamento do fireInsurance - a edge function retorna fire_insurance
      fireInsurance: Number(extractedData.fire_insurance || extractedData.fireInsurance) || 50,
      // Corrigir o mapeamento do otherFees - a edge function retorna other_fees
      otherFees: Number(extractedData.other_fees || extractedData.otherFees) || 0,
      images: extractedData.images || [],
      scores: extractedData.scores || {}
    };

    console.log('propertyExtractionService: Dados mapeados:', mappedData);
    
    return mappedData;

  } catch (error) {
    console.error('Erro ao extrair dados:', error);
    
    // Se houve erro, lance uma exceção mais específica
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Não foi possível extrair dados deste site. Verifique se a URL está correta e se o site permite extração automática.');
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
