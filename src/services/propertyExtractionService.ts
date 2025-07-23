
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
    
    // Mapping mais robusto para garantir compatibilidade
    const mappedData = {
      title: extractedData.title || '',
      address: extractedData.address || '',
      bedrooms: Number(extractedData.bedrooms) || 0,
      bathrooms: Number(extractedData.bathrooms) || 0,
      // Mapear todos os possíveis nomes para parkingSpaces
      parkingSpaces: Number(
        extractedData.parkingSpaces || 
        extractedData.parking_spaces || 
        extractedData.vagas || 
        0
      ),
      area: Number(extractedData.area) || 0,
      floor: extractedData.floor || '',
      rent: Number(extractedData.rent || extractedData.aluguel) || 0,
      condo: Number(extractedData.condo || extractedData.condominio) || 0,
      iptu: Number(extractedData.iptu) || 0,
      // Mapear todos os possíveis nomes para fireInsurance
      fireInsurance: Number(
        extractedData.fireInsurance || 
        extractedData.fire_insurance || 
        extractedData.seguro_incendio || 
        50
      ),
      // Mapear todos os possíveis nomes para otherFees
      otherFees: Number(
        extractedData.otherFees || 
        extractedData.other_fees || 
        extractedData.outras_taxas || 
        0
      ),
      images: extractedData.images || [],
      scores: extractedData.scores || {}
    };

    console.log('propertyExtractionService: Dados mapeados final:', mappedData);
    console.log('propertyExtractionService: Verificação dos campos mapeados:', {
      title: mappedData.title,
      address: mappedData.address,
      bedrooms: mappedData.bedrooms,
      bathrooms: mappedData.bathrooms,
      parkingSpaces: mappedData.parkingSpaces,
      area: mappedData.area,
      floor: mappedData.floor,
      rent: mappedData.rent,
      condo: mappedData.condo,
      iptu: mappedData.iptu,
      fireInsurance: mappedData.fireInsurance,
      otherFees: mappedData.otherFees
    });
    
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
