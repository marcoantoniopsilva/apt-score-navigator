
import { supabase } from '@/integrations/supabase/client';

export interface ExtractedData {
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
  fireInsurance: number;
  otherFees: number;
  images: string[];
  scores: Record<string, number>;
}

export const extractDataFromUrl = async (url: string): Promise<ExtractedData> => {
  console.log('🔍 Iniciando extração para URL:', url);
  
  try {
    const urlObj = new URL(url);
    console.log('✅ URL válida:', urlObj.hostname);
  } catch (error) {
    console.error('❌ URL inválida:', error);
    throw new Error('URL inválida. Verifique o link e tente novamente.');
  }

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('Usuário não autenticado. Faça login para extrair dados.');
    }

    console.log('🚀 Chamando edge function...');
    
    const { data, error } = await supabase.functions.invoke('extract-property-data', {
      body: { url },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      console.error('❌ Erro na edge function:', error);
      throw new Error(`Erro ao extrair dados: ${error.message}`);
    }

    if (!data.success) {
      console.error('❌ Extração falhou:', data.error);
      throw new Error(data.error || 'Falha na extração dos dados');
    }

    const rawData = data.data;
    console.log('📦 Dados brutos recebidos:', rawData);
    
    // Mapear e normalizar os dados
    const extractedData: ExtractedData = {
      title: String(rawData.title || ''),
      address: String(rawData.address || ''),
      bedrooms: Number(rawData.bedrooms) || 1,
      bathrooms: Number(rawData.bathrooms) || 1,
      parkingSpaces: Number(rawData.parking_spaces || rawData.parkingSpaces) || 0,
      area: Number(rawData.area) || 50,
      floor: String(rawData.floor || ''),
      rent: Number(rawData.rent) || 0,
      condo: Number(rawData.condo) || 0,
      iptu: Number(rawData.iptu) || 0,
      fireInsurance: Number(rawData.fire_insurance || rawData.fireInsurance) || 50,
      otherFees: Number(rawData.other_fees || rawData.otherFees) || 0,
      images: Array.isArray(rawData.images) ? rawData.images : [],
      scores: rawData.scores || {}
    };

    console.log('✅ Dados extraídos e normalizados:', extractedData);
    return extractedData;

  } catch (error) {
    console.error('❌ Erro no processo de extração:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Falha na extração. Verifique a URL e tente novamente.');
  }
};
