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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== SEARCH PROPERTIES FUNCTION START ===');
    
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    // Create Supabase client to verify user
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get user from JWT token
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Invalid authentication token');
    }

    console.log('User authenticated:', user.id);

    // Get user preferences
    const userPrefs = await getUserPreferences(user.id, supabaseUrl, supabaseServiceRoleKey);
    console.log('User preferences loaded:', userPrefs);

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      throw new Error('Invalid JSON in request body');
    }

    const { searchQuery } = body;
    console.log('Custom search query:', searchQuery);

    // Build search prompt based on user preferences
    let searchPrompt = searchQuery || 'imóveis para alugar';
    
    if (userPrefs.regiaoReferencia) {
      searchPrompt += ` em ${userPrefs.regiaoReferencia}`;
    }
    
    if (userPrefs.faixaPreco) {
      searchPrompt += ` na faixa de preço ${userPrefs.faixaPreco}`;
    }

    // Add criteria priorities
    if (userPrefs.criteriosAtivos.length > 0) {
      const topCriteria = userPrefs.criteriosAtivos
        .sort((a, b) => b.peso - a.peso)
        .slice(0, 3)
        .map(c => c.criterio_nome);
      
      searchPrompt += ` priorizando ${topCriteria.join(', ')}`;
    }

    console.log('Final search prompt:', searchPrompt);

    // Get Perplexity API key
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      throw new Error('Perplexity API key not configured');
    }

    // Search for properties using Perplexity
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
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
            content: `Você é um assistente especializado em encontrar imóveis no Brasil. 
            Responda APENAS com URLs válidas de imóveis dos sites: OLX, ZAP Imóveis, Viva Real, QuintoAndar, ou outros portais imobiliários brasileiros.
            Forneça no máximo 5 URLs, uma por linha, sem texto adicional.
            URLs devem ser links diretos para anúncios específicos de imóveis.`
          },
          {
            role: 'user',
            content: `Encontre URLs de imóveis para: ${searchPrompt}`
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 500,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'month',
        frequency_penalty: 1,
        presence_penalty: 0
      }),
    });

    if (!perplexityResponse.ok) {
      throw new Error(`Perplexity API error: ${perplexityResponse.status}`);
    }

    const perplexityData = await perplexityResponse.json();
    console.log('Perplexity response:', perplexityData);

    // Extract URLs from the response
    const content = perplexityData.choices?.[0]?.message?.content || '';
    const urls = content
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.startsWith('http'))
      .slice(0, 5); // Limit to 5 URLs

    console.log('Extracted URLs:', urls);

    if (urls.length === 0) {
      // Fallback to test URLs if no valid URLs found
      console.log('No valid URLs found, using fallback URLs');
      const fallbackUrls = [
        "https://www.olx.com.br/imoveis/aluguel/estado-mg/belo-horizonte/apartamento-3-quartos-santo-agostinho-123",
        "https://www.olx.com.br/imoveis/aluguel/estado-mg/belo-horizonte/apartamento-2-quartos-centro-456"
      ];
      
      const response = {
        success: true,
        urls: fallbackUrls,
        searchQuery: searchPrompt,
        userPreferences: {
          regiaoReferencia: userPrefs.regiaoReferencia,
          faixaPreco: userPrefs.faixaPreco,
          criteriosAtivos: userPrefs.criteriosAtivos.map(c => c.criterio_nome)
        }
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = {
      success: true,
      urls: urls,
      searchQuery: searchPrompt,
      userPreferences: {
        regiaoReferencia: userPrefs.regiaoReferencia,
        faixaPreco: userPrefs.faixaPreco,
        criteriosAtivos: userPrefs.criteriosAtivos.map(c => c.criterio_nome)
      }
    };

    console.log('Final response:', response);

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