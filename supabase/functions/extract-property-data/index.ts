
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedPropertyData {
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
  images?: string[];
}

// Função para extrair JSON da resposta da IA, mesmo se estiver em markdown
function extractJSONFromResponse(text: string): any {
  try {
    // Primeiro, tenta fazer parse direto
    return JSON.parse(text);
  } catch {
    // Se falhar, procura por blocos de código JSON
    const jsonBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
    const match = text.match(jsonBlockRegex);
    
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch {
        console.error('JSON encontrado em bloco de código não é válido:', match[1]);
      }
    }
    
    // Como último recurso, procura por qualquer objeto que pareça JSON
    const jsonObjectRegex = /\{[\s\S]*\}/;
    const objectMatch = text.match(jsonObjectRegex);
    
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch {
        console.error('Objeto JSON encontrado não é válido:', objectMatch[0]);
      }
    }
    
    throw new Error('Não foi possível extrair JSON válido da resposta');
  }
}

// Função para extrair imagens do HTML
function extractImagesFromHTML(html: string): string[] {
  const images: string[] = [];
  
  try {
    // Regex para encontrar tags img com src
    const imgRegex = /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi;
    let match;
    
    while ((match = imgRegex.exec(html)) !== null) {
      const src = match[1];
      
      // Filtrar apenas imagens que parecem ser fotos de propriedades
      if (src && 
          !src.includes('logo') && 
          !src.includes('icon') && 
          !src.includes('avatar') && 
          !src.includes('banner') &&
          (src.includes('jpg') || src.includes('jpeg') || src.includes('png') || src.includes('webp')) &&
          (src.startsWith('http') || src.startsWith('https') || src.startsWith('//'))) {
        
        // Converter URLs relativas em absolutas se necessário
        let fullUrl = src;
        if (src.startsWith('//')) {
          fullUrl = 'https:' + src;
        }
        
        images.push(fullUrl);
      }
    }
    
    // Remover duplicatas e limitar a 5 imagens
    return [...new Set(images)].slice(0, 5);
  } catch (error) {
    console.error('Erro ao extrair imagens do HTML:', error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter o token de autorização para identificar o usuário
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização é obrigatório' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Extraindo dados para URL:', url);

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!firecrawlApiKey || !openaiApiKey || !supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'API keys não configuradas' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verificar o usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Scrape the website using Firecrawl
    console.log('Fazendo scraping com Firecrawl...');
    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'span', 'div', 'p', 'img'],
        excludeTags: ['script', 'style', 'nav', 'footer', 'header']
      }),
    });

    if (!firecrawlResponse.ok) {
      const errorText = await firecrawlResponse.text();
      console.error('Erro no Firecrawl:', errorText);
      return new Response(
        JSON.stringify({ error: 'Falha ao fazer scraping do site' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scrapedData = await firecrawlResponse.json();
    console.log('Scraping concluído, extraindo dados estruturados...');

    // Extrair imagens do HTML
    const extractedImages = scrapedData.data?.html ? extractImagesFromHTML(scrapedData.data.html) : [];
    console.log('Imagens extraídas:', extractedImages);

    // Use OpenAI to extract structured data from the scraped content
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em extração de dados de imóveis. Analise o conteúdo HTML/Markdown fornecido e extraia as informações do imóvel.

Retorne APENAS um objeto JSON válido (sem formatação markdown ou blocos de código) com as seguintes informações:
- title: título do anúncio
- address: endereço completo
- bedrooms: número de quartos (apenas números, default 1)
- bathrooms: número de banheiros (apenas números, default 1)
- parkingSpaces: número de vagas de garagem (apenas números, default 0)
- area: área em m² (apenas números, default 50 se não encontrar)
- floor: andar (ex: "5º andar", "Térreo", "Cobertura")
- rent: valor do aluguel em reais (apenas números, sem R$)
- condo: valor do condomínio em reais (apenas números, default 0)
- iptu: valor do IPTU em reais (apenas números, default 0)

IMPORTANTE: Retorne apenas o objeto JSON, sem texto adicional, sem blocos de código markdown. Se alguma informação não estiver disponível, use valores padrão razoáveis.`
          },
          {
            role: 'user',
            content: `Extraia os dados do imóvel deste conteúdo:\n\n${scrapedData.data?.markdown || scrapedData.data?.content || 'Conteúdo não disponível'}`
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('Erro no OpenAI:', errorText);
      return new Response(
        JSON.stringify({ error: 'Falha ao processar dados com IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await openaiResponse.json();
    const extractedText = aiResponse.choices[0].message.content;

    console.log('Resposta da IA:', extractedText);

    try {
      // Use a função melhorada para extrair JSON
      const extractedData: ExtractedPropertyData = extractJSONFromResponse(extractedText);
      
      // Validate and clean the data
      const cleanedData = {
        title: extractedData.title || 'Imóvel extraído automaticamente',
        address: extractedData.address || 'Endereço não encontrado',
        bedrooms: Math.max(0, Number(extractedData.bedrooms) || 1),
        bathrooms: Math.max(0, Number(extractedData.bathrooms) || 1),
        parking_spaces: Math.max(0, Number(extractedData.parkingSpaces) || 0),
        area: Math.max(1, Number(extractedData.area) || 50),
        floor: extractedData.floor || 'Não informado',
        rent: Math.max(0, Number(extractedData.rent) || 0),
        condo: Math.max(0, Number(extractedData.condo) || 0),
        iptu: Math.max(0, Number(extractedData.iptu) || 0),
      };

      // Calcular custo total
      const totalMonthlyCost = cleanedData.rent + cleanedData.condo + cleanedData.iptu + 50; // 50 é o padrão para seguro incêndio

      // Salvar no banco de dados com as imagens extraídas
      const { data: savedProperty, error: saveError } = await supabase
        .from('properties')
        .insert({
          user_id: user.id,
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
          images: extractedImages, // Adicionar as imagens extraídas
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
        return new Response(
          JSON.stringify({ error: 'Falha ao salvar propriedade no banco de dados' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Propriedade salva com sucesso:', savedProperty);

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            ...cleanedData,
            parkingSpaces: cleanedData.parking_spaces,
            images: extractedImages
          },
          property_id: savedProperty.id,
          message: `Propriedade extraída e salva com sucesso! ${extractedImages.length > 0 ? `${extractedImages.length} imagem(ns) encontrada(s).` : 'Nenhuma imagem encontrada.'}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (parseError) {
      console.error('Erro ao fazer parse da resposta da IA:', parseError);
      console.log('Resposta da IA que causou erro:', extractedText);
      
      return new Response(
        JSON.stringify({ error: 'Falha ao processar resposta da IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
