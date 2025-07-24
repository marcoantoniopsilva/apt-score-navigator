import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface UserPreferences {
  criteriosAtivos: Array<{
    criterio_nome: string;
    peso: number;
  }>;
  regiaoReferencia?: string;
  faixaPreco?: string;
  valorPrincipal?: string;
}

export async function getUserPreferences(userId: string, supabaseUrl: string, supabaseServiceRoleKey: string): Promise<UserPreferences> {
  console.log('Buscando preferências do usuário:', userId);
  
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Buscar critérios ativos e pesos
  const { data: criterios, error: criteriosError } = await supabase
    .from('user_criteria_preferences')
    .select('criterio_nome, peso')
    .eq('user_id', userId)
    .eq('ativo', true);

  if (criteriosError) {
    console.error('Erro ao buscar critérios:', criteriosError);
  }

  // Buscar perfil do usuário
  const { data: perfil, error: perfilError } = await supabase
    .from('user_profiles')
    .select('regiao_referencia, faixa_preco, valor_principal')
    .eq('user_id', userId)
    .single();

  if (perfilError) {
    console.error('Erro ao buscar perfil:', perfilError);
  }

  console.log('Critérios encontrados:', criterios?.length || 0);
  console.log('Perfil encontrado:', !!perfil);

  return {
    criteriosAtivos: criterios || [],
    regiaoReferencia: perfil?.regiao_referencia,
    faixaPreco: perfil?.faixa_preco,
    valorPrincipal: perfil?.valor_principal
  };
}

function determineLocationPrecision(regiaoReferencia: string): { tipo: 'bairro' | 'municipio', termo: string } {
  if (!regiaoReferencia) {
    return { tipo: 'municipio', termo: '' };
  }

  // Lista de indicadores que sugerem que é um bairro específico
  const indicadoresBairro = [
    'Centro', 'Copacabana', 'Ipanema', 'Leblon', 'Botafogo', 'Flamengo', 'Tijuca',
    'Santo Agostinho', 'Savassi', 'Funcionários', 'Serra', 'Buritis', 'Belvedere',
    'Vila Madalena', 'Pinheiros', 'Vila Olímpia', 'Moema', 'Itaim Bibi', 'Jardins'
  ];

  // Se contém vírgula, provavelmente é "Bairro, Cidade"
  if (regiaoReferencia.includes(',')) {
    const partes = regiaoReferencia.split(',');
    const possevelBairro = partes[0].trim();
    
    // Verifica se a primeira parte é um bairro conhecido
    if (indicadoresBairro.some(bairro => 
      possevelBairro.toLowerCase().includes(bairro.toLowerCase())
    )) {
      return { tipo: 'bairro', termo: regiaoReferencia };
    }
  }

  // Verifica se é um bairro conhecido sem vírgula
  if (indicadoresBairro.some(bairro => 
    regiaoReferencia.toLowerCase().includes(bairro.toLowerCase())
  )) {
    return { tipo: 'bairro', termo: regiaoReferencia };
  }

  // Caso contrário, assume que é um município
  return { tipo: 'municipio', termo: regiaoReferencia };
}

function buildSearchQuery(userPreferences: UserPreferences): string {
  const { regiaoReferencia, faixaPreco, valorPrincipal } = userPreferences;
  
  if (!regiaoReferencia) {
    return "imóveis para alugar";
  }

  const { tipo, termo } = determineLocationPrecision(regiaoReferencia);
  
  let searchQuery = '';
  
  if (tipo === 'bairro') {
    // Para bairros, busca específica no bairro + proximidades
    searchQuery = `imóveis para alugar em ${termo} ou próximo`;
    
    // Se tem vírgula, inclui também a cidade
    if (termo.includes(',')) {
      const cidade = termo.split(',')[1].trim();
      searchQuery += ` ${cidade}`;
    }
  } else {
    // Para municípios, busca mais ampla
    searchQuery = `imóveis para alugar em ${termo}`;
  }

  // Adiciona informações de preço se disponível
  if (faixaPreco) {
    // Remove "R$" e formata para busca
    const preco = faixaPreco.replace(/R\$|\./g, '').trim();
    if (preco.includes('até')) {
      const valor = preco.replace('até', '').trim();
      searchQuery += ` até ${valor} reais`;
    } else if (preco.includes('-')) {
      searchQuery += ` ${preco.replace('-', ' a ')} reais`;
    }
  }

  // Adiciona o valor principal (compra/aluguel)
  if (valorPrincipal === 'comprar') {
    searchQuery = searchQuery.replace('alugar', 'comprar');
  }

  console.log(`Search query gerada: ${searchQuery} (tipo: ${tipo})`);
  return searchQuery;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== SEARCH PROPERTIES FUNCTION START ===');
    
    const { query: customQuery } = await req.json();
    
    // Obter informações do usuário autenticado
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    // Extrair o token JWT
    const token = authHeader.replace('Bearer ', '');
    
    // Verificar o token e obter o user ID
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Decodificar o JWT para obter o user ID (simplificado)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub;
    
    console.log('User ID:', userId);

    // Buscar preferências do usuário
    const userPreferences = await getUserPreferences(userId, supabaseUrl, supabaseServiceRoleKey);
    console.log('User preferences:', userPreferences);

    // Construir query de busca inteligente
    const searchQuery = customQuery || buildSearchQuery(userPreferences);
    console.log('Final search query:', searchQuery);

    // Por ora, retornar URLs simuladas baseadas na precisão da busca
    const { tipo } = determineLocationPrecision(userPreferences.regiaoReferencia || '');
    
    let urls = [];
    if (tipo === 'bairro') {
      // URLs mais específicas para bairros
      urls = [
        "https://www.olx.com.br/imoveis/aluguel/estado-mg/belo-horizonte/apartamento-santo-agostinho-1",
        "https://www.olx.com.br/imoveis/aluguel/estado-mg/belo-horizonte/apartamento-santo-agostinho-2"
      ];
    } else {
      // URLs mais amplas para municípios
      urls = [
        "https://www.olx.com.br/imoveis/aluguel/estado-mg/belo-horizonte/apartamento-centro-1",
        "https://www.olx.com.br/imoveis/aluguel/estado-mg/belo-horizonte/apartamento-savassi-2",
        "https://www.olx.com.br/imoveis/aluguel/estado-mg/belo-horizonte/apartamento-funcionarios-3"
      ];
    }

    const response = {
      success: true,
      urls,
      searchQuery,
      userPreferences,
      locationType: tipo
    };

    console.log('Returning response:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== ERROR IN SEARCH PROPERTIES ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    const errorResponse = {
      success: false,
      error: error.message || 'Unknown error occurred'
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});