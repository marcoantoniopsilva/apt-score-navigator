
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
    console.log('Chamando edge function para extração...');
    
    // Obter o token de sessão atual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('Verificando sessão:', {
      hasSession: !!session,
      sessionError: sessionError,
      userId: session?.user?.id,
      token: session?.access_token ? 'Present' : 'Missing'
    });
    
    if (sessionError) {
      console.error('Erro ao obter sessão:', sessionError);
      throw new Error(`Erro de sessão: ${sessionError.message}`);
    }
    
    if (!session) {
      console.error('Nenhuma sessão encontrada');
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
