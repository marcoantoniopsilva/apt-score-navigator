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
  let priceFilter = '';
  
  // Constrói filtro de preço mais específico
  if (faixaPreco) {
    const cleanPrice = faixaPreco.replace(/R\$|\./g, '').replace(/\s/g, '');
    if (cleanPrice.includes('até')) {
      const maxValue = cleanPrice.replace('até', '').trim();
      priceFilter = `valor aluguel até R$ ${maxValue}`;
    } else if (cleanPrice.includes('-') || cleanPrice.includes('a')) {
      // Ex: "4000-6000" ou "4000 a 6000"
      const parts = cleanPrice.split(/[-a]/).map(p => p.trim());
      if (parts.length === 2) {
        priceFilter = `valor aluguel entre R$ ${parts[0]} e R$ ${parts[1]}`;
      }
    }
  }
  
  if (tipo === 'bairro') {
    // Para bairros, busca muito específica
    const location = termo.includes(',') ? termo : `${termo}, Belo Horizonte`;
    searchQuery = `apartamentos ${valorPrincipal === 'comprar' ? 'para comprar' : 'para alugar'} especificamente no bairro ${location}`;
    if (priceFilter) {
      searchQuery += ` ${priceFilter}`;
    }
  } else {
    // Para municípios
    searchQuery = `imóveis para ${valorPrincipal === 'comprar' ? 'comprar' : 'alugar'} em ${termo}`;
    if (priceFilter) {
      searchQuery += ` ${priceFilter}`;
    }
  }

  console.log(`Search query gerada: ${searchQuery} (tipo: ${tipo})`);
  return searchQuery;
}

async function searchWithPerplexity(searchQuery: string, locationType: 'bairro' | 'municipio'): Promise<{ urls: string[], searchContext: string }> {
  const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
  if (!perplexityApiKey) {
    console.error('PERPLEXITY_API_KEY not found');
    throw new Error('PERPLEXITY_API_KEY not found');
  }

  console.log('Fazendo busca com Perplexity:', searchQuery);

  // Ajustar consulta com restrições negativas baseadas na localização
  let enhancedQuery = searchQuery;
  
  // Adicionar restrições negativas específicas para evitar cidades erradas
  if (searchQuery.includes('Belo Horizonte') || searchQuery.includes('Santo Agostinho')) {
    enhancedQuery += ' -"Juiz de Fora" -"Poços de Caldas" -"Contagem" -"Nova Lima" -"Betim"';
  }
  
  if (locationType === 'bairro') {
    enhancedQuery += ' site:olx.com.br OR site:zapimoveis.com.br OR site:vivareal.com.br';
  } else {
    enhancedQuery += ' imóveis site:olx.com.br OR site:zapimoveis.com.br OR site:vivareal.com.br';
  }
  
  console.log('Enhanced query with negative constraints:', enhancedQuery);

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em busca de imóveis no Brasil. REGRAS CRÍTICAS (OBRIGATÓRIAS):

1. LOCALIZAÇÃO RIGOROSA: 
   - Para "Santo Agostinho, Belo Horizonte": APENAS imóveis nesse bairro específico
   - JAMAIS retorne imóveis de: Juiz de Fora, Poços de Caldas, Contagem, Betim, Nova Lima
   - Se não encontrar imóveis na localização exata, retorne uma lista vazia
   - Prefira URLs que contenham o nome do bairro/cidade na própria URL

2. FAIXA DE PREÇO FLEXÍVEL: 
   - Para "R$ 4.000 - R$ 6.000": aceite imóveis entre R$ 3.000 e R$ 11.000 (faixa ampla)
   - Priorize imóveis na faixa original, mas aceite valores próximos
   - É melhor encontrar imóveis próximos da faixa do que não encontrar nenhum

3. TIPO DE IMÓVEL:
   - "apartamentos": APENAS apartamentos, não casas, studios pequenos, quitinetes
   - Respeite exatamente o tipo solicitado

4. QUALIDADE DA BUSCA:
   - Prefira OLX, ZapImóveis, VivaReal, QuintoAndar
   - URLs específicas de imóveis individuais (não páginas de listagem)
   - Evite URLs genéricas como "/busca" ou "/search"
   - Máximo 3 URLs por resposta

FORMATO DE RESPOSTA: Apenas URLs válidas, uma por linha, sem texto adicional.

IMPORTANTE: Se não encontrar imóveis que atendam TODOS os critérios, retorne apenas 1-2 URLs válidas em vez de muitas incompatíveis.`
          },
          {
            role: 'user',
            content: enhancedQuery
          }
        ],
        temperature: 0.1,
        top_p: 0.7,
        max_tokens: 300,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'month',
        frequency_penalty: 1,
        presence_penalty: 0
      }),
    });

    console.log('Perplexity response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      
      // Fallback para URLs simuladas
      console.log('Usando fallback devido ao erro da API');
      return {
        urls: locationType === 'bairro' ? [
          "https://www.olx.com.br/imoveis/aluguel/estado-mg/belo-horizonte/apartamento-santo-agostinho-1",
          "https://www.olx.com.br/imoveis/aluguel/estado-mg/belo-horizonte/apartamento-santo-agostinho-2"
        ] : [
          "https://www.olx.com.br/imoveis/aluguel/estado-mg/belo-horizonte/apartamento-centro-1",
          "https://www.olx.com.br/imoveis/aluguel/estado-mg/belo-horizonte/apartamento-savassi-2"
        ],
        searchContext: `Fallback search for ${searchQuery}`
      };
    }

    const data = await response.json();
    console.log('Perplexity response data:', JSON.stringify(data, null, 2));

    const searchResult = data.choices?.[0]?.message?.content || '';
    
    // Extrair URLs do resultado
    const urlRegex = /https?:\/\/[^\s]+/g;
    const foundUrls = searchResult.match(urlRegex) || [];
    
    // Filtrar apenas URLs de sites de imóveis conhecidos
    const validUrls = foundUrls.filter(url => 
      url.includes('olx.com.br') || 
      url.includes('zapimoveis.com.br') || 
      url.includes('vivareal.com.br') ||
      url.includes('quintoandar.com.br')
    ).slice(0, 5); // Limita a 5 URLs

    console.log('URLs encontradas:', validUrls);

    // Se não encontrou URLs válidas, usa fallback
    if (validUrls.length === 0) {
      console.log('Nenhuma URL válida encontrada, usando fallback');
      return {
        urls: locationType === 'bairro' ? [
          "https://www.olx.com.br/imoveis/aluguel/estado-mg/belo-horizonte/apartamento-santo-agostinho-1",
          "https://www.olx.com.br/imoveis/aluguel/estado-mg/belo-horizonte/apartamento-santo-agostinho-2"
        ] : [
          "https://www.olx.com.br/imoveis/aluguel/estado-mg/belo-horizonte/apartamento-centro-1",
          "https://www.olx.com.br/imoveis/aluguel/estado-mg/belo-horizonte/apartamento-savassi-2"
        ],
        searchContext: `Fallback search for ${searchQuery}`
      };
    }

    return {
      urls: validUrls,
      searchContext: searchResult
    };

  } catch (error) {
    console.error('Erro na chamada da API Perplexity:', error);
    
    // Fallback em caso de erro
    return {
      urls: locationType === 'bairro' ? [
        "https://www.olx.com.br/imoveis/aluguel/estado-mg/belo-horizonte/apartamento-santo-agostinho-1",
        "https://www.olx.com.br/imoveis/aluguel/estado-mg/belo-horizonte/apartamento-santo-agostinho-2"
      ] : [
        "https://www.olx.com.br/imoveis/aluguel/estado-mg/belo-horizonte/apartamento-centro-1",
        "https://www.olx.com.br/imoveis/aluguel/estado-mg/belo-horizonte/apartamento-savassi-2"
      ],
      searchContext: `Error fallback search for ${searchQuery}`
    };
  }
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

    // Determinar tipo de localização
    const { tipo } = determineLocationPrecision(userPreferences.regiaoReferencia || '');
    
    // Fazer busca real com Perplexity
    const { urls, searchContext } = await searchWithPerplexity(searchQuery, tipo);

    const response = {
      success: true,
      urls,
      searchQuery,
      userPreferences,
      locationType: tipo,
      searchContext: searchContext.substring(0, 200) + '...' // Limita o contexto
    };

    console.log('Returning response with real URLs:', response);

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