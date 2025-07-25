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
  intencao?: string; // 'alugar' or 'comprar'
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
    .select('regiao_referencia, faixa_preco, valor_principal, intencao')
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
    valorPrincipal: perfil?.valor_principal,
    intencao: perfil?.intencao
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
  const { regiaoReferencia, intencao } = userPreferences;
  
  // Default to rent if no intention specified
  const actionType = intencao === 'comprar' ? 'comprar' : 'alugar';
  
  if (!regiaoReferencia) {
    return `imóveis para ${actionType}`;
  }

  const { tipo, termo } = determineLocationPrecision(regiaoReferencia);
  
  let searchQuery = '';
  
  if (tipo === 'bairro') {
    // Para bairros, busca muito específica
    const location = termo.includes(',') ? termo : `${termo}, Belo Horizonte`;
    searchQuery = `apartamentos para ${actionType} especificamente no bairro ${location}`;
  } else {
    // Para municípios
    searchQuery = `imóveis para ${actionType} em ${termo}`;
  }

  console.log(`Search query gerada: ${searchQuery} (tipo: ${tipo})`);
  return searchQuery;
}

async function searchWithPerplexity(searchQuery: string, locationType: 'bairro' | 'municipio'): Promise<{ urls: string[], searchContext: string }> {
  const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
  
  if (!perplexityApiKey) {
    console.log('Perplexity API key não encontrada, usando fallback inteligente');
    return {
      urls: getIntelligentFallback(searchQuery),
      searchContext: `Fallback search for ${searchQuery}...`
    };
  }

  // Tentar múltiplas estratégias de busca
  const strategies = [
    {
      name: 'specific_listings',
      prompt: buildSpecificListingsPrompt(searchQuery, locationType),
      searchFilters: ['olx.com.br', 'zapimoveis.com.br', 'vivareal.com.br', 'quintoandar.com.br']
    },
    {
      name: 'broader_search', 
      prompt: buildBroaderSearchPrompt(searchQuery, locationType),
      searchFilters: ['olx.com.br', 'zapimoveis.com.br', 'vivareal.com.br', 'quintoandar.com.br', 'imovelweb.com.br']
    },
    {
      name: 'listing_pages',
      prompt: buildListingPagesPrompt(searchQuery, locationType),
      searchFilters: ['olx.com.br', 'zapimoveis.com.br', 'vivareal.com.br']
    }
  ];

  for (const strategy of strategies) {
    console.log(`Tentando estratégia: ${strategy.name}`);
    
    try {
      const result = await executePerplexitySearch(strategy.prompt, strategy.searchFilters, perplexityApiKey);
      
      if (result.urls.length > 0) {
        console.log(`Estratégia ${strategy.name} encontrou ${result.urls.length} URLs`);
        logUrlsByDomain(result.urls);
        return result;
      }
    } catch (error) {
      console.error(`Erro na estratégia ${strategy.name}:`, error);
      continue;
    }
  }

  console.log('Todas as estratégias falharam, usando fallback inteligente');
  return {
    urls: getIntelligentFallback(searchQuery),
    searchContext: `All search strategies failed for ${searchQuery}, using intelligent fallback`
  };
}

function buildSpecificListingsPrompt(searchQuery: string, locationType: 'bairro' | 'municipio'): string {
  return `Encontre URLs ESPECÍFICAS de anúncios individuais de imóveis para: "${searchQuery}"

CRITÉRIOS RIGOROSOS:

1. LOCALIZAÇÃO EXATA ${locationType === 'bairro' ? 'NO BAIRRO' : 'NA CIDADE'}:
   - Busque imóveis na localização mencionada
   - Aceite tanto a localização exata quanto áreas próximas
   - Priorize anúncios que mencionem o bairro/cidade no título ou descrição

2. FAIXA DE PREÇO FLEXÍVEL: 
   - Aceite uma faixa ampla de preços para ter mais resultados
   - Priorize imóveis na faixa mencionada, mas aceite valores próximos

3. TIPOS DE ANÚNCIOS ACEITOS:
   - URLs de anúncios individuais específicos (PREFERENCIAL)
   - URLs de páginas de imóveis com múltiplos anúncios (ACEITÁVEL)
   - URLs de resultados de busca com filtros aplicados (ÚLTIMA OPÇÃO)

4. SITES PREFERENCIAIS:
   - olx.com.br (todas variações: mg.olx.com.br, br.olx.com.br)
   - zapimoveis.com.br (www.zapimoveis.com.br, zapimoveis.com.br)  
   - vivareal.com.br (www.vivareal.com.br, vivareal.com.br)
   - quintoandar.com.br (www.quintoandar.com.br)
   - imovelweb.com.br (www.imovelweb.com.br)

FORMATO: Retorne apenas URLs válidas, uma por linha, máximo 15 URLs.

Exemplos de URLs ACEITAS:
https://mg.olx.com.br/belo-horizonte-e-regiao/imoveis/apartamento-santo-agostinho-12345
https://www.zapimoveis.com.br/imovel/apartamento-aluguel-2-quartos-santo-agostinho-belo-horizonte
https://www.vivareal.com.br/imovel/apartamento-2-quartos-aluguel-santo-agostinho-belo-horizonte
https://www.olx.com.br/imoveis/aluguel/apartamentos/estado-mg/belo-horizonte+santo-agostinho`;
}

function buildBroaderSearchPrompt(searchQuery: string, locationType: 'bairro' | 'municipio'): string {
  return `Busque qualquer tipo de listagem ou página de imóveis para: "${searchQuery}"

ACEITE QUALQUER TIPO DE URL RELACIONADA A IMÓVEIS:
- Anúncios individuais específicos
- Páginas de listagem com filtros
- Resultados de busca pré-filtrados
- Categorias de imóveis por localização

SITES A INCLUIR:
- olx.com.br (todas as variações)
- zapimoveis.com.br 
- vivareal.com.br
- quintoandar.com.br
- imovelweb.com.br
- wimoveis.com.br

LOCALIZAÇÃO: ${locationType === 'bairro' ? 'Foque no bairro mencionado e áreas próximas' : 'Foque na cidade mencionada'}

Retorne o máximo de URLs possível relacionadas a imóveis na região.`;
}

function buildListingPagesPrompt(searchQuery: string, locationType: 'bairro' | 'municipio'): string {
  return `Encontre páginas de listagem de imóveis para: "${searchQuery}"

ACEITE ESPECIALMENTE:
- Páginas de categoria (ex: /apartamentos-aluguel-belo-horizonte/)
- Páginas de busca com filtros aplicados
- Listagens por região/bairro
- Qualquer página que mostre múltiplos imóveis

FOQUE APENAS NOS SITES:
- olx.com.br 
- zapimoveis.com.br
- vivareal.com.br

Retorne URLs de páginas que contenham listas de imóveis, mesmo que não sejam anúncios individuais.`;
}

async function executePerplexitySearch(prompt: string, searchFilters: string[], perplexityApiKey: string): Promise<{ urls: string[], searchContext: string }> {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${perplexityApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em encontrar listagens de imóveis. Retorne apenas URLs válidas, uma por linha.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      top_p: 0.9,
      max_tokens: 1500,
      return_images: false,
      return_related_questions: false,
      search_domain_filter: searchFilters,
      search_recency_filter: 'week',
      frequency_penalty: 1,
      presence_penalty: 0
    }),
  });

  if (!response.ok) {
    throw new Error(`Erro na API Perplexity: ${response.status}`);
  }

  const data = await response.json();
  console.log('Perplexity response status:', response.status);
  console.log('Perplexity response data:', JSON.stringify(data, null, 2));
  
  const content = data.choices?.[0]?.message?.content || '';
  
  // Regex expandido para capturar mais variações de URLs
  const urlRegex = /https?:\/\/(?:(?:www\.|mg\.|br\.)?(?:olx\.com\.br|zapimoveis\.com\.br|vivareal\.com\.br|quintoandar\.com\.br|imovelweb\.com\.br|wimoveis\.com\.br)\/[^\s\n\r<>"',;()]*)/gi;
  const foundUrls = content.match(urlRegex) || [];
  
  console.log(`URLs encontradas: ${JSON.stringify(foundUrls)}`);
  
  // Validação mais permissiva
  const validUrls = foundUrls.filter(url => {
    const isValidDomain = /\b(olx|zapimoveis|vivareal|quintoandar|imovelweb|wimoveis)\.com\.br/.test(url);
    const isNotHomePage = !url.match(/^https?:\/\/(?:www\.)?[^\/]+\/?$/);
    const isRelevant = 
      url.includes('imoveis') || 
      url.includes('apartament') || 
      url.includes('aluguel') || 
      url.includes('imovel') ||
      url.includes('alugar');
    
    const isValid = isValidDomain && isNotHomePage && isRelevant;
    
    if (!isValid) {
      console.log(`URL rejeitada: ${url} (domínio=${isValidDomain}, nãoHome=${isNotHomePage}, relevante=${isRelevant})`);
    } else {
      console.log(`URL aceita: ${url}`);
    }
    
    return isValid;
  });

  return {
    urls: validUrls.slice(0, 12),
    searchContext: content
  };
}

function logUrlsByDomain(urls: string[]): void {
  const domainCounts = {
    'olx.com.br': 0,
    'zapimoveis.com.br': 0,
    'vivareal.com.br': 0,
    'quintoandar.com.br': 0,
    'imovelweb.com.br': 0,
    'wimoveis.com.br': 0,
    'outros': 0
  };

  urls.forEach(url => {
    if (url.includes('olx.com.br')) domainCounts['olx.com.br']++;
    else if (url.includes('zapimoveis.com.br')) domainCounts['zapimoveis.com.br']++;
    else if (url.includes('vivareal.com.br')) domainCounts['vivareal.com.br']++;
    else if (url.includes('quintoandar.com.br')) domainCounts['quintoandar.com.br']++;
    else if (url.includes('imovelweb.com.br')) domainCounts['imovelweb.com.br']++;
    else if (url.includes('wimoveis.com.br')) domainCounts['wimoveis.com.br']++;
    else domainCounts['outros']++;
  });

  console.log('URLs encontradas por site:', JSON.stringify(domainCounts, null, 2));
}

function getIntelligentFallback(searchQuery: string): string[] {
  console.log(`Gerando fallback inteligente para: ${searchQuery}`);
  
  // Extrair informações da query
  const isSantaEfigenia = searchQuery.toLowerCase().includes('santa efigênia') || searchQuery.toLowerCase().includes('santa efigenia');
  const isSantoAgostinho = searchQuery.toLowerCase().includes('santo agostinho');
  const isSavassi = searchQuery.toLowerCase().includes('savassi');
  const isBeloHorizonte = searchQuery.toLowerCase().includes('belo horizonte');
  
  // URLs base por região e site
  const fallbackUrls: string[] = [];
  
  if (isSantaEfigenia) {
    fallbackUrls.push(
      "https://mg.olx.com.br/belo-horizonte-e-regiao/imoveis/aluguel/apartamentos?q=santa%20efigenia",
      "https://www.zapimoveis.com.br/aluguel/apartamentos/mg+belo-horizonte+santa-efigenia/",
      "https://www.vivareal.com.br/aluguel/mg/belo-horizonte/santa-efigenia/apartamento_residencial/",
      "https://www.quintoandar.com.br/alugar/imovel/santa-efigenia-belo-horizonte-mg-brasil"
    );
  } else if (isSantoAgostinho || searchQuery.includes('Santo Agostinho')) {
    fallbackUrls.push(
      "https://mg.olx.com.br/belo-horizonte-e-regiao/imoveis/aluguel/apartamentos?q=santo%20agostinho",
      "https://www.zapimoveis.com.br/aluguel/apartamentos/mg+belo-horizonte+santo-agostinho/",
      "https://www.vivareal.com.br/aluguel/mg/belo-horizonte/santo-agostinho/apartamento_residencial/",
      "https://www.quintoandar.com.br/alugar/imovel/santo-agostinho-belo-horizonte-mg-brasil"
    );
  } else if (isSavassi || searchQuery.includes('Savassi')) {
    fallbackUrls.push(
      "https://mg.olx.com.br/belo-horizonte-e-regiao/imoveis/aluguel/apartamentos?q=savassi",
      "https://www.zapimoveis.com.br/aluguel/apartamentos/mg+belo-horizonte+savassi/",
      "https://www.vivareal.com.br/aluguel/mg/belo-horizonte/savassi/apartamento_residencial/",
      "https://www.quintoandar.com.br/alugar/imovel/savassi-belo-horizonte-mg-brasil"
    );
  } else if (isBeloHorizonte) {
    fallbackUrls.push(
      "https://mg.olx.com.br/belo-horizonte-e-regiao/imoveis/aluguel/apartamentos",
      "https://www.zapimoveis.com.br/aluguel/apartamentos/mg+belo-horizonte/",
      "https://www.vivareal.com.br/aluguel/mg/belo-horizonte/apartamento_residencial/",
      "https://www.quintoandar.com.br/alugar/imovel/belo-horizonte-mg-brasil"
    );
  } else {
    // Fallback genérico
    fallbackUrls.push(
      "https://mg.olx.com.br/belo-horizonte-e-regiao/imoveis/aluguel/apartamentos",
      "https://www.zapimoveis.com.br/aluguel/apartamentos/mg+belo-horizonte/",
      "https://www.vivareal.com.br/aluguel/mg/belo-horizonte/apartamento_residencial/"
    );
  }
  
  console.log(`Fallback URLs geradas: ${JSON.stringify(fallbackUrls)}`);
  return fallbackUrls;
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