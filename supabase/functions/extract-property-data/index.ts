
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from './corsHeaders.ts';
import { scrapeWebsite } from './firecrawlService.ts';
import { extractDataWithAI } from './openaiService.ts';
import { extractImagesFromHTML, extractImagesFromMarkdown } from './imageExtractor.ts';
import { processExtractedData } from './dataProcessor.ts';
import { savePropertyToDatabase } from './databaseService.ts';

console.log('=== FUNCTION STARTED ===');

Deno.serve(async (req) => {
  console.log('=== REQUEST RECEIVED ===', req.method);
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

    // Validar usuário usando autenticação integrada
    console.log('Validando usuário...');
    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    if (!authHeader) {
      console.error('Token de autorização ausente');
      return new Response(
        JSON.stringify({ error: 'Token de autorização é obrigatório' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Erro de autenticação:', authError);
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Usuário validado:', user.id);

    // Fazer scraping do site com timeout
    console.log('Iniciando scraping...');
    let scrapedData;
    
    try {
      // Adicionar timeout de 30 segundos para scraping
      const scrapingPromise = scrapeWebsite(url, firecrawlApiKey);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout no scraping')), 30000);
      });
      
      scrapedData = await Promise.race([scrapingPromise, timeoutPromise]);
      
      console.log('Scraping concluído. Dados disponíveis:', {
        hasMarkdown: !!scrapedData.data?.markdown,
        hasContent: !!scrapedData.data?.content,
        hasHtml: !!scrapedData.data?.html,
        hasExtract: !!scrapedData.data?.extract,
        htmlLength: scrapedData.data?.html?.length || 0,
        markdownLength: scrapedData.data?.markdown?.length || 0
      });
    } catch (scrapingError) {
      console.error('Erro no scraping:', scrapingError);
      
      return new Response(
        JSON.stringify({ 
          error: `Erro ao extrair dados do site: ${scrapingError.message}. Verifique se a URL está acessível e tente novamente em alguns minutos.` 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair imagens (tentar HTML primeiro, depois Markdown)
    let extractedImages: string[] = [];
    
    if (scrapedData.data?.html && scrapedData.data.html.length > 0) {
      console.log('Extraindo imagens do HTML...');
      extractedImages = extractImagesFromHTML(scrapedData.data.html);
      console.log('Imagens extraídas do HTML:', extractedImages.length);
    } else if (scrapedData.data?.markdown && scrapedData.data.markdown.length > 0) {
      console.log('HTML não disponível, extraindo imagens do Markdown...');
      extractedImages = extractImagesFromMarkdown(scrapedData.data.markdown);
      console.log('Imagens extraídas do Markdown:', extractedImages.length);
    } else {
      console.log('Nenhum conteúdo disponível para extração de imagens');
    }

    extractedImages.forEach((img, index) => {
      console.log(`Imagem ${index + 1}:`, img);
    });

    // Extrair dados estruturados com IA com timeout
    console.log('Extraindo dados com IA...');
    const contentForAI = scrapedData.data?.markdown || scrapedData.data?.content || 'Conteúdo não disponível';
    
    if (contentForAI === 'Conteúdo não disponível') {
      return new Response(
        JSON.stringify({ 
          error: 'Não foi possível extrair conteúdo suficiente do site para análise. Verifique se o site está acessível.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    let extractedText;
    try {
      // Timeout de 20 segundos para OpenAI
      const aiPromise = extractDataWithAI(contentForAI, openaiApiKey);
      const aiTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout na extração com IA')), 20000);
      });
      
      extractedText = await Promise.race([aiPromise, aiTimeoutPromise]);
      console.log('Dados extraídos pela IA:', extractedText.substring(0, 200) + '...');
    } catch (aiError) {
      console.error('Erro na extração com IA:', aiError);
      return new Response(
        JSON.stringify({ 
          error: `Erro na análise com IA: ${aiError.message}` 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Processar e limpar os dados extraídos
    console.log('Processando dados extraídos...');
    const cleanedData = processExtractedData(extractedText);
    console.log('Dados processados:', cleanedData);

    // Salvar no banco de dados com timeout
    console.log('Salvando no banco de dados...');
    let savedProperty;
    try {
      const dbPromise = savePropertyToDatabase(
        cleanedData,
        extractedImages,
        url,
        user.id,
        supabaseUrl,
        supabaseServiceRoleKey
      );
      const dbTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout no salvamento')), 10000);
      });
      
      savedProperty = await Promise.race([dbPromise, dbTimeoutPromise]);
      console.log('Propriedade salva com ID:', savedProperty.id);
    } catch (dbError) {
      console.error('Erro no salvamento:', dbError);
      return new Response(
        JSON.stringify({ 
          error: `Erro ao salvar no banco: ${dbError.message}` 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
