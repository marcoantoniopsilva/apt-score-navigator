import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserPreferences {
  regiaoReferencia?: string;
  faixaPreco?: string;
  valorPrincipal?: string;
  objetivo_principal?: string;
  situacao_moradia?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchQuery } = await req.json();
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');

    if (!perplexityApiKey) {
      throw new Error('Perplexity API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verificar autenticação
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    console.log('Usuário autenticado:', user.id);

    // Buscar preferências do usuário
    const { data: perfil } = await supabase
      .from('user_profiles')
      .select('regiao_referencia, faixa_preco, valor_principal, objetivo_principal, situacao_moradia')
      .eq('user_id', user.id)
      .single();

    const userPreferences: UserPreferences = perfil || {};
    console.log('Preferências do usuário:', userPreferences);

    // Construir query personalizada para Perplexity
    let searchPrompt = searchQuery || 'imóveis para alugar';
    
    if (userPreferences.regiaoReferencia) {
      searchPrompt += ` em ${userPreferences.regiaoReferencia}`;
    }
    
    if (userPreferences.faixaPreco) {
      searchPrompt += ` até ${userPreferences.faixaPreco}`;
    }

    searchPrompt += ` site:olx.com.br OR site:zapimoveis.com.br OR site:vivareal.com.br OR site:quintoandar.com.br`;

    console.log('Realizando busca no Perplexity:', searchPrompt);

    // Chamar Perplexity API
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'pplx-7b-online',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente especializado em encontrar imóveis. Encontre links diretos de anúncios de imóveis nos principais sites do Brasil. Retorne apenas URLs válidas de anúncios específicos, uma por linha.'
          },
          {
            role: 'user',
            content: `Encontre 5 anúncios de ${searchPrompt}. Retorne apenas as URLs dos anúncios, uma por linha.`
          }
        ],
        temperature: 0.2,
        max_tokens: 1000,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'week'
      }),
    });

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      console.error('Erro no Perplexity:', errorText);
      throw new Error('Falha ao buscar imóveis online');
    }

    const aiResponse = await perplexityResponse.json();
    const searchResults = aiResponse.choices[0].message.content;
    
    console.log('Resultados da busca:', searchResults);

    // Extrair URLs dos resultados
    const urlRegex = /https?:\/\/[^\s]+/g;
    const foundUrls = searchResults.match(urlRegex) || [];
    
    console.log('URLs encontradas:', foundUrls);

    // Filtrar URLs válidas de sites conhecidos
    const validUrls = foundUrls.filter(url => {
      return url.includes('olx.com.br') || 
             url.includes('zapimoveis.com.br') || 
             url.includes('vivareal.com.br') || 
             url.includes('quintoandar.com.br');
    }).slice(0, 5); // Limitar a 5 URLs

    console.log('URLs válidas filtradas:', validUrls);

    return new Response(JSON.stringify({
      success: true,
      urls: validUrls,
      searchQuery: searchPrompt,
      userPreferences
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na busca de imóveis:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});