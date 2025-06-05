
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './corsHeaders.ts';
import { scrapeWebsite } from './firecrawlService.ts';
import { extractDataWithAI } from './openaiService.ts';
import { extractImagesFromHTML } from './imageExtractor.ts';
import { processExtractedData } from './dataProcessor.ts';
import { savePropertyToDatabase } from './databaseService.ts';
import { validateUser } from './authService.ts';

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

    // Validar usuário
    const user = await validateUser(authHeader, supabaseUrl, supabaseServiceRoleKey);

    // Fazer scraping do site
    const scrapedData = await scrapeWebsite(url, firecrawlApiKey);

    // Extrair imagens do HTML
    const extractedImages = scrapedData.data?.html ? extractImagesFromHTML(scrapedData.data.html) : [];
    console.log('Imagens extraídas:', extractedImages);

    // Extrair dados estruturados com IA
    const extractedText = await extractDataWithAI(
      scrapedData.data?.markdown || scrapedData.data?.content || 'Conteúdo não disponível',
      openaiApiKey
    );

    // Processar e limpar os dados extraídos
    const cleanedData = processExtractedData(extractedText);

    // Salvar no banco de dados
    const savedProperty = await savePropertyToDatabase(
      cleanedData,
      extractedImages,
      url,
      user.id,
      supabaseUrl,
      supabaseServiceRoleKey
    );

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

  } catch (error) {
    console.error('Erro geral:', error);
    
    // Handle specific error types with appropriate status codes
    if (error.message.includes('Token de autorização') || error.message.includes('Usuário não autenticado')) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (error.message.includes('URL é obrigatória')) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
