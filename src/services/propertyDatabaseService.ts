
import { supabase } from '@/integrations/supabase/client';

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
      condo_score: property.scores.condo,
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
    console.log('=== INÍCIO DA ATUALIZAÇÃO ===');
    console.log('updatePropertyInDatabase: Propriedade recebida:', property);
    console.log('updatePropertyInDatabase: Scores que serão salvos:', property.scores);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Usuário não autenticado');
    }

    // Converter explicitamente os scores para números
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
      location_score: Number(property.scores.location),
      internal_space_score: Number(property.scores.internalSpace),
      furniture_score: Number(property.scores.furniture),
      accessibility_score: Number(property.scores.accessibility),
      finishing_score: Number(property.scores.finishing),
      price_score: Number(property.scores.price),
      condo_score: Number(property.scores.condo),
      final_score: Number(property.finalScore),
      updated_at: new Date().toISOString()
    };

    console.log('updatePropertyInDatabase: Dados convertidos para o banco:', propertyData);
    console.log('updatePropertyInDatabase: Scores convertidos:', {
      location_score: propertyData.location_score,
      internal_space_score: propertyData.internal_space_score,
      furniture_score: propertyData.furniture_score,
      accessibility_score: propertyData.accessibility_score,
      finishing_score: propertyData.finishing_score,
      price_score: propertyData.price_score,
      condo_score: propertyData.condo_score,
      final_score: propertyData.final_score
    });

    const { data, error } = await supabase
      .from('properties')
      .update(propertyData)
      .eq('id', property.id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('updatePropertyInDatabase: Erro ao atualizar:', error);
      throw new Error('Falha ao atualizar propriedade no banco de dados');
    }

    console.log('updatePropertyInDatabase: Propriedade atualizada no banco:', data);
    console.log('updatePropertyInDatabase: Scores salvos no banco:', {
      location_score: data.location_score,
      internal_space_score: data.internal_space_score,
      furniture_score: data.furniture_score,
      accessibility_score: data.accessibility_score,
      finishing_score: data.finishing_score,
      price_score: data.price_score,
      condo_score: data.condo_score,
      final_score: data.final_score
    });
    console.log('=== FIM DA ATUALIZAÇÃO ===');
    
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
    console.log('=== INÍCIO DO CARREGAMENTO ===');
    console.log('loadSavedProperties: Carregando propriedades...');
    
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*, location_summary')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('loadSavedProperties: Erro ao carregar:', error);
      throw new Error('Falha ao carregar propriedades salvas');
    }

    console.log('loadSavedProperties: Propriedades carregadas do banco:', properties);
    
    if (properties && properties.length > 0) {
      console.log('loadSavedProperties: Exemplo de scores carregados da primeira propriedade:', {
        location_score: properties[0].location_score,
        internal_space_score: properties[0].internal_space_score,
        furniture_score: properties[0].furniture_score,
        accessibility_score: properties[0].accessibility_score,
        finishing_score: properties[0].finishing_score,
        price_score: properties[0].price_score,
        condo_score: properties[0].condo_score,
        final_score: properties[0].final_score,
        location_summary: (properties[0] as any).location_summary
      });
    }
    
    console.log('=== FIM DO CARREGAMENTO ===');
    return properties || [];

  } catch (error) {
    console.error('Erro ao carregar propriedades:', error);
    throw error;
  }
};
