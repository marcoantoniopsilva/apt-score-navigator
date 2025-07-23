import { supabase } from '@/integrations/supabase/client';

// Função para salvar uma nova propriedade no banco
export const savePropertyToDatabase = async (property: any) => {
  try {
    console.log('propertyDatabaseService: Salvando propriedade no banco:', property.title);
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('propertyDatabaseService: Session check:', {
      hasSession: !!session,
      userId: session?.user?.id,
      sessionError: sessionError?.message
    });
    
    if (sessionError) {
      console.error('propertyDatabaseService: Session error:', sessionError);
      throw new Error(`Erro de sessão: ${sessionError.message}`);
    }
    
    if (!session) {
      console.error('propertyDatabaseService: No session found');
      throw new Error('Usuário não autenticado. Faça login para continuar.');
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
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('updatePropertyInDatabase: Session check:', {
      hasSession: !!session,
      userId: session?.user?.id,
      sessionError: sessionError?.message
    });
    
    if (sessionError) {
      console.error('updatePropertyInDatabase: Session error:', sessionError);
      throw new Error(`Erro de sessão: ${sessionError.message}`);
    }
    
    if (!session) {
      console.error('updatePropertyInDatabase: No session found');
      throw new Error('Usuário não autenticado. Faça login para continuar.');
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
    console.log('updatePropertyInDatabase: Scores JSON:', propertyData.scores);
    console.log('updatePropertyInDatabase: Final score:', propertyData.final_score);

    const { data, error } = await supabase
      .from('properties')
      .update(propertyData)
      .eq('id', property.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('updatePropertyInDatabase: Erro detalhado:', error);
      console.error('updatePropertyInDatabase: Código do erro:', error.code);
      console.error('updatePropertyInDatabase: Mensagem:', error.message);
      console.error('updatePropertyInDatabase: Detalhes:', error.details);
      throw new Error(`Falha ao atualizar propriedade: ${error.message}`);
    }

    console.log('updatePropertyInDatabase: Propriedade atualizada no banco:', data);
    console.log('updatePropertyInDatabase: Scores salvos no banco:', data.scores);
    console.log('updatePropertyInDatabase: Final score:', data.final_score);
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
    console.log('deletePropertyFromDatabase: Iniciando exclusão da propriedade:', propertyId);
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('deletePropertyFromDatabase: Session check:', {
      hasSession: !!session,
      userId: session?.user?.id,
      sessionError: sessionError?.message
    });
    
    if (sessionError) {
      console.error('deletePropertyFromDatabase: Session error:', sessionError);
      throw new Error(`Erro de sessão: ${sessionError.message}`);
    }
    
    if (!session) {
      console.error('deletePropertyFromDatabase: No session found');
      throw new Error('Usuário não autenticado. Faça login para continuar.');
    }

    console.log('deletePropertyFromDatabase: Usuário autenticado:', session.user.id);
    console.log('deletePropertyFromDatabase: Executando query de delete...');

    const { data, error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId)
      .eq('user_id', session.user.id)
      .select();

    if (error) {
      console.error('deletePropertyFromDatabase: Erro detalhado:', error);
      console.error('deletePropertyFromDatabase: Código do erro:', error.code);
      console.error('deletePropertyFromDatabase: Mensagem:', error.message);
      throw new Error(`Falha ao deletar propriedade: ${error.message}`);
    }

    console.log('deletePropertyFromDatabase: Resposta do delete:', data);
    console.log('deletePropertyFromDatabase: Propriedade deletada com sucesso');

  } catch (error) {
    console.error('deletePropertyFromDatabase: Erro geral:', error);
    throw error;
  }
};

// Função para carregar propriedades salvas do banco
export const loadSavedProperties = async () => {
  try {
    console.log('=== INÍCIO DO CARREGAMENTO ===');
    console.log('loadSavedProperties: Verificando autenticação...');
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('loadSavedProperties: Session check:', {
      hasSession: !!session,
      userId: session?.user?.id,
      sessionError: sessionError?.message
    });
    
    if (sessionError) {
      console.error('loadSavedProperties: Session error:', sessionError);
      console.log('loadSavedProperties: Returning empty array due to session error');
      return [];
    }
    
    if (!session) {
      console.log('loadSavedProperties: No session found, returning empty array');
      return [];
    }

    console.log('loadSavedProperties: Carregando propriedades para o usuário:', session.user.id);
    
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('loadSavedProperties: Erro ao carregar:', error);
      throw new Error('Falha ao carregar propriedades salvas');
    }

    console.log('loadSavedProperties: Propriedades carregadas do banco:', properties);
    
    if (properties && properties.length > 0) {
      console.log('loadSavedProperties: Exemplo de scores carregados da primeira propriedade:', {
        scores: properties[0].scores,
        final_score: properties[0].final_score,
        location_summary: properties[0].location_summary
      });
    }
    
    console.log('=== FIM DO CARREGAMENTO ===');
    return properties || [];

  } catch (error) {
    console.error('Erro ao carregar propriedades:', error);
    throw error;
  }
};
