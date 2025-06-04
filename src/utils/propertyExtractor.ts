
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
    
    // Obter o token de sessão atual
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Usuário não autenticado. Faça login para extrair propriedades.');
    }

    const { data, error } = await supabase.functions.invoke('extract-property-data', {
      body: { url },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
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

// Função para salvar uma nova propriedade no banco
export const savePropertyToDatabase = async (property: any) => {
  try {
    console.log('Salvando propriedade no banco:', property);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Usuário não autenticado');
    }

    const propertyData = {
      title: property.title,
      address: property.address,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      parking_spaces: property.parkingSpaces,
      area: property.area,
      floor: property.floor || '',
      rent: property.rent,
      condo: property.condo,
      iptu: property.iptu,
      fire_insurance: property.fireInsurance,
      other_fees: property.otherFees,
      total_monthly_cost: property.totalMonthlyCost,
      images: property.images || [],
      source_url: property.sourceUrl || null,
      location_score: property.scores.location,
      internal_space_score: property.scores.internalSpace,
      furniture_score: property.scores.furniture,
      accessibility_score: property.scores.accessibility,
      finishing_score: property.scores.finishing,
      price_score: property.scores.price,
      final_score: property.finalScore,
      user_id: session.user.id
    };

    const { data, error } = await supabase
      .from('properties')
      .insert(propertyData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar propriedade:', error);
      throw new Error('Falha ao salvar propriedade no banco de dados');
    }

    console.log('Propriedade salva com sucesso:', data);
    return data;

  } catch (error) {
    console.error('Erro ao salvar propriedade:', error);
    throw error;
  }
};

// Função para atualizar uma propriedade existente
export const updatePropertyInDatabase = async (property: any) => {
  try {
    console.log('Atualizando propriedade no banco:', property);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Usuário não autenticado');
    }

    const propertyData = {
      title: property.title,
      address: property.address,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      parking_spaces: property.parkingSpaces,
      area: property.area,
      floor: property.floor || '',
      rent: property.rent,
      condo: property.condo,
      iptu: property.iptu,
      fire_insurance: property.fireInsurance,
      other_fees: property.otherFees,
      total_monthly_cost: property.totalMonthlyCost,
      images: property.images || [],
      source_url: property.sourceUrl || null,
      location_score: property.scores.location,
      internal_space_score: property.scores.internalSpace,
      furniture_score: property.scores.furniture,
      accessibility_score: property.scores.accessibility,
      finishing_score: property.scores.finishing,
      price_score: property.scores.price,
      final_score: property.finalScore,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('properties')
      .update(propertyData)
      .eq('id', property.id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar propriedade:', error);
      throw new Error('Falha ao atualizar propriedade no banco de dados');
    }

    console.log('Propriedade atualizada com sucesso:', data);
    return data;

  } catch (error) {
    console.error('Erro ao atualizar propriedade:', error);
    throw error;
  }
};

// Função para deletar uma propriedade
export const deletePropertyFromDatabase = async (propertyId: string) => {
  try {
    console.log('Deletando propriedade do banco:', propertyId);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Usuário não autenticado');
    }

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Erro ao deletar propriedade:', error);
      throw new Error('Falha ao deletar propriedade do banco de dados');
    }

    console.log('Propriedade deletada com sucesso');

  } catch (error) {
    console.error('Erro ao deletar propriedade:', error);
    throw error;
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
