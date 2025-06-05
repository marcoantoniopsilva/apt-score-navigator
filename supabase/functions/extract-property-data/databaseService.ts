
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function savePropertyToDatabase(
  cleanedData: any,
  extractedImages: string[],
  url: string,
  userId: string,
  supabaseUrl: string,
  supabaseServiceRoleKey: string
) {
  // Inicializar cliente Supabase
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Calcular custo total
  const totalMonthlyCost = cleanedData.rent + cleanedData.condo + cleanedData.iptu + 50; // 50 é o padrão para seguro incêndio

  // Salvar no banco de dados com as imagens extraídas
  const { data: savedProperty, error: saveError } = await supabase
    .from('properties')
    .insert({
      user_id: userId,
      title: cleanedData.title,
      address: cleanedData.address,
      bedrooms: cleanedData.bedrooms,
      bathrooms: cleanedData.bathrooms,
      parking_spaces: cleanedData.parking_spaces,
      area: cleanedData.area,
      floor: cleanedData.floor,
      rent: cleanedData.rent,
      condo: cleanedData.condo,
      iptu: cleanedData.iptu,
      fire_insurance: 50,
      other_fees: 0,
      total_monthly_cost: totalMonthlyCost,
      source_url: url,
      images: extractedImages,
      location_score: 5.0,
      internal_space_score: 5.0,
      furniture_score: 5.0,
      accessibility_score: 5.0,
      finishing_score: 5.0,
      price_score: 5.0,
      condo_score: 5.0,
      final_score: 5.0
    })
    .select()
    .single();

  if (saveError) {
    console.error('Erro ao salvar no banco:', saveError);
    throw new Error('Falha ao salvar propriedade no banco de dados');
  }

  console.log('Propriedade salva com sucesso:', savedProperty);
  return savedProperty;
}
