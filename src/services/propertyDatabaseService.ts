import { supabase } from '@/integrations/supabase/client';
import { supabaseQuery } from '@/utils/apiUtils';

// Função para salvar uma nova propriedade no banco
export const savePropertyToDatabase = async (property: any) => {
  return await supabaseQuery(async () => {
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
      scores: property.scores,
      final_score: property.finalScore,
      user_id: session.user.id
    };

    const result = await supabase
      .from('properties')
      .insert(propertyData)
      .select()
      .single();

    console.log('Propriedade salva com sucesso:', result.data);
    return result;
  }, { retries: 2, refreshOnAuth: true });
};

// Função para atualizar uma propriedade existente
export const updatePropertyInDatabase = async (property: any) => {
  return await supabaseQuery(async () => {
    console.log('=== INÍCIO DA ATUALIZAÇÃO ===');
    console.log('updatePropertyInDatabase: Propriedade recebida:', property);
    console.log('updatePropertyInDatabase: Scores que serão salvos:', property.scores);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Usuário não autenticado');
    }

    // Dados da propriedade com scores no formato JSON
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
      scores: property.scores,
      final_score: Number(property.finalScore),
      location_summary: property.locationSummary || null,
      updated_at: new Date().toISOString()
    };

    console.log('updatePropertyInDatabase: Dados convertidos para o banco:', propertyData);

    const result = await supabase
      .from('properties')
      .update(propertyData)
      .eq('id', property.id)
      .select()
      .maybeSingle();

    console.log('updatePropertyInDatabase: Propriedade atualizada no banco:', result.data);
    console.log('=== FIM DA ATUALIZAÇÃO ===');
    
    return result;
  }, { retries: 2, refreshOnAuth: true });
};

// Função para deletar uma propriedade
export const deletePropertyFromDatabase = async (propertyId: string) => {
  return await supabaseQuery(async () => {
    console.log('deletePropertyFromDatabase: Iniciando exclusão da propriedade:', propertyId);
    
    // Double-check session validity before deletion
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error during deletion:', sessionError);
      throw new Error('Session error. Please refresh and try again.');
    }
    
    if (!session || !session.user) {
      console.error('No valid session found for deletion');
      throw new Error('Session expired. Please log in again.');
    }

    console.log('deletePropertyFromDatabase: Session valid, proceeding with deletion');

    const result = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId)
      .eq('user_id', session.user.id)
      .select();

    if (result.error) {
      console.error('Database deletion error:', result.error);
      throw result.error;
    }

    console.log('deletePropertyFromDatabase: Propriedade deletada com sucesso');
    return result;
  }, { retries: 2, refreshOnAuth: true });
};

// Função para carregar propriedades salvas do banco
export const loadSavedProperties = async () => {
  try {
    const data = await supabaseQuery(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return { data: [], error: null };
      }

      return await supabase
        .from('properties')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
    }, { retries: 2, refreshOnAuth: true });

    return data || [];
  } catch (error) {
    console.error('Erro ao carregar propriedades:', error);
    return [];
  }
};
