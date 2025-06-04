
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    console.log('Extraindo dados para URL:', url);

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!firecrawlApiKey || !openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'API keys não configuradas' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'span', 'div', 'p'],
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
            content: `Você é um especialista em extração de dados de imóveis. Analise o conteúdo HTML/Markdown fornecido e extraia as informações do imóvel em formato JSON.

Extraia as seguintes informações:
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

Retorne APENAS um objeto JSON válido, sem texto adicional. Se alguma informação não estiver disponível, use valores padrão razoáveis.`
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

    try {
      // Parse the JSON response from OpenAI
      const extractedData: ExtractedPropertyData = JSON.parse(extractedText);
      
      // Validate and clean the data
      const cleanedData = {
        title: extractedData.title || 'Imóvel extraído automaticamente',
        address: extractedData.address || 'Endereço não encontrado',
        bedrooms: Math.max(0, Number(extractedData.bedrooms) || 1),
        bathrooms: Math.max(0, Number(extractedData.bathrooms) || 1),
        parkingSpaces: Math.max(0, Number(extractedData.parkingSpaces) || 0),
        area: Math.max(1, Number(extractedData.area) || 50),
        floor: extractedData.floor || 'Não informado',
        rent: Math.max(0, Number(extractedData.rent) || 0),
        condo: Math.max(0, Number(extractedData.condo) || 0),
        iptu: Math.max(0, Number(extractedData.iptu) || 0),
      };

      console.log('Dados extraídos com sucesso:', cleanedData);

      return new Response(
        JSON.stringify({ success: true, data: cleanedData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (parseError) {
      console.error('Erro ao fazer parse da resposta da IA:', parseError);
      console.log('Resposta da IA:', extractedText);
      
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
