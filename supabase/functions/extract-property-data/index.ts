
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

    const authHeader = req.headers.get('authorization');
    console.log('=== INÍCIO DA EXTRAÇÃO ===');
    console.log('URL:', url);

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!firecrawlApiKey || !openaiApiKey || !supabaseUrl || !supabaseServiceRoleKey) {
      console.error('API keys faltando:', {
        firecrawl: !!firecrawlApiKey,
        openai: !!openaiApiKey,
        supabase: !!supabaseUrl,
        serviceRole: !!supabaseServiceRoleKey
      });
      return new Response(
        JSON.stringify({ error: 'API keys não configuradas' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar usuário
    console.log('Validando usuário...');
    const user = await validateUser(authHeader, supabaseUrl, supabaseServiceRoleKey);
    console.log('Usuário validado:', user.id);

    // Fazer scraping do site
    console.log('Iniciando scraping...');
    const scrapedData = await scrapeWebsite(url, firecrawlApiKey);
    console.log('Scraping concluído. Dados disponíveis:', {
      hasMarkdown: !!scrapedData.data?.markdown,
      hasContent: !!scrapedData.data?.content,
      hasHtml: !!scrapedData.data?.html,
      htmlLength: scrapedData.data?.html?.length || 0
    });

    // Extrair imagens do HTML
    let extractedImages: string[] = [];
    if (scrapedData.data?.html) {
      console.log('Extraindo imagens do HTML...');
      extractedImages = extractImagesFromHTML(scrapedData.data.html);
      console.log('Imagens extraídas:', extractedImages.length);
      extractedImages.forEach((img, index) => {
        console.log(`Imagem ${index + 1}:`, img);
      });
    } else {
      console.log('Nenhum HTML disponível para extração de imagens');
    }

    // Extrair dados estruturados com IA
    console.log('Extraindo dados com IA...');
    const extractedText = await extractDataWithAI(
      scrapedData.data?.markdown || scrapedData.data?.content || 'Conteúdo não disponível',
      openaiApiKey
    );
    console.log('Dados extraídos pela IA:', extractedText.substring(0, 200) + '...');

    // Processar e limpar os dados extraídos
    console.log('Processando dados extraídos...');
    const cleanedData = processExtractedData(extractedText);
    console.log('Dados processados:', cleanedData);

    // Salvar no banco de dados
    console.log('Salvando no banco de dados...');
    const savedProperty = await savePropertyToDatabase(
      cleanedData,
      extractedImages,
      url,
      user.id,
      supabaseUrl,
      supabaseServiceRoleKey
    );
    console.log('Propriedade salva com ID:', savedProperty.id);

    const responseData = {
      success: true, 
      data: {
        ...cleanedData,
        parkingSpaces: cleanedData.parking_spaces,
        images: extractedImages
      },
      property_id: savedProperty.id,
      message: `Propriedade extraída e salva com sucesso! ${extractedImages.length > 0 ? `${extractedImages.length} imagem(ns) encontrada(s).` : 'Nenhuma imagem encontrada.'}`
    };

    console.log('=== RESPOSTA FINAL ===');
    console.log('Dados da resposta:', responseData);
    console.log('=== FIM DA EXTRAÇÃO ===');

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro geral:', error);
    
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
