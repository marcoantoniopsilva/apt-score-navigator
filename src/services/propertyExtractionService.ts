
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
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('propertyExtractionService: Erro ao obter sessão:', sessionError);
      throw new Error(`Erro de sessão: ${sessionError.message}`);
    }
    
    if (!session) {
      console.error('propertyExtractionService: Nenhuma sessão encontrada');
      throw new Error('Usuário não autenticado. Faça login para extrair propriedades.');
    }

    console.log('propertyExtractionService: Chamando edge function...');
    
    const { data, error } = await supabase.functions.invoke('extract-property-data', {
      body: { url },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    console.log('propertyExtractionService: Resposta da edge function:', { data, error });

    if (error) {
      console.error('Erro na edge function:', error);
      throw new Error(`Erro ao extrair dados: ${error.message}`);
    }

    if (!data.success) {
      console.error('Extração falhou:', data.error);
      throw new Error(data.error || 'Falha na extração dos dados');
    }

    console.log('propertyExtractionService: Dados brutos extraídos:', data.data);
    
    // Mapear os dados da edge function (snake_case) para o formato esperado pelo formulário (camelCase)
    const rawData = data.data;
    const mappedData: ExtractedPropertyData = {
      title: String(rawData.title || ''),
      address: String(rawData.address || ''),
      bedrooms: Number(rawData.bedrooms) || 0,
      bathrooms: Number(rawData.bathrooms) || 0,
      parkingSpaces: Number(rawData.parking_spaces || rawData.parkingSpaces) || 0,
      area: Number(rawData.area) || 0,
      floor: String(rawData.floor || ''),
      rent: Number(rawData.rent) || 0,
      condo: Number(rawData.condo) || 0,
      iptu: Number(rawData.iptu) || 0,
      fireInsurance: Number(rawData.fire_insurance || rawData.fireInsurance) || 50,
      otherFees: Number(rawData.other_fees || rawData.otherFees) || 0,
      images: rawData.images || [],
      scores: rawData.scores || {}
    };

    console.log('propertyExtractionService: Dados mapeados finais:', mappedData);
    
    return mappedData;

  } catch (error) {
    console.error('Erro ao extrair dados:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Não foi possível extrair dados deste site. Verifique se a URL está correta e se o site permite extração automática.');
  }
};

export const extractImagesFromUrl = async (url: string): Promise<string[]> => {
  console.log('Extraindo imagens (placeholder) para:', url);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return [
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400'
  ];
};
